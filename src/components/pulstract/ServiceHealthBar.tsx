import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkBackendHealth, type HealthResult } from "@/lib/backend-health.functions";

export function ServiceHealthBar({ compact = false, only }: { compact?: boolean; only?: string[] }) {
  const check = useServerFn(checkBackendHealth);
  const [health, setHealth] = useState<HealthResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await check();
      setHealth(only ? res.filter((h) => only.includes(h.name)) : res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allOk = health?.every((h) => h.ok);
  const badCount = health?.filter((h) => !h.ok).length ?? 0;
  const skeletonCount = only?.length ?? 11;

  return (
    <Card className={cn("p-3 sm:p-4", compact && "p-2 sm:p-3", only && "w-auto inline-block")}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-semibold text-sm">Service health</h2>
          {health && (
            <Badge variant={allOk ? "default" : "destructive"} className="text-[10px]">
              {allOk ? "All healthy" : `${badCount} issue${badCount === 1 ? "" : "s"}`}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={refresh} disabled={loading} className="h-7 px-2 text-xs">
          {loading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Refresh
        </Button>
      </div>
      <div className={cn("gap-1.5", only ? "flex flex-wrap" : "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11")}>
        {(health ?? Array.from({ length: skeletonCount })).map((h: any, i) => (
          <div
            key={h?.name ?? i}
            title={h ? `${h.name} · ${h.status ?? "err"} · ${h.latencyMs}ms${h.error ? " · " + h.error : ""}` : "…"}
            className={cn(
              "rounded border px-2 py-1 text-[10px] flex items-center justify-between gap-1",
              !h && "animate-pulse bg-muted/40",
              h?.ok && "border-emerald-500/40 bg-emerald-500/5",
              h && !h.ok && "border-destructive/40 bg-destructive/5",
            )}
          >
            <span className="font-semibold capitalize truncate">{h?.name ?? "…"}</span>
            {h?.ok ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : h ? (
              <XCircle className="h-3 w-3 text-destructive shrink-0" />
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
