import { Search, Bell, Globe } from "lucide-react";
import { useState } from "react";
import { LANGUAGES, type LangCode } from "@/lib/languages";
import { useLang } from "@/lib/lang-context";

export function AppHeader({ onRefresh, refreshing }: { onRefresh?: () => void; refreshing?: boolean }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const handlePick = (code: LangCode) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onRefresh} className="flex items-center gap-2 group">
          <div className={`h-9 w-9 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground font-black text-lg shadow-glow ${refreshing ? "animate-pulse-ring" : ""}`}>
            S
          </div>
          <div className="leading-tight text-left">
            <div className="font-black text-base text-foreground tracking-tight">ShareChat</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">{current.name}</div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOpen((v) => !v)}
            className="h-9 px-2.5 rounded-full hover:bg-muted flex items-center gap-1.5 text-foreground"
            aria-label="Change language"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">{current.code}</span>
          </button>
          <button className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center">
            <Search className="h-5 w-5 text-foreground" />
          </button>
          <button className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center relative">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-3 top-14 z-50 w-64 rounded-2xl bg-card shadow-pop border border-border p-2 max-h-[70vh] overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2">
              Choose language
            </div>
            <div className="grid grid-cols-2 gap-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handlePick(l.code)}
                  className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl text-left transition-colors ${
                    l.code === lang ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <span className="font-bold text-sm leading-tight">{l.name}</span>
                  <span className={`text-[10px] ${l.code === lang ? "opacity-90" : "text-muted-foreground"}`}>
                    {l.english}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
