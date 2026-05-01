import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type TrendCategory =
  | "क्रिकेट"
  | "मनोरंजन"
  | "राजनीति"
  | "समाचार"
  | "त्योहार"
  | "मौसम"
  | "टेक"
  | "बिज़नेस"
  | "वायरल"
  | "धार्मिक";

export interface TrendingTag {
  rank: number;
  tag: string; // hashtag in Hindi/English mix as used on ShareChat
  title_hi: string; // Hindi headline
  description_hi: string; // 1-line Hindi description
  category: TrendCategory;
  heat: number; // 0-100
  posts_count: string; // human readable e.g. "2.3L पोस्ट"
  sources: string[]; // e.g. ["समाचार","सोशल","सर्च"]
  emoji: string;
  region?: string; // e.g. "अखिल भारत", "महाराष्ट्र"
}

const trendsSchema = z.object({
  trends: z
    .array(
      z.object({
        rank: z.number(),
        tag: z.string(),
        title_hi: z.string(),
        description_hi: z.string(),
        category: z.string(),
        heat: z.number(),
        posts_count: z.string(),
        sources: z.array(z.string()),
        emoji: z.string(),
        region: z.string().optional(),
      })
    )
    .min(10),
});

const SYSTEM_PROMPT = `तुम ShareChat के लिए एक trending tags क्यूरेटर हो। तुम्हारा काम है: आज भारत में, खासकर हिंदी बोलने वाले दर्शकों के लिए, जो भी सबसे ज़्यादा चर्चा में है उसकी एक ranked list देना।

Sources जिन पर ध्यान देना है (अपने knowledge और reasoning से अनुमान लगाओ):
- क्रिकेट / खेल events (IPL, India matches, बड़े tournaments)
- Bollywood / OTT releases, बड़े celebrity news
- राजनीतिक events और बड़े bills/announcements
- त्योहार और धार्मिक events (Diwali, Holi, Chhath, Eid, Navratri etc.)
- मौसम events (बारिश, बाढ़, गर्मी की लहर, चक्रवात)
- बड़े national news (RBI, बजट, accidents, awards)
- वायरल social media moments, memes, reels trends
- बड़ी tech launches जो India में मायने रखती हैं (iPhone, Jio, AI)

Rules:
- कम से कम 12 trends दो
- हर trend India / Hindi audience के लिए relevant हो — obscure foreign news मत डालो
- titles और descriptions हिंदी में (Devanagari) लिखो, लेकिन hashtag का मूल नाम (#IndiaVsAustralia जैसे) रख सकते हो
- heat score 60-99 के बीच, ranked decreasingly
- description एक line का, ज़्यादा से ज़्यादा 80 अक्षर
- sources array में से चुनो: "समाचार", "सोशल", "सर्च", "OTT", "खेल फ़ीड", "मौसम API", "ट्विटर", "YouTube"
- category strictly इन में से एक: क्रिकेट, मनोरंजन, राजनीति, समाचार, त्योहार, मौसम, टेक, बिज़नेस, वायरल, धार्मिक
- आज की तारीख के हिसाब से सोचो — मौसम, season, हाल के बड़े events, upcoming festivals
- variety रखो — सिर्फ़ cricket नहीं, mix होना चाहिए`;

export const getTrendingTags = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ trends: TrendingTag[]; generated_at: string; error?: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { trends: [], generated_at: new Date().toISOString(), error: "LOVABLE_API_KEY missing" };
    }

    const today = new Date().toLocaleDateString("hi-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `आज की तारीख: ${today}. भारत में आज trending top 12 tags की ranked list दो।`,
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
                          title_hi: { type: "string" },
                          description_hi: { type: "string" },
                          category: {
                            type: "string",
                            enum: [
                              "क्रिकेट",
                              "मनोरंजन",
                              "राजनीति",
                              "समाचार",
                              "त्योहार",
                              "मौसम",
                              "टेक",
                              "बिज़नेस",
                              "वायरल",
                              "धार्मिक",
                            ],
                          },
                          heat: { type: "number" },
                          posts_count: { type: "string" },
                          sources: { type: "array", items: { type: "string" } },
                          emoji: { type: "string" },
                          region: { type: "string" },
                        },
                        required: [
                          "rank",
                          "tag",
                          "title_hi",
                          "description_hi",
                          "category",
                          "heat",
                          "posts_count",
                          "sources",
                          "emoji",
                        ],
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
        return {
          trends: [],
          generated_at: new Date().toISOString(),
          error: res.status === 429 ? "बहुत ज़्यादा requests, थोड़ी देर बाद try करें" : res.status === 402 ? "AI credits ख़त्म" : "AI gateway error",
        };
      }

      const data = await res.json();
      const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
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
  }
);

const detailSchema = z.object({
  summary_hi: z.string(),
  why_trending_hi: z.string(),
  posts: z
    .array(
      z.object({
        author: z.string(),
        handle: z.string(),
        avatar_emoji: z.string(),
        time_hi: z.string(),
        text_hi: z.string(),
        likes: z.string(),
        comments: z.string(),
        shares: z.string(),
      })
    )
    .min(3),
});

export type TrendDetail = z.infer<typeof detailSchema>;

export const getTrendDetail = createServerFn({ method: "POST" })
  .inputValidator((d: { tag: string; title_hi: string; description_hi: string; category: string }) => d)
  .handler(async ({ data }): Promise<TrendDetail & { error?: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        summary_hi: "AI service उपलब्ध नहीं है",
        why_trending_hi: "",
        posts: [],
        error: "LOVABLE_API_KEY missing",
      };
    }

    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "तुम ShareChat content team हो। एक trending tag के लिए हिंदी (Devanagari) में: (1) 2-3 lines का context summary, (2) 1 line में क्यों trending है, और (3) 3 realistic mock user posts generate करो जैसे असली ShareChat users लिखते हैं — informal, emojis के साथ, हिंदी में।",
            },
            {
              role: "user",
              content: `Tag: ${data.tag}\nTitle: ${data.title_hi}\nDescription: ${data.description_hi}\nCategory: ${data.category}`,
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
                    summary_hi: { type: "string" },
                    why_trending_hi: { type: "string" },
                    posts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          author: { type: "string" },
                          handle: { type: "string" },
                          avatar_emoji: { type: "string" },
                          time_hi: { type: "string" },
                          text_hi: { type: "string" },
                          likes: { type: "string" },
                          comments: { type: "string" },
                          shares: { type: "string" },
                        },
                        required: [
                          "author",
                          "handle",
                          "avatar_emoji",
                          "time_hi",
                          "text_hi",
                          "likes",
                          "comments",
                          "shares",
                        ],
                      },
                    },
                  },
                  required: ["summary_hi", "why_trending_hi", "posts"],
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
        return {
          summary_hi: "विवरण लोड नहीं हो सका",
          why_trending_hi: "",
          posts: [],
          error: `AI ${res.status}`,
        };
      }
      const json = await res.json();
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = detailSchema.parse(JSON.parse(args));
      return parsed;
    } catch (e) {
      console.error(e);
      return {
        summary_hi: "विवरण लोड नहीं हो सका",
        why_trending_hi: "",
        posts: [],
        error: e instanceof Error ? e.message : "Unknown",
      };
    }
  });
