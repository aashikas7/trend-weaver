import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { TrendCard } from "@/components/TrendCard";
import { getTrendingTags, type TrendingTag } from "@/server/trends.functions";
import { useLang } from "@/lib/lang-context";
import { getUI } from "@/lib/languages";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShareChat Trending" },
      { name: "description", content: "AI-powered real-time trending topics across all Indian languages." },
    ],
  }),
  component: Index,
});

function Index() {
  const { lang } = useLang();
  const ui = getUI(lang);
  const [trends, setTrends] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [activeCat, setActiveCat] = useState<string>("__ALL__");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTrendingTags({ data: { lang } });
      setTrends(res.trends);
      setGeneratedAt(res.generated_at);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { void load(); }, [load]);

  // Build categories deduplicated by category_key but keep localized display name
  const catMap = new Map<string, string>();
  trends.forEach((t) => { if (!catMap.has(t.category_key)) catMap.set(t.category_key, t.category); });
  const filtered = activeCat === "__ALL__" ? trends : trends.filter((t) => t.category_key === activeCat);

  const time = generatedAt ? new Date(generatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen bg-background relative pb-20">
        <AppHeader onRefresh={load} refreshing={loading} />

        <section className="px-4 pt-4 pb-3">
          <div className="relative overflow-hidden rounded-3xl gradient-hero p-5 text-primary-foreground shadow-glow">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-90">
                <Sparkles className="h-3.5 w-3.5" /> {ui.liveLabel}
              </div>
              <h1 className="mt-1 text-2xl font-black leading-tight whitespace-pre-line">
                {ui.heroTitle}
              </h1>
              <p className="mt-1 text-sm opacity-90">
                {ui.aiPowered} {time && `• ${time}`}
              </p>
              <button
                onClick={load}
                disabled={loading}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                {loading ? ui.loading : ui.reload}
              </button>
            </div>
          </div>
        </section>

        {trends.length > 0 && (
          <div className="sticky top-[60px] z-20 bg-background/90 backdrop-blur-md">
            <div className="overflow-x-auto no-scrollbar px-4 py-2">
              <div className="flex gap-2 w-max">
                <button
                  onClick={() => setActiveCat("__ALL__")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCat === "__ALL__" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {ui.all}
                </button>
                {Array.from(catMap.entries()).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveCat(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeCat === key ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="px-3 space-y-2.5">
          {error && (
            <div className="mx-1 my-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {loading && trends.length === 0 && <SkeletonList />}

          {filtered.map((t, i) => (
            <TrendCard key={`${t.tag}-${i}`} trend={t} index={i} />
          ))}

          {!loading && filtered.length === 0 && !error && (
            <div className="text-center text-sm text-muted-foreground py-12">
              {ui.noTrends}
            </div>
          )}
        </main>

        <footer className="px-4 mt-8 mb-4 text-center text-[10px] text-muted-foreground">
          {ui.footer}
        </footer>

        <BottomNav />
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2.5 px-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card shadow-card p-3 flex gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
