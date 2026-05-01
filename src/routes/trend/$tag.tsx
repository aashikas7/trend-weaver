import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Share2, Bookmark, Flame, Sparkles, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { z } from "zod";
import { getTrendDetail, type TrendingTag, type TrendDetail } from "@/server/trends.functions";

const searchSchema = z.object({ data: z.string().optional() });

export const Route = createFileRoute("/trend/$tag")({
  validateSearch: (s) => searchSchema.parse(s),
  component: TrendDetailPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      ट्रेंड नहीं मिला
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center text-destructive p-6 text-sm">
      {error.message}
    </div>
  ),
});

function decodeTrend(data?: string): TrendingTag | null {
  if (!data) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(data))));
  } catch {
    return null;
  }
}

function TrendDetailPage() {
  const router = useRouter();
  const { data } = Route.useSearch();
  const trend = decodeTrend(data);
  const [detail, setDetail] = useState<TrendDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trend) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getTrendDetail({
          data: {
            tag: trend.tag,
            title_hi: trend.title_hi,
            description_hi: trend.description_hi,
            category: trend.category,
          },
        });
        if (!cancelled) setDetail(res);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trend]);

  if (!trend) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
        <p className="text-muted-foreground text-sm">ट्रेंड डेटा नहीं मिला</p>
        <Link to="/" className="text-primary font-semibold">होम पर जाएँ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen bg-background relative pb-24">
        {/* Hero */}
        <div className="relative overflow-hidden gradient-hero text-primary-foreground">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative px-4 pt-4 pb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.history.back()}
                className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                <button className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Bookmark className="h-5 w-5" />
                </button>
                <button className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
                <span>#{trend.rank} ट्रेंडिंग</span>
                <span>•</span>
                <span>{trend.category}</span>
              </div>
              <div className="text-5xl mt-2">{trend.emoji}</div>
              <h1 className="mt-1 text-2xl font-black leading-tight">{trend.title_hi}</h1>
              <p className="mt-1 text-sm opacity-95">{trend.description_hi}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-mono font-bold">
                {trend.tag}
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="px-4 -mt-4">
          <div className="rounded-2xl bg-card shadow-pop p-3 grid grid-cols-3 gap-2">
            <Stat label="हीट स्कोर" value={String(trend.heat)} icon={<Flame className="h-3.5 w-3.5 text-primary" />} />
            <Stat label="पोस्ट्स" value={trend.posts_count} />
            <Stat label="क्षेत्र" value={trend.region ?? "अखिल भारत"} small />
          </div>
        </div>

        {/* Sources */}
        <div className="px-4 mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            सिग्नल स्रोत
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trend.sources.map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[11px] font-semibold">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* AI summary */}
        <section className="px-4 mt-5">
          <div className="rounded-2xl gradient-card border border-border shadow-card p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" /> AI सारांश
            </div>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ) : (
              <>
                <p className="text-sm text-foreground/90 leading-relaxed">{detail?.summary_hi}</p>
                {detail?.why_trending_hi && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      क्यों ट्रेंड कर रहा है
                    </div>
                    <p className="text-sm text-foreground/90">{detail.why_trending_hi}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Posts */}
        <section className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-base">टॉप पोस्ट्स</h2>
            <span className="text-[11px] text-muted-foreground">{trend.tag}</span>
          </div>
          {loading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl bg-card p-4 shadow-card animate-pulse">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-4/5 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {detail?.posts.map((p, i) => (
              <PostCard key={i} post={p} index={i} />
            ))}
          </div>
        </section>

        {/* Action footer */}
        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-surface/95 backdrop-blur-xl border-t border-border px-4 py-3 safe-bottom">
          <button className="w-full h-12 rounded-full gradient-hero text-primary-foreground font-bold shadow-glow active:scale-[0.98] transition-transform">
            इस ट्रेंड पर पोस्ट करें ✨
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, small }: { label: string; value: string; icon?: React.ReactNode; small?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-black ${small ? "text-sm" : "text-lg"} flex items-center justify-center gap-1`}>
        {icon}{value}
      </div>
      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function PostCard({ post, index }: { post: TrendDetail["posts"][number]; index: number }) {
  return (
    <article
      className="rounded-2xl bg-card shadow-card p-4 animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center text-xl shrink-0">
          {post.avatar_emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-foreground truncate">{post.author}</span>
            <span className="text-xs text-muted-foreground truncate">{post.handle}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{post.time_hi}</span>
          </div>
          <p className="mt-1.5 text-sm text-foreground/95 leading-relaxed whitespace-pre-line">
            {post.text_hi}
          </p>
          <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-primary">
              <Heart className="h-4 w-4" /> {post.likes}
            </button>
            <button className="flex items-center gap-1 hover:text-primary">
              <MessageCircle className="h-4 w-4" /> {post.comments}
            </button>
            <button className="flex items-center gap-1 hover:text-primary">
              <Repeat2 className="h-4 w-4" /> {post.shares}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
