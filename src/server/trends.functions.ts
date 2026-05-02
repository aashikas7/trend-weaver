import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type LangCode =
  | "hi" | "ta" | "te" | "bn" | "mr" | "kn" | "ml" |