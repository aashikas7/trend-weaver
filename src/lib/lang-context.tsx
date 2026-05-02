import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LangCode } from "@/lib/languages";

interface Ctx {
  lang: LangCode;
  setLang: (l: LangCode) => void;
}

const LangContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "sharechat-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("hi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
      if (saved) setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: LangCode) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
