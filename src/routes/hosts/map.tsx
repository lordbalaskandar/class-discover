import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Building2, User as UserIcon, List } from "lucide-react";
import { HOSTS, type HostItem } from "@/features/app/mock-data";

export const Route = createFileRoute("/hosts/map")({
  head: () => ({ meta: [{ title: "Hosts map — Dryvon" }] }),
  component: MapPage,
});

// Bounding box derived from HOSTS lat/lng; lay them out on a simple positioned
// SVG-ish overlay so users get a "map-like" spatial view without an API key
// dependency. Real map can be dropped in later via the existing HostsMap mobile
// component.
const minLat = Math.min(...HOSTS.map((h) => h.lat));
const maxLat = Math.max(...HOSTS.map((h) => h.lat));
const minLng = Math.min(...HOSTS.map((h) => h.lng));
const maxLng = Math.max(...HOSTS.map((h) => h.lng));
const pad = 0.02;

function toXY(h: HostItem) {
  const x = ((h.lng - (minLng - pad)) / ((maxLng + pad) - (minLng - pad))) * 100;
  const y = 100 - ((h.lat - (minLat - pad)) / ((maxLat + pad) - (minLat - pad))) * 100;
  return { x, y };
}

function MapPage() {
  const [selected, setSelected] = useState<HostItem | null>(HOSTS[0] ?? null);

  return (
    <AppShell
      title="Map"
      topbarActions={<Button asChild variant="outline" size="sm"><Link to="/hosts"><List className="h-4 w-4" /> List view</Link></Button>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] h-[calc(100vh-3.5rem)]">
        {/* Map canvas */}
        <div className="relative bg-[radial-gradient(circle_at_20%_20%,hsl(var(--muted))_0%,transparent_50%),radial-gradient(circle_at_80%_60%,hsl(var(--accent)/.3)_0%,transparent_50%)] border-r overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" style={{ backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          {HOSTS.map((h) => {
            const { x, y } = toXY(h);
            const active = selected?.id === h.id;
            return (
              <button
                key={h.id}
                onClick={() => setSelected(h)}
                className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={h.name}
              >
                <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-elegant transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-background text-foreground border"}`}>
                  {h.type === "gym" ? <Building2 className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                  ${h.pricePerHour}
                </div>
                <div className={`mx-auto h-2 w-2 -mt-1 rotate-45 ${active ? "bg-primary" : "bg-background border-b border-r"}`} />
              </button>
            );
          })}
          <div className="absolute top-4 left-4 rounded-lg bg-background/90 backdrop-blur border px-3 py-2 text-xs text-muted-foreground flex items-center gap-2 shadow-sm">
            <MapPin className="h-3.5 w-3.5" /> San Francisco · {HOSTS.length} hosts
          </div>
        </div>

        {/* Selected host panel + list */}
        <aside className="flex flex-col overflow-hidden">
          {selected && (
            <Card className="m-4 overflow-hidden py-0 gap-0 shrink-0">
              <div className="h-24" style={{ background: selected.image }} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-tight">{selected.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{selected.location} · {selected.distance} mi
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{selected.type === "gym" ? "Gym" : "Trainer"}</Badge>
                </div>
                <p className="text-xs mt-2 text-muted-foreground line-clamp-2">{selected.bio}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs flex items-center gap-1 text-muted-foreground"><Star className="h-3 w-3 fill-primary text-primary" />{selected.rating} ({selected.reviews})</span>
                  <span className="text-sm font-semibold">${selected.pricePerHour}<span className="text-[10px] font-normal text-muted-foreground">/hr</span></span>
                </div>
                <Button asChild className="w-full mt-3 bg-gradient-hero shadow-elegant">
                  <Link to="/classes/$classId" params={{ classId: selected.classId }}>View classes</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground py-2">All hosts</p>
            {HOSTS.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelected(h)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${selected?.id === h.id ? "bg-accent border-primary" : "hover:bg-muted/50"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">{h.name}</p>
                  <span className="text-xs font-semibold">${h.pricePerHour}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{h.location} · {h.distance} mi · ★ {h.rating}</p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
