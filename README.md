# ShareChat ट्रेंडिंग — APM Case Study

A mobile-native prototype of an AI-powered Trending Tags system for ShareChat's Hindi-speaking, India-first audience.

---

## What this is

Two things, as required by the brief:

1. **Trending Tags System** — A backend that, on every invocation, returns a fresh ranked list of 12+ trending topics for India in Hindi, each with a description, category, heat score, posts count, source signals, emoji, and region.
2. **App Prototype** — A mobile-native, ShareChat-styled feed where users see the trending tags, tap to drill into a trend detail view that includes an AI-generated Hindi summary plus three realistic mock user posts.

Built with TanStack Start (React 19 + Vite 7), Tailwind 4, and Lovable Cloud + Lovable AI Gateway (Gemini 2.5 Flash) for live generation.

---

## Part 1 — How the system decides what's trending

### Sources & signals (modeled in the prompt)

The system is currently powered by **Gemini 2.5 Flash via the Lovable AI Gateway**, prompted to reason about — and synthesize — a daily trending list across the same signal mix that a real production pipeline would aggregate:

| Signal source         | What it captures                                      |
|-----------------------|-------------------------------------------------------|
| News feeds            | Politics, RBI, accidents, awards, big national events |
| Social platforms      | Twitter/X, Instagram, YouTube viral moments            |
| Search trends         | Rising queries (festivals, OTT, celebrity)            |
| Sports feeds          | Cricket fixtures, IPL, India national matches          |
| OTT release calendars | Big Bollywood / OTT drops                             |
| Weather APIs          | Local rain, heatwaves, cyclones, floods               |
| Calendar              | Hindu/Indian festivals & devotional events            |

In production, each of these would be a real ingestion job (RSS, X API, Google Trends, Cricbuzz, IMD, etc.) writing into a unified `signals` table; the LLM step would then re-rank and translate. For this prototype, the model is asked to reason from its own world model + freshness cues (current date passed in) — the same abstraction layer remains, just without the live ingestion adapters wired up. This keeps the prototype zero-key and instantly demoable while preserving the production-shaped contract.

### Logic & weights

The ranking logic is encoded in the system prompt + tool-calling schema:

- Output is **at least 12 trends**, decreasingly ranked.
- Each trend has a `heat` score in **60–99** so the bar visualization stays visually meaningful.
- **Category is a strict enum** (क्रिकेट / मनोरंजन / राजनीति / समाचार / त्योहार / मौसम / टेक / बिज़नेस / वायरल / धार्मिक) — eliminates open-ended garbage categories.
- **Variety constraint** — the prompt explicitly says "don't be all-cricket"; mix of genres required.
- **Geography filter** — explicit instruction to drop obscure foreign news; tech news only if genuinely viral in India.
- **Language** — descriptions and titles in Devanagari Hindi; hashtag may stay Roman (`#IndiaVsAustralia`) since that's how it's actually typed on ShareChat.

### Filters

- Strict tool-calling schema (Gemini `tool_choice` + Zod validation server-side) — anything malformed gets rejected.
- Top-12 cap; ranks renormalized to 1..12 server-side.
- Server function passes today's date in `hi-IN` locale so the model anchors freshness to today (not its training cutoff).

### Pipeline

```
                ┌──────────────────────────────┐
                │   Client (mobile-web React)  │
                │   /  →  index.tsx feed       │
                │   /trend/$tag → detail view  │
                └──────────────┬───────────────┘
                               │ RPC (TanStack server fn)
                               ▼
        ┌───────────────────────────────────────────────┐
        │  src/server/trends.functions.ts               │
        │                                               │
        │  getTrendingTags()  ──┐    getTrendDetail()   │
        │                       │            │          │
        └───────────────────────┼────────────┼──────────┘
                                ▼            ▼
                  ┌────────────────────────────────────┐
                  │   Lovable AI Gateway               │
                  │   model: google/gemini-2.5-flash   │
                  │   tool_choice: function (forced)   │
                  └────────────┬───────────────────────┘
                               ▼
                  ┌────────────────────────────────────┐
                  │ Gemini reasons over signal mix:    │
                  │ news / social / search / sports /  │
                  │ OTT / weather / festivals          │
                  │ + today's date for freshness       │
                  └────────────┬───────────────────────┘
                               ▼
                  ┌────────────────────────────────────┐
                  │ Structured JSON via tool call      │
                  │ → Zod validation → Top-12 list     │
                  │ → returned to React                │
                  └────────────────────────────────────┘
```

For each stage:

| Stage              | Tech / model                                | Why                                                                                   |
|--------------------|---------------------------------------------|---------------------------------------------------------------------------------------|
| RPC transport      | TanStack `createServerFn`                   | Type-safe, no separate API server, runs on the Worker SSR runtime                     |
| Auth / secrets     | Lovable Cloud (auto-provisioned `LOVABLE_API_KEY`) | Zero-key UX for the reviewer; never exposed client-side                          |
| Trend generation   | Gemini 2.5 Flash (Lovable AI Gateway)        | Fast (sub-second-ish), good Hindi fluency, supports forced tool-calling for structured output |
| Output validation  | Zod schema on server                         | Hard guarantee that the UI never receives a malformed object                         |
| Detail summaries   | Same model, separate prompt                  | Keeps prompts short & focused; cheaper than re-asking for everything                 |
| UI                 | React 19 + Tailwind 4 + lucide-react         | Fast to build a polished mobile-native feel                                           |

---

## Part 2 — UX rationale

**What I optimized for**
1. **Tappability over density.** ShareChat users are on phones, often with one hand. Cards are big, finger-friendly, and the rank pillar gives a strong visual anchor.
2. **Hindi-first.** Devanagari throughout (including category chips, stats, CTAs) using Noto Sans Devanagari. The hashtag stays in its original form because that's how users actually search/post.
3. **Trust signals.** Every trend shows where the signal comes from (समाचार / सोशल / सर्च / खेल फ़ीड / etc.), heat score, and post count. This is the difference between "trending" feeling magical vs. arbitrary.
4. **Heat at a glance.** Top-3 trends get a gradient rank pill; >=90 heat gets a "HOT 🔥" pill; everyone gets a heat bar. Three layers of visual weight without clutter.
5. **Instant freshness loop.** Pull-to-refresh feel: a visible "फिर से लोड करें" button + last updated time so users feel the list is alive, not cached.

**What I considered and rejected**
- **A vertical short-video first feed (TikTok-style).** Rejected for this case study — the brief is about *trending tags as an entry point*, not video consumption. Tags need to be browseable, scannable, and deep-linkable.
- **Infinite scroll of mixed content.** Rejected — would dilute the "this is *the* trending list" narrative. A bounded ranked top-12 makes the list itself feel curated and consumable.
- **Pure list with no detail page.** Rejected — without the detail view, there's nowhere for the user signal (interest in this tag) to actually convert into engagement. The detail page is the bridge from "discovery" to "post/consume".
- **Hash anchors (one-page scroll).** Rejected — separate routes give us deep-linkable trend URLs (perfect for sharing a specific trend out of WhatsApp).
- **Showing raw model JSON or "AI generated" disclaimers everywhere.** Rejected — feels engineering-y, not consumer. AI is invisible plumbing; only the AI summary card is explicitly badged.

**Detail view design**
- Heroic gradient header with rank, category, hashtag — feels like landing on a "channel" for this trend.
- Stats card overlapping the hero (classic ShareChat / Instagram pattern).
- Source chips give explainability without breaking flow.
- AI summary + "क्यों ट्रेंड कर रहा है" answers the most-asked user question right there.
- Three mock posts demonstrate what consumption would look like — generated in Hindi by the same model so they read naturally.
- Sticky "इस ट्रेंड पर पोस्ट करें" CTA — converts curiosity into creation, which is ShareChat's core loop.

---

## What I'd build next with 4 more weeks

1. **Real signal ingestion adapters** — replace pure-LLM generation with: NewsAPI / GDELT for news, X (Twitter) trending API + Reddit India for social, Google Trends Daily Search for search, Cricbuzz/ESPNCricinfo scrape for live sports, IMD for weather, and a curated festival calendar. Store in a `raw_signals` table.
2. **Two-stage ranking** — (a) a deterministic scorer that combines normalized z-scores from each source with category-specific weights and an India-relevance prior, then (b) the LLM only handles re-write into Hindi + de-dup of conceptually-similar tags. This is much cheaper, more verifiable, and auditable.
3. **Personalization** — re-rank top-30 → top-12 per user using their language, region, and recent engagement (cricket fans see cricket on top; Marathi users see Maharashtra weather first).
4. **Server-side cache + cron** — pre-generate trends every 5 min via Supabase pg_cron → write to `trending_tags` table; clients read instantly and cheaply.
5. **Anti-spam & safety** — a moderation pass before publishing (block harmful, communal, misleading tags), and a manual override panel for the curation team.
6. **Per-trend live content carousel** — replace mock posts with real ShareChat posts queried by hashtag, with short-video previews.
7. **A/B harness** — measure CTR from feed → trend, dwell time on trend, and post-from-trend rate, so each ranking change is provable.

---

## Constraints honored

| Constraint | How |
|---|---|
| ≥10 ranked trending tags per invocation | 12 returned, capped server-side |
| Each with description + category | Yes (Hindi description, enum category) |
| Freshness — reflects today, not build-time | Generated on every page load; today's date passed to the model |
| India / Hindi-speaking audience | Explicit prompt geo-filter + Devanagari output |
| Mobile-native UX | Max-width 28rem container, sticky bottom nav, safe-area insets, finger-sized targets |
| GenAI usage | Built with Lovable; trend generation uses Gemini via Lovable AI Gateway |

---

## Tech & honest acknowledgements

- **Built with** Lovable (the agent that wrote most of this code), TanStack Start, React 19, Tailwind 4, Lovable Cloud (Supabase under the hood), Lovable AI Gateway (Gemini 2.5 Flash).
- The current prototype uses an **LLM-only "synthesized" trend list** — this is intentional for a no-key, instantly demoable build, and the architecture cleanly accommodates real signal adapters as described above.
- Mock posts in the detail view are **AI-generated**, not real ShareChat content, and labeled as part of the AI summary card.

---

## Run locally

```bash
bun install
bun run dev
```

Lovable Cloud env (`LOVABLE_API_KEY`, `SUPABASE_*`) is auto-provisioned — see `.env`.
