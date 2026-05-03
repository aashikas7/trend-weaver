import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { type LangCode, getLang } from "@/lib/languages";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// In-memory rate limiter (per server instance) — token bucket per IP
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(): string {
  try {
    const req = getRequest();
    const h = req?.headers;
    if (!h) return "unknown";
    const fwd = h.get("x-forwarded-for") || h.get("cf-connecting-ip") || h.get("x-real-ip");
    if (fwd) return fwd.split(",")[0].trim();
  } catch {}
  return "unknown";
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count++;
  return true;
}

// Short-TTL cache for trending tags (per language)
const TRENDS_CACHE_TTL_MS = 10 * 60_000;
const trendsCache = new Map<string, { at: number; payload: { trends: TrendingTag[]; generated_at: string } }>();

function sanitizeField(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  // Strip control chars and collapse whitespace; cap length
  return s.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export const CATEGORY_KEYS = ["cricket", "entertainment", "politics", "news", "festival", "weather", "tech", "business", "viral", "religious"] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface TrendingTag {
  rank: number;
  tag: string;
  title: string;
  description: string;
  category: string;
  category_key: CategoryKey;
  heat: number;
  posts_count: string;
  sources: string[];
  emoji: string;
  region?: string;
}

const trendsSchema = z.object({
  trends: z.array(
    z.object({
      rank: z.number(),
      tag: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      category_key: z.enum(CATEGORY_KEYS),
      heat: z.number(),
      posts_count: z.string(),
      sources: z.array(z.string()),
      emoji: z.string(),
      region: z.string().optional(),
    })
  ).min(8),
});

function buildSystemPrompt(langPromptName: string) {
  return `You are a trending tags curator for ShareChat, India's leading vernacular social platform.

Your job: produce a ranked list of what is trending in India today, written entirely in ${langPromptName}.

Sources to consider (use your knowledge and reasoning):
- Cricket / sports events (IPL, India matches, major tournaments)
- Bollywood / OTT releases, big celebrity news
- Political events and major bills/announcements
- Festivals and religious events (Diwali, Holi, Chhath, Eid, Navratri etc.)
- Weather events (rain, floods, heatwave, cyclone)
- Major national news (RBI, budget, accidents, awards)
- Viral social media moments, memes, reels trends
- Big tech launches relevant to India (iPhone, Jio, AI)

Rules:
- Give at least 12 trends
- Every trend must be relevant to India / ${langPromptName}-speaking audience
- Write titles and descriptions in ${langPromptName}
- Hashtag can be in original form (#IndiaVsAustralia etc.)
- heat score between 60-99, ranked decreasingly
- description max 80 characters in one line
- category_key must be one of: cricket, entertainment, politics, news, festival, weather, tech, business, viral, religious
- category field should be the localized name of that category in ${langPromptName}
- sources array from: news, social, search, OTT, sports feed, weather API, Twitter, YouTube (localized)
- Think about today's date - season, recent big events, upcoming festivals
- Keep variety - not just cricket, mix different categories`;
}

export const getTrendingTags = createServerFn({ method: "GET" })
  .inputValidator((data: { lang?: string }) => data)
  .handler(async ({ data }): Promise<{ trends: TrendingTag[]; generated_at: string; error?: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { trends: [], generated_at: new Date().toISOString(), error: "LOVABLE_API_KEY missing" };
    }

    const langCode = (data?.lang ?? "hi") as LangCode;
    const lang = getLang(langCode);

    // Cache check
    const cacheKey = `trends:${langCode}`;
    const cached = trendsCache.get(cacheKey);
    if (cached && Date.now() - cached.at < TRENDS_CACHE_TTL_MS) {
      return cached.payload;
    }

    // Rate limit per IP
    const ip = getClientIp();
    if (!checkRateLimit(`trends:${ip}`)) {
      return { trends: [], generated_at: new Date().toISOString(), error: "Too many requests, try later" };
    }

    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: buildSystemPrompt(lang.promptName) },
            {
              role: "user",
              content: `Today's date: ${today}. Give me the top 12 trending tags in India, written in ${lang.promptName}.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "emit_trending_tags",
                description: "Emit ranked trending tags for ShareChat India feed",
                parameters: {
                  type: "object",
                  properties: {
                    trends: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          rank: { type: "number" },
                          tag: { type: "string" },
                          title: { type: "string", description: "Localized title" },
                          description: { type: "string", description: "Localized description, max 80 chars" },
                          category: { type: "string", description: "Localized category name" },
                          category_key: {
                            type: "string",
                            enum: ["cricket","entertainment","politics","news","festival","weather","tech","business","viral","religious"],
                          },
                          heat: { type: "number" },
                          posts_count: { type: "string" },
                          sources: { type: "array", items: { type: "string" } },
                          emoji: { type: "string" },
                          region: { type: "string" },
                        },
                        required: ["rank","tag","title","description","category","category_key","heat","posts_count","sources","emoji"],
                      },
                    },
                  },
                  required: ["trends"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "emit_trending_tags" } },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("AI gateway error", res.status, txt);
        const errMsg = res.status === 429 ? "Too many requests, try later" : res.status === 402 ? "AI credits exhausted" : "AI gateway error";
        return { trends: [], generated_at: new Date().toISOString(), error: errMsg };
      }

      const json = await res.json();
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) {
        return { trends: [], generated_at: new Date().toISOString(), error: "No tool call returned" };
      }
      const parsed = trendsSchema.parse(JSON.parse(args));
      const trends = parsed.trends.slice(0, 12).map((t, i) => ({ ...t, rank: i + 1 }) as TrendingTag);
      return { trends, generated_at: new Date().toISOString() };
    } catch (e) {
      console.error("getTrendingTags failed", e);
      return {
        trends: [],
        generated_at: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  });

const detailSchema = z.object({
  summary: z.string(),
  why_trending: z.string(),
  posts: z.array(
    z.object({
      author: z.string(),
      handle: z.string(),
      avatar_emoji: z.string(),
      time_label: z.string(),
      text: z.string(),
      likes: z.string(),
      comments: z.string(),
      shares: z.string(),
    })
  ).min(3),
});

export type TrendDetail = z.infer<typeof detailSchema>;

export const getTrendDetail = createServerFn({ method: "POST" })
  .inputValidator((d: { tag: string; title: string; description: string; category: string; lang?: string }) => d)
  .handler(async ({ data }): Promise<TrendDetail & { error?: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { summary: "AI service unavailable", why_trending: "", posts: [], error: "LOVABLE_API_KEY missing" };
    }

    const langCode = (data.lang ?? "hi") as LangCode;
    const lang = getLang(langCode);

    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are ShareChat content team. For a trending tag, generate in ${lang.promptName}: (1) 2-3 line context summary, (2) 1 line why it's trending, and (3) 3 realistic mock user posts as real ShareChat users would write - informal, with emojis, in ${lang.promptName}.`,
            },
            {
              role: "user",
              content: `Tag: ${data.tag}\nTitle: ${data.title}\nDescription: ${data.description}\nCategory: ${data.category}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "emit_trend_detail",
                parameters: {
                  type: "object",
                  properties: {
                    summary: { type: "string" },
                    why_trending: { type: "string" },
                    posts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          author: { type: "string" },
                          handle: { type: "string" },
                          avatar_emoji: { type: "string" },
                          time_label: { type: "string" },
                          text: { type: "string" },
                          likes: { type: "string" },
                          comments: { type: "string" },
                          shares: { type: "string" },
                        },
                        required: ["author","handle","avatar_emoji","time_label","text","likes","comments","shares"],
                      },
                    },
                  },
                  required: ["summary","why_trending","posts"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "emit_trend_detail" } },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("detail err", res.status, txt);
        return { summary: "Could not load details", why_trending: "", posts: [], error: `AI ${res.status}` };
      }
      const json = await res.json();
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = detailSchema.parse(JSON.parse(args));
      return parsed;
    } catch (e) {
      console.error(e);
      return { summary: "Could not load details", why_trending: "", posts: [], error: e instanceof Error ? e.message : "Unknown" };
    }
  });
