import { Link } from "@tanstack/react-router";
import { TrendingUp, Flame } from "lucide-react";
import type { TrendingTag, CategoryKey } from "@/utils/trends.functions";

const categoryStyles: Record<CategoryKey, string> = {
  cricket: "bg-emerald-100 text-emerald-800",
  entertainment: "bg-pink-100 text-pink-800",
  politics: "bg-indigo-100 text-indigo-800",
  news: "bg-blue-100 text-blue-800",
  festival: "bg-amber-100 text-amber-900",
  weather: "bg-sky-100 text-sky-800",
  tech: "bg-violet-100 text-violet-800",
  business: "bg-teal-100 text-teal-800",
  viral: "bg-rose-100 text-rose-800",
  religious: "bg-orange-100 text-orange-800",
};

export function TrendCard({ trend, index }: { trend: TrendingTag; index: number }) {
  const isHot = trend.heat >= 90;
  return (
    <Link
      to="/trend/$tag"
      params={{ tag: encodeURIComponent(trend.tag) }}
      search={{ data: btoa(unescape(encodeURIComponent(JSON.stringify(trend)))) }}
      className="block animate-fade-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <article className="relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-pop transition-all duration-300 active:scale-[0.98]">
        <div className="flex gap-3 p-3">
          {/* Rank pillar */}
          <div className="flex flex-col items-center gap-1 w-10 shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black ${
                trend.rank <= 3 ? "gradient-hero text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
              }`}
            >
              {trend.rank}
            </div>
            <div className="text-2xl leading-none mt-1">{trend.emoji}</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  categoryStyles[trend.category_key] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {trend.category}
              </span>
              {isHot && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold gradient-hot text-primary-foreground">
                  <Flame className="h-3 w-3" /> HOT
                </span>
              )}
              {trend.region && (
                <span className="text-[10px] text-muted-foreground">📍 {trend.region}</span>
              )}
            </div>

            <h3 className="font-bold text-base leading-tight text-foreground line-clamp-2">
              {trend.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {trend.description}
            </p>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
              <span className="text-xs font-mono font-semibold text-primary truncate max-w-[55%]">
                {trend.tag}
              </span>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  {trend.posts_count}
                </span>
                <HeatBar value={trend.heat} />
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function HeatBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full gradient-hero rounded-full transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="font-mono font-bold text-foreground/80 w-7 text-right">{value}</span>
    </div>
  );
}
