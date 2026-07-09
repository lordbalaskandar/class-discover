import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

/**
 * Small fixed pill that appears whenever any TanStack Query is fetching
 * or any mutation is in flight. Covers all live-backend calls in the
 * mobile preview without touching individual screens.
 */
export function GlobalLoadingIndicator() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const busy = fetching + mutating;
  if (!busy) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-background/90 backdrop-blur px-3 py-1.5 text-xs shadow-md"
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      <span className="text-muted-foreground">
        {mutating > 0 ? "Saving…" : "Loading…"}
      </span>
    </div>
  );
}
