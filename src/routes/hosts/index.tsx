import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, User as UserIcon, Building2, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { HOSTS, HOST_ACTIVITIES } from "@/features/app/mock-data";

export const Route = createFileRoute("/hosts/")({
  head: () => ({
    meta: [
      { title: "Find a host — Pulsatract" },
      { name: "description", content: "Browse trainers and gyms near you. Filter by activity, distance, rating and price." },
    ],
  }),
  component: HostsPage,
});

type Filters = {
  type: "all" | "person" | "gym";
  activity: string;
  distance: "any" | "1" | "5" | "10" | "25";
  minRating: "any" | "4.5" | "4.8";
  price: "any" | "low" | "mid" | "high";
  sort: "recommended" | "rating" | "distance" | "price";
};
const DEFAULTS: Filters = { type: "all", activity: "All", distance: "any", minRating: "any", price: "any", sort: "recommended" };

function HostsPage() {
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filters>({ ...DEFAULTS });

  const filtered = useMemo(() => {
    let list = HOSTS.slice();
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter((h) => h.name.toLowerCase().includes(qq) || h.activities.some((a) => a.toLowerCase().includes(qq)) || h.location.toLowerCase().includes(qq));
    }
    if (f.activity !== "All") list = list.filter((h) => h.activities.includes(f.activity));
    if (f.type !== "all") list = list.filter((h) => h.type === f.type);
    if (f.distance !== "any") list = list.filter((h) => h.distance <= Number(f.distance));
    if (f.minRating !== "any") list = list.filter((h) => h.rating >= Number(f.minRating));
    if (f.price !== "any") {
      list = list.filter((h) => f.price === "low" ? h.pricePerHour < 50 : f.price === "mid" ? h.pricePerHour >= 50 && h.pricePerHour < 75 : h.pricePerHour >= 75);
    }
    if (f.sort === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (f.sort === "distance") list.sort((a, b) => a.distance - b.distance);
    else if (f.sort === "price") list.sort((a, b) => a.pricePerHour - b.pricePerHour);
    return list;
  }, [q, f]);

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
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trainers and gyms" className="pl-9" />
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
                {(["All", ...HOST_ACTIVITIES] as string[]).map((a) => (
                  <button key={a} onClick={() => setF((p) => ({ ...p, activity: a as never }))} className={`text-xs rounded-full px-3 py-1 border transition-colors ${f.activity === a ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>{a}</button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Type">
              <Select value={f.type} onValueChange={(v) => setF((p) => ({ ...p, type: v as never }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="person">Trainers</SelectItem>
                  <SelectItem value="gym">Gyms</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Distance">
              <Select value={f.distance} onValueChange={(v) => setF((p) => ({ ...p, distance: v as never }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any distance</SelectItem>
                  <SelectItem value="1">Within 1 mi</SelectItem>
                  <SelectItem value="5">Within 5 mi</SelectItem>
                  <SelectItem value="10">Within 10 mi</SelectItem>
                  <SelectItem value="25">Within 25 mi</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Minimum rating">
              <Select value={f.minRating} onValueChange={(v) => setF((p) => ({ ...p, minRating: v as never }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="4.5">4.5+</SelectItem>
                  <SelectItem value="4.8">4.8+</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Price">
              <Select value={f.price} onValueChange={(v) => setF((p) => ({ ...p, price: v as never }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any price</SelectItem>
                  <SelectItem value="low">$ — under $50/hr</SelectItem>
                  <SelectItem value="mid">$$ — $50–$75/hr</SelectItem>
                  <SelectItem value="high">$$$ — $75+/hr</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>

            <FilterGroup label="Sort by">
              <Select value={f.sort} onValueChange={(v) => setF((p) => ({ ...p, sort: v as never }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="distance">Closest first</SelectItem>
                  <SelectItem value="price">Lowest price</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>
          </aside>

          <main>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} host{filtered.length === 1 ? "" : "s"} found</p>
            {filtered.length === 0 ? (
              <div className="text-center py-16 border rounded-xl bg-muted/30">
                <p className="font-medium">No hosts match your filters.</p>
                <Button variant="ghost" className="mt-2" onClick={() => setF({ ...DEFAULTS })}>Clear filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((h) => (
                  <Link key={h.id} to="/classes/$classId" params={{ classId: h.classId }} className="group">
                    <Card className="overflow-hidden py-0 gap-0 hover:shadow-elegant hover:-translate-y-0.5 transition-all h-full">
                      <div className="h-32 relative" style={{ background: h.image }}>
                        <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-0 capitalize">
                          {h.type === "gym" ? <><Building2 className="h-3 w-3 mr-1" />Gym</> : <><UserIcon className="h-3 w-3 mr-1" />Trainer</>}
                        </Badge>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold leading-tight">{h.name}</h3>
                          <span className="text-sm font-semibold whitespace-nowrap">${h.pricePerHour}<span className="text-[10px] font-normal text-muted-foreground">/hr</span></span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{h.bio}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.location} · {h.distance} mi</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />{h.rating} ({h.reviews})</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {h.activities.map((a) => (
                            <span key={a} className="px-2 py-0.5 rounded-full text-[10px] bg-muted border border-border">{a}</span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
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
