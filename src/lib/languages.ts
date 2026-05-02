export type LangCode =
  | "hi" | "ta" | "te" | "bn" | "mr" | "kn" | "ml" | "gu"
  | "pa" | "or" | "as" | "bho" | "raj" | "hr" | "en";

export interface Language {
  code: LangCode;
  name: string;
  english: string;
  sample: string;
}

export const LANGUAGES: Language[] = [
  { code: "hi",  name: "हिन्दी",        english: "Hindi",      sample: "नमस्ते" },
  { code: "ta",  name: "தமிழ்",         english: "Tamil",      sample: "வணக்கம்" },