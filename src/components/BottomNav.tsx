import { Link } from "@tanstack/react-router";
import { Home, Compass, Video, Bell, User } from "lucide-react";

export function BottomNav() {
  const items = [
    { icon: Home, label: "होम", to: "/" as const, active: true },
    { icon: Compass, label: "ट्रेंड्स", to: "/" as const },
    { icon: Video, label: "वीडियो", to: "/" as const },
    { icon: Bell, label: "सूचना", to: "/" as const },
    { icon: User, label: "प्रोफ़ाइल", to: "/" as const },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-border bg-surface/95 backdrop-blur-xl safe-bottom">
      <ul className="flex items-center justify-around px-2 py-2">
        {items.map((it, i) => (
          <li key={i}>
            <Link
              to={it.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${
                it.active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <it.icon className="h-5 w-5" strokeWidth={it.active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
