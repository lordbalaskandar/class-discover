import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Building2, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { gql, Q_GYMS, type ApiGym } from "@/lib/pulstract/api";
import { ACTIVITIES } from "@/lib/activities";

export const Route = createFileRoute("/hosts/")({
  head: () => ({
    meta: [
      { title: "Find a host — Pulstract" },
      { name: "description", content: "Browse gyms and studios near you. Filter by activity, city, rating and price." },
    ],
  }),
  component: HostsPage,
});

type Filters = {
  activity: string;
  city: string;
  minRating: "any" | "4" | "4.5" | "4.8";
  sort: "recommended" | "rating" | "priceLow" | "priceHigh";
};
const DEFAULTS: Filters = { activity: "All", city: "", minRating: "any", sort: "recommended" };

function HostsPage() {
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filters>({ ...DEFAULTS });

  const filter: Record<string, unknown> = {};
  if (f.activity !== "All") filter.activityType = f.activity;
  if (f.city.trim()) filter.city = f.city.trim();
  if (f.minRating !== "any") filter.minRating = Number(f.minRating);

  const { data: gyms = [], isLoading } = useQuery({
    queryKey: ["hosts", "gyms", filter],
    queryFn: async () => {
      const d = await gql<{ gyms: { items: ApiGym[] } }>(
        Q_GYMS,
        { f: Object.keys(filter).length ? filter : null, p: { limit: 60 } },
        null,
      );
      return d.gyms?.items ?? [];
    },
  });

  const filtered = useMemo(() => {
    let list = gyms.slice();
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter((h) =>
        h.name.toLowerCase().includes(qq) ||
        (h.description ?? "").toLowerCase().includes(qq) ||
        (h.amenities ?? []).some((a) => a.toLowerCase().includes(qq)) ||
        (h.address?.city ?? "").toLowerCase().includes(qq),
      );
    }
    if (f.sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (f.sort === "priceLow") list.sort((a, b) => (a.monthlyPriceCents ?? Infinity) - (b.monthlyPriceCents ?? Infinity));
    else if (f.sort === "priceHigh") list.sort((a, b) => (b.monthlyPriceCents ?? 0) - (a.monthlyPriceCents ?? 0));
    return list;
  }, [gyms, q, f.sort]);

  const activeCount = Object.entries(f).filter(([k, v]) => v !== (DEFAULTS as never)[k]).length;

  return (
    <AppShell
      title="Hosts"
      topbarActions={
        <Button asChild variant="outline" size="sm"><Link to="/hosts/map"><MapIcon className="h-4 w-4" /> Map view</Link></Button>
      }
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground">Discover</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Find a host</h1>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search studios, amenities or cities" className="pl-9" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <aside className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</h2>
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setF({ ...DEFAULTS })} className="h-7 text-xs"><X className="h-3 w-3" /> Clear</Button>
              )}
            </div>

            <FilterGroup label="Activity">
              <div className="flex flex-wrap gap-1.5">
                {(["All", ...ACTIVITIES] as string[]).map((a) => (
                  <button key={a} onClick={() => setF((p) => ({ ...p, activity: a }))} className={`text-xs rounded-full px-3 py-1 border transition-colors ${f.activity === a ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>{a}</button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="City">
              <Input value={f.city} onChange={(e) => setF((p) => ({ ...p, city: e.target.value }))} placeholder="e.g. London" />
            </FilterGroup>

            <FilterGroup label="Minimum rating">
              <Select value={f.minRating} onValueChange={(v) => setF((p) => ({ ...p, minRating: v as Filters["minRating"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="4">4.0+</SelectItem>
                  <SelectItem value="4.5">4.5+</SelectItem>
                  <SelectItem value="4.8">4.8+</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Sort by">
              <Select value={f.sort} onValueChange={(v) => setF((p) => ({ ...p, sort: v as Filters["sort"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="priceLow">Lowest monthly price</SelectItem>
                  <SelectItem value="priceHigh">Highest monthly price</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>
          </aside>

          <main>
            <p className="text-sm text-muted-foreground mb-4">
              {isLoading ? "Loading…" : `${filtered.length} host${filtered.length === 1 ? "" : "s"} found`}
            </p>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 border rounded-xl bg-muted/30">
                <p className="font-medium">No hosts match your filters.</p>
                <Button variant="ghost" className="mt-2" onClick={() => setF({ ...DEFAULTS })}>Clear filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((h) => {
                  const monthly = h.monthlyPriceCents ? `£${(h.monthlyPriceCents / 100).toFixed(0)}` : null;
                  return (
                    <Card key={h.id} className="overflow-hidden py-0 gap-0 hover:shadow-elegant hover:-translate-y-0.5 transition-all h-full">
                      <div className="h-32 relative bg-gradient-hero">
                        <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-0">
                          <Building2 className="h-3 w-3 mr-1" />Studio
                        </Badge>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold leading-tight">{h.name}</h3>
                          {monthly && <span className="text-sm font-semibold whitespace-nowrap">{monthly}<span className="text-[10px] font-normal text-muted-foreground">/mo</span></span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{h.description ?? "No description yet."}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          {h.address?.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.address.city}</span>}
                          {typeof h.rating === "number" && (
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />{h.rating.toFixed(1)}{h.totalRatings ? ` (${h.totalRatings})` : ""}</span>
                          )}
                        </div>
                        {(h.amenities?.length ?? 0) > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {h.amenities!.slice(0, 4).map((a) => (
                              <span key={a} className="px-2 py-0.5 rounded-full text-[10px] bg-muted border border-border">{a}</span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
