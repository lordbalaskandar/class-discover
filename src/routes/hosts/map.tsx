import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Building2, List } from "lucide-react";
import { gql, Q_GYMS, type ApiGym } from "@/lib/pulstract/api";

export const Route = createFileRoute("/hosts/map")({
  head: () => ({ meta: [{ title: "Hosts map — Pulstract" }] }),
  component: MapPage,
});

// Deterministic pseudo-random coord fallback for gyms without lat/lng
function fallbackCoord(id: string): { lat: number; lng: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const lat = 51.5 + ((h % 1000) / 1000) * 0.2 - 0.1;
  const lng = -0.12 + (((h >> 10) % 1000) / 1000) * 0.3 - 0.15;
  return { lat, lng };
}

function MapPage() {
  const { data: gyms = [], isLoading } = useQuery({
    queryKey: ["hosts", "map", "gyms"],
    queryFn: async () => {
      const d = await gql<{ gyms: { items: ApiGym[] } }>(Q_GYMS, { p: { limit: 100 } }, null);
      return d.gyms?.items ?? [];
    },
  });

  const positioned = useMemo(
    () =>
      gyms.map((g) => {
        const lat = g.address?.lat ?? fallbackCoord(g.id).lat;
        const lng = g.address?.lng ?? fallbackCoord(g.id).lng;
        return { ...g, lat, lng };
      }),
    [gyms],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = positioned.find((p) => p.id === selectedId) ?? positioned[0] ?? null;

  const bbox = useMemo(() => {
    if (positioned.length === 0) return null;
    return {
      minLat: Math.min(...positioned.map((p) => p.lat)),
      maxLat: Math.max(...positioned.map((p) => p.lat)),
      minLng: Math.min(...positioned.map((p) => p.lng)),
      maxLng: Math.max(...positioned.map((p) => p.lng)),
    };
  }, [positioned]);

  const toXY = (lat: number, lng: number) => {
    if (!bbox) return { x: 50, y: 50 };
    const pad = 0.02;
    const x = ((lng - (bbox.minLng - pad)) / ((bbox.maxLng + pad) - (bbox.minLng - pad))) * 100;
    const y = 100 - ((lat - (bbox.minLat - pad)) / ((bbox.maxLat + pad) - (bbox.minLat - pad))) * 100;
    return { x, y };
  };

  return (
    <AppShell
      title="Map"
      topbarActions={<Button asChild variant="outline" size="sm"><Link to="/hosts"><List className="h-4 w-4" /> List view</Link></Button>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] h-[calc(100vh-3.5rem)]">
        <div className="relative bg-[radial-gradient(circle_at_20%_20%,hsl(var(--muted))_0%,transparent_50%),radial-gradient(circle_at_80%_60%,hsl(var(--accent)/.3)_0%,transparent_50%)] border-r overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.3 }} />
          {positioned.map((h) => {
            const { x, y } = toXY(h.lat, h.lng);
            const active = selected?.id === h.id;
            const price = h.monthlyPriceCents ? `£${(h.monthlyPriceCents / 100).toFixed(0)}` : "—";
            return (
              <button
                key={h.id}
                onClick={() => setSelectedId(h.id)}
                className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={h.name}
              >
                <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-elegant transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-background text-foreground border"}`}>
                  <Building2 className="h-3 w-3" />
                  {price}
                </div>
                <div className={`mx-auto h-2 w-2 -mt-1 rotate-45 ${active ? "bg-primary" : "bg-background border-b border-r"}`} />
              </button>
            );
          })}
          <div className="absolute top-4 left-4 rounded-lg bg-background/90 backdrop-blur border px-3 py-2 text-xs text-muted-foreground flex items-center gap-2 shadow-sm">
            <MapPin className="h-3.5 w-3.5" /> {isLoading ? "Loading…" : `${positioned.length} hosts`}
          </div>
        </div>

        <aside className="flex flex-col overflow-hidden">
          {selected && (
            <Card className="m-4 overflow-hidden py-0 gap-0 shrink-0">
              <div className="h-24 bg-gradient-hero" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-tight">{selected.name}</h3>
                    {selected.address?.city && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{selected.address.city}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">Studio</Badge>
                </div>
                {selected.description && <p className="text-xs mt-2 text-muted-foreground line-clamp-2">{selected.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  {typeof selected.rating === "number" ? (
                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3 w-3 fill-primary text-primary" />{selected.rating.toFixed(1)}{selected.totalRatings ? ` (${selected.totalRatings})` : ""}
                    </span>
                  ) : <span />}
                  {selected.monthlyPriceCents ? (
                    <span className="text-sm font-semibold">£{(selected.monthlyPriceCents / 100).toFixed(0)}<span className="text-[10px] font-normal text-muted-foreground">/mo</span></span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground py-2">All hosts</p>
            {positioned.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedId(h.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${selected?.id === h.id ? "bg-accent border-primary" : "hover:bg-muted/50"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">{h.name}</p>
                  {h.monthlyPriceCents && <span className="text-xs font-semibold">£{(h.monthlyPriceCents / 100).toFixed(0)}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {h.address?.city ?? "—"}{typeof h.rating === "number" ? ` · ★ ${h.rating.toFixed(1)}` : ""}
                </p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
