import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Two-app switcher — User app (browse/book/saved) vs Host app (dashboard/gym/earnings).
 * Purely a visual pivot: both apps live in this codebase for now, but the pill makes it
 * obvious to stakeholders which flow they're viewing. Route: anything under /host is Host
 * mode, everything else is User mode.
 */
export function AppSwitcher({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHost = pathname === "/host" || pathname.startsWith("/host/");

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border bg-muted/50 p-0.5 text-xs font-medium",
        className,
      )}
      role="tablist"
      aria-label="Switch app"
    >
      <Link
        to="/browse"
        search={{
          q: "", activity: "", location: "", category: "all", type: "all",
          when: "any", duration: "any", capacity: "any", spots: "any",
          media: "any", sort: "newest",
        }}
        role="tab"
        aria-selected={!isHost}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors",
          !isHost
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Compass className="h-3.5 w-3.5" />
        <span>User</span>
      </Link>
      <Link
        to="/host"
        role="tab"
        aria-selected={isHost}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors",
          isHost
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutDashboard className="h-3.5 w-3.5" />
        <span>Host</span>
      </Link>
    </div>
  );
}
