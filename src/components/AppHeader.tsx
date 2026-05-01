import { Search, Bell } from "lucide-react";

export function AppHeader({ onRefresh, refreshing }: { onRefresh?: () => void; refreshing?: boolean }) {
  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onRefresh} className="flex items-center gap-2 group">
          <div className={`h-9 w-9 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground font-black text-lg shadow-glow ${refreshing ? "animate-pulse-ring" : ""}`}>
            S
          </div>
          <div className="leading-tight text-left">
            <div className="font-black text-base text-foreground tracking-tight">ShareChat</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">भारत की आवाज़</div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center">
            <Search className="h-5 w-5 text-foreground" />
          </button>
          <button className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center relative">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
      </div>
    </header>
  );
}
