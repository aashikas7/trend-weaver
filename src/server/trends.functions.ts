import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LANGUAGES, type LangCode, getLang } from "@/lib/languages";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const langCodes = LANGUAGES.map((l) => l.code) as [LangCode, ...LangCode[]];

export const CATEGORY_KEYS = ["cricket", "entertainment", "politics", "news", "festival", "weather", "tech", "business", "viral", "religious
