# ShareChat Trending — APM Case Study

A mobile-native prototype of an AI-powered Trending Tags system for ShareChat, built for India's vernacular audience across **15 languages** (Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati, Punjabi, Odia, Assamese, Bhojpuri, Rajasthani, Haryanvi + English).

- **Live prototype:** _add your published URL here_
- **GitHub repo:** _add your repo URL here_
- **Loom walkthrough:** _add your video URL here_

---

## What this is

1. **Trending Tags System** — a backend that, on every invocation, returns a freshly ranked list of 12 trending topics for India in the user's chosen language. Each tag carries a title, description, category, heat score, post count, source signals, emoji and region.
2. **App Prototype** — a mobile-native, ShareChat-styled feed. Tap a tag → drill into a detail view with an AI-generated summary, "why it's trending" and three realistic mock user posts.

Built with **TanStack Start (React 19 + Vite 7)**, **Tailwind 4**, **Lovable Cloud**, and **Lovable AI Gateway → Gemini 2.5 Flash**.

---

## Part 1 — How the system decides what's trending

### Sources & signals

The prototype is powered by Gemini 2.5 Flash, prompted to reason across the same signal mix a real production pipeline would aggregate:

| Signal | What it captures |
|---|---|
| News feeds | Politics, RBI, accidents, awards, national events |
| Social (X / Insta / YT) | Viral moments, reels trends, memes |
| Search trends | Rising queries — festivals, OTT, celebrity |
| Sports feeds | IPL, India matches, major tournaments |
| OTT calendars | Big Bollywood / OTT releases |
| Weather APIs | Rain, heatwave, cyclones, floods |
| Festival calendar | Hindu/Indian devotional events |

In production each is a real ingestion job (RSS, X API, Google Trends, Cricbuzz, IMD, festival calendars) writing into a unified `signals` table; the LLM step then re-ranks + translates per language. For this prototype, the model reasons from its world model + today's date — same architecture, no live ingestion adapters wired yet. Zero-key, instantly demoable.

### Logic, weights & filters

Encoded in the system prompt + tool-calling schema:

- **≥12 trends** ranked decreasingly; server caps at 12 and renormalizes ranks.
- **Heat score 60–99** so the bar viz stays visually meaningful.
- **Strict category enum** (cricket / entertainment / politics / news / festival / weather / tech / business / viral / religious) — no garbage categories.
- **Variety constraint** — prompt explicitly forbids all-cricket; mix of genres required.
- **Geo filter** — India-relevant only; obscure foreign news dropped; tech only if viral in India.
- **Language constraint** — titles, descriptions, mock posts all written in the user's selected language/script. Hashtag may stay Roman (`#IndiaVsAustralia`) since that's how it's actually typed.
- **Freshness** — today's date is passed into the prompt every call so the model anchors to "now".
- **Schema validation** — Zod parses the model's tool call server-side; malformed output is rejected.

### Pipeline (workflow diagram)

```
 ┌─────────────────────────────┐
 │  Mobile client (React)      │
 │  /          → feed          │
 │  /trend/$id → detail        │
 │  Lang switcher → 15 langs   │
 └──────────────┬──────────────┘
                │ TanStack server fn (typed RPC)
                ▼
 ┌──────────────────────────────────────┐
 │  src/server/trends.functions.ts      │
 │   getTrendingTags({ lang })          │
 │   getTrendDetail({ tag, lang, ... }) │
 └──────────────┬───────────────────────┘
                │ inject today's date + lang
                ▼
 ┌──────────────────────────────────────┐
 │  Lovable AI Gateway                  │
 │  model: google/gemini-2.5-flash      │
 │  tool_choice: forced function call   │
 └──────────────┬───────────────────────┘
                ▼
 ┌──────────────────────────────────────┐
 │  Gemini reasons over signal mix:     │
 │  news / social / search / sports /   │
 │  OTT / weather / festivals + date    │
 │  → outputs in target language        │
 └──────────────┬───────────────────────┘
                ▼
 ┌──────────────────────────────────────┐
 │  Server: Zod validate → top-12       │
 │  → renormalize ranks → return JSON   │
 └──────────────┬───────────────────────┘
                ▼
 ┌──────────────────────────────────────┐
 │  Client: render cards with rank /    │
 │  heat / source chips / category      │
 └──────────────────────────────────────┘
```

| Stage | Tech | Why |
|---|---|---|
| RPC | TanStack `createServerFn` | Type-safe, no separate API server, runs on Worker SSR |
| Secrets | Lovable Cloud (`LOVABLE_API_KEY` auto-provisioned) | Zero-key UX for reviewer; never exposed to client |
| Generation | Gemini 2.5 Flash | Fast, multilingual fluency, supports forced tool-calling |
| Validation | Zod | UI never receives a malformed object |
| UI | React 19 + Tailwind 4 | Fast to build polished mobile-native feel |

---

## Part 2 — UX rationale

**What I optimized for**
1. **Tappability over density.** ShareChat users are on phones, often one-handed. Cards are big, finger-friendly; the rank pillar gives a strong visual anchor.
2. **Vernacular-first.** All 15 supported languages render in their native script with the right Noto Sans font. Hashtags stay Roman because that's how users actually search/post.
3. **Trust signals.** Every trend shows where the signal came from (news / social / search / sports feed / etc.), heat score, post count. This is the difference between trending feeling magical vs. arbitrary.
4. **Heat at a glance.** Top-3 get a gradient rank pill; ≥90 heat earns a "HOT 🔥" pill; everyone gets a heat bar. Three layers of visual weight without clutter.
5. **Instant freshness loop.** Visible reload + "last updated" time so the list feels alive, not cached.

**Considered and rejected**
- **TikTok-style vertical video feed** — brief is about *trending tags as an entry point*, not video consumption.
- **Infinite scroll of mixed content** — dilutes the curated "this is *the* top-12" narrative.
- **Pure list, no detail page** — kills the bridge from "discovery" to "engagement".
- **Single-page hash anchors** — separate routes give us deep-linkable trend URLs (shareable on WhatsApp).
- **Auto-detect language only** — many Indian users are bilingual; an explicit switcher respects user agency.
- **Showing raw model JSON / "AI-generated" disclaimers everywhere** — feels engineering-y. AI is invisible plumbing; only the AI summary card is explicitly badged.

**Detail view design.** Heroic gradient header with rank, category, hashtag (feels like landing on a "channel"). Stats card overlaps the hero (classic ShareChat / Insta pattern). Source chips give explainability without breaking flow. AI summary + "why it's trending" answers the most-asked user question right there. Three mock posts demo what consumption looks like, in the user's language. Sticky "post on this trend" CTA converts curiosity → creation, which is ShareChat's core loop.

---

## What I'd build next (4 more weeks)

1. **Real signal ingestion adapters** — NewsAPI/GDELT, X API + Reddit India, Google Trends Daily, Cricbuzz, IMD, festival calendars → `raw_signals` table.
2. **Two-stage ranking** — (a) deterministic scorer with normalized z-scores per source + India-relevance prior, then (b) LLM only re-writes into the target language and de-dups conceptually-similar tags. Cheaper, verifiable, auditable.
3. **Personalization** — re-rank top-30 → top-12 per user using language, region, recent engagement (cricket fans see cricket; Marathi users see Maharashtra weather first).
4. **Server-side cache + cron** — pre-generate every 5 min via pg_cron → `trending_tags` table; clients read instantly.
5. **Safety pass** — moderation before publishing (block harmful, communal, misleading); manual override for the curation team.
6. **Live content carousel** — replace mock posts with real ShareChat posts queried by hashtag, with short-video previews.
7. **A/B harness** — measure feed→trend CTR, dwell time, post-from-trend rate, so each ranking change is provable.

---

## Constraints honored

| Constraint | How |
|---|---|
| ≥10 ranked trending tags per invocation | 12, capped server-side |
| Each with description + category | Yes, in the user's language with enum-validated category |
| Freshness — reflects today | Today's date injected into every call |
| India / vernacular audience | Geo + language constraint in prompt; 15 languages supported |
| Mobile-native UX | Max-w-md container, sticky bottom nav, finger-sized targets |
| GenAI usage | Built with Lovable; trends + summaries via Gemini 2.5 Flash |

## Tech & honest acknowledgements

- **Built with** Lovable (the agent that wrote most of the code), TanStack Start, React 19, Tailwind 4, Lovable Cloud, Lovable AI Gateway (Gemini 2.5 Flash).
- Current prototype uses an **LLM-only synthesized trend list** — intentional for a no-key, instantly demoable build. Architecture cleanly accommodates real adapters as described above.
- Mock posts in the detail view are AI-generated (not real ShareChat content) and labelled inside the AI summary card.

## Run locally

```bash
bun install
bun run dev
```

Lovable Cloud env (`LOVABLE_API_KEY`, `SUPABASE_*`) is auto-provisioned — see `.env`.
