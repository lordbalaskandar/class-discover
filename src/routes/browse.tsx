import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { gql, Q_CLASSES, type ApiClass } from "@/lib/pulstract/api";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITIES } from "@/lib/activities";
import { Calendar, MapPin, Clock, Search, SlidersHorizontal, X, Star } from "lucide-react";

const browseSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  activity: fallback(z.string(), "").default(""),
  city: fallback(z.string(), "").default(""),
  priceMax: fallback(z.string(), "").default(""),
  minRating: fallback(z.string(), "").default(""),
  when: fallback(z.enum(["any", "today", "tomorrow", "this_week", "this_weekend", "next_week"]), "any").default("any"),
  sort: fallback(z.enum(["newest", "soonest", "price"]), "newest").default("newest"),
});

const DEFAULTS = {
  q: "",
  activity: "",
  city: "",
  priceMax: "",
  minRating: "",
  when: "any",
  sort: "newest",
} as const;

export const Route = createFileRoute("/browse")({
  validateSearch: zodValidator(browseSearchSchema),
  head: () => ({
    meta: [
      { title: "Browse classes — Pulstract" },
      { name: "description", content: "Search live fitness classes near you — filter by activity, city, price and rating." },
    ],
  }),
  component: BrowsePage,
});

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function whenRange(when: string): { from: Date; to: Date } | null {
  const now = new Date();
  const today = startOfDay(now);
  switch (when) {
    case "today": return { from: today, to: addDays(today, 1) };
    case "tomorrow": return { from: addDays(today, 1), to: addDays(today, 2) };
    case "this_week": {
      const dow = today.getDay();
      const daysToSun = (7 - dow) % 7 || 7;
      return { from: today, to: addDays(today, daysToSun) };
    }
    case "this_weekend": {
      const dow = today.getDay();
      const toSat = (6 - dow + 7) % 7;
      const sat = addDays(today, toSat);
      return { from: sat, to: addDays(sat, 2) };
    }
    case "next_week": {
      const dow = today.getDay();
      const toNextMon = ((8 - dow) % 7) || 7;
      const mon = addDays(today, toNextMon);
      return { from: mon, to: addDays(mon, 7) };
    }
    default: return null;
  }
}

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });

  const [q, setQ] = useState(search.q);
  const [city, setCity] = useState(search.city);

  useEffect(() => { setQ(search.q); }, [search.q]);
  useEffect(() => { setCity(search.city); }, [search.city]);

  const updateSearch = (patch: Partial<typeof search>) => {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });
  };

  // Server-side filters (public — no auth). Combine with client-side "when" range + text search.
  const range = whenRange(search.when);
  const filter: Record<string, unknown> = {};
  if (search.activity) filter.activityType = search.activity;
  if (search.city) filter.city = search.city;
  if (search.priceMax) filter.priceMax = Math.round(Number(search.priceMax) * 100);
  if (search.minRating) filter.minRating = Number(search.minRating);
  if (range) {
    filter.startAfter = range.from.toISOString();
    filter.startBefore = range.to.toISOString();
  }

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["browse", "classes", filter],
    queryFn: async () => {
      const d = await gql<{ classes: { items: ApiClass[] } }>(
        Q_CLASSES,
        { f: Object.keys(filter).length ? filter : null, p: { limit: 60 } },
        null,
      );
      return d.classes?.items ?? [];
    },
  });

  const filtered = useMemo(() => {
    let result = items;
    if (search.q) {
      const qq = search.q.toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(qq) ||
        (c.description ?? "").toLowerCase().includes(qq) ||
        c.activityType.toLowerCase().includes(qq) ||
        (c.gymName ?? "").toLowerCase().includes(qq) ||
        (c.city ?? "").toLowerCase().includes(qq),
      );
    }
    if (search.sort === "soonest") {
      result = [...result].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    } else if (search.sort === "price") {
      result = [...result].sort((a, b) => a.priceCents - b.priceCents);
    }
    return result;
  }, [items, search.q, search.sort]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch({ q, city });
  };

  const hasFilters =
    search.q || search.activity || search.city ||
    search.priceMax || search.minRating ||
    search.when !== "any";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Search bar */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-5">
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_auto] gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search classes, activities or studios"
                className="pl-9 h-11"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="pl-9 h-11"
              />
            </div>
            <Button type="submit" size="lg" className="h-11 bg-gradient-hero hover:opacity-90">
              <Search className="h-4 w-4" /> Search
            </Button>
          </form>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Filters sidebar */}
          <aside className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</h2>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ search: { ...DEFAULTS } })}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activity</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => updateSearch({ activity: "" })}
                  className={`text-xs rounded-full px-3 py-1 border transition-colors ${search.activity === "" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
                >
                  All
                </button>
                {ACTIVITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => updateSearch({ activity: a })}
                    className={`text-xs rounded-full px-3 py-1 border transition-colors ${search.activity === a ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">When</label>
              <Select value={search.when} onValueChange={(v) => updateSearch({ when: v as typeof search.when })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Anytime</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="this_week">This week</SelectItem>
                  <SelectItem value="this_weekend">This weekend</SelectItem>
                  <SelectItem value="next_week">Next week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max price (£)</label>
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                value={search.priceMax}
                onChange={(e) => updateSearch({ priceMax: e.target.value })}
                placeholder="e.g. 15"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Minimum rating</label>
              <Select value={search.minRating || "any"} onValueChange={(v) => updateSearch({ minRating: v === "any" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="4">4.0+</SelectItem>
                  <SelectItem value="4.5">4.5+</SelectItem>
                  <SelectItem value="4.8">4.8+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sort by</label>
              <Select value={search.sort} onValueChange={(v) => updateSearch({ sort: v as typeof search.sort })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="soonest">Soonest</SelectItem>
                  <SelectItem value="price">Lowest price</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </aside>

          {/* Results */}
          <main>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading…" : `${filtered.length} class${filtered.length === 1 ? "" : "es"} found`}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 border rounded-xl bg-muted/30">
                <p className="text-lg font-medium">No classes match your search</p>
                <p className="text-muted-foreground mt-1">Try a different activity, city, or clear filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((c) => (
                  <ClassCard key={c.id} cls={c} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Pulstract · Move together
      </footer>
    </div>
  );
}

function ClassCard({ cls }: { cls: ApiClass }) {
  const when = cls.startAt ? new Date(cls.startAt) : null;
  const priceLabel = cls.priceCents ? `£${(cls.priceCents / 100).toFixed(2)}` : "Free";
  const where = [cls.gymName, cls.city].filter(Boolean).join(" · ") || "TBD";
  return (
    <Link to="/classes/$classId" params={{ classId: cls.id }} className="group block">
      <Card className="overflow-hidden shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5 py-0 gap-0">
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          <div className="h-full w-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {cls.activityType}
          </div>
          <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-0">{cls.activityType}</Badge>
          <Badge className="absolute top-3 right-3 border-0 bg-primary text-primary-foreground">{priceLabel}</Badge>
        </div>
        <CardContent className="p-5">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1">{cls.title}</h3>
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{where}</div>
            {when && (
              <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />
                {when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </div>
            )}
            <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{cls.durationMinutes} min · {cls.capacity} spots</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
