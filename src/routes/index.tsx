import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { TrendCard } from "@/components/TrendCard";
import { getTrendingTags, type TrendingTag } from "@/server/trends.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShareChat ट्रेंडिंग — आज भारत क्या देख रहा है" },
      {
        name: "description",
        content: "रियल-टाइम ट्रेंडिंग टॉपिक्स — क्रिकेट, मनोरंजन, समाचार, त्योहार और वायरल मोमेंट्स।",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [trends, setTrends] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [activeCat, setActiveCat] = useState<string>("सभी");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTrendingTags();
      setTrends(res.trends);
      setGeneratedAt(res.generated_at);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "लोड नहीं हो सका");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cats = ["सभी", ...Array.from(new Set(trends.map((t) => t.category)))];
  const filtered = activeCat === "सभी" ? trends : trends.filter((t) => t.category === activeCat);

  const time = generatedAt
    ? new Date(generatedAt).toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen bg-background relative pb-20">
        <AppHeader onRefresh={load} refreshing={loading} />

        {/* Hero strip */}
        <section className="px-4 pt-4 pb-3">
          <div className="relative overflow-hidden rounded-3xl gradient-hero p-5 text-primary-foreground shadow-glow">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-90">
                <Sparkles className="h-3.5 w-3.5" /> लाइव ट्रेंड्स
              </div>
              <h1 className="mt-1 text-2xl font-black leading-tight">
                आज भारत क्या<br />बात कर रहा है?
              </h1>
              <p className="mt-1 text-sm opacity-90">
                AI-संचालित • {time && `अपडेटेड ${time}`}
              </p>
              <button
                onClick={load}
                disabled={loading}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                {loading ? "लोड हो रहा है…" : "फिर से लोड करें"}
              </button>
            </div>
          </div>
        </section>

        {/* Category chips */}
        {trends.length > 0 && (
          <div className="sticky top-[60px] z-20 bg-background/90 backdrop-blur-md">
            <div className="overflow-x-auto no-scrollbar px-4 py-2">
              <div className="flex gap-2 w-max">
                {cats.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCat(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeCat === c
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* List */}
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
              इस श्रेणी में कोई ट्रेंड नहीं
            </div>
          )}
        </main>

        <footer className="px-4 mt-8 mb-4 text-center text-[10px] text-muted-foreground">
          Powered by Lovable AI • स्रोत: समाचार, सोशल, सर्च, खेल फ़ीड
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
