export type LangCode =
  | "hi" | "ta" | "te" | "bn" | "mr" | "kn" | "ml" | "gu"
  | "pa" | "or" | "as" | "bho" | "raj" | "hr" | "en";

export interface Language {
  code: LangCode;
  name: string;        // Native name
  english: string;     // English name
  fontClass: string;   // tailwind font class
  sample: string;      // sample greeting for UI
}

export const LANGUAGES: Language[] = [
  { code: "hi",  name: "हिन्दी",     english: "Hindi",     fontClass: "font-devanagari", sample: "नमस्ते" },
  { code: "ta",  name: "தமிழ்",      english: "Tamil",     fontClass: "font-tamil",      sample: "வணக்கம்" },
  { code: "te",