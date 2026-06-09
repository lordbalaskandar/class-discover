import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { Calendar, MapPin, Clock, Search, Users, SlidersHorizontal, X } from "lucide-react";

const browseSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  activity: fallback(z.string(), "").default(""),
  location: fallback(z.string(), "").default(""),
  type: fallback(z.enum(["all", "scheduled", "on_request"]), "all").default("all"),
  sort: fallback(z.enum(["newest", "soonest", "duration"]), "newest").default("newest"),
});

export const Route = createFileRoute("/browse")({
  validateSearch: zodValidator(browseSearchSchema),
  head: () => ({
    meta: [
      { title: "Browse classes — Dryvon" },
      { name: "description", content: "Search and filter local fitness classes — pilates, boxing, pickleball and more." },
    ],
  }),
  component: BrowsePage,
});

type ClassRow = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  activity: string;
  location: string;
  image_url: string | null;
  duration_min: number;
  booking_type: "scheduled" | "on_request";
  start_at: string | null;
  capacity: number | null;
};

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });

  // Local form state synced with URL
  const [q, setQ] = useState(search.q);
  const [location, setLocation] = useState(search.location);

  useEffect(() => { setQ(search.q); }, [search.q]);
  useEffect(() => { setLocation(search.location); }, [search.location]);

  const updateSearch = (patch: Partial<typeof search>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, host_id, title, description, activity, location, image_url, duration_min, booking_type, start_at, capacity")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClassRow[];
    },
  });

  const filtered = useMemo(() => {
    let result = classes.filter((c) => {
      if (search.activity && c.activity !== search.activity) return false;
      if (search.type !== "all" && c.booking_type !== search.type) return false;
      if (search.location) {
        const loc = search.location.toLowerCase();
        if (!c.location.toLowerCase().includes(loc)) return false;
      }
      if (search.q) {
        const qq = search.q.toLowerCase();
        return (
          c.title.toLowerCase().includes(qq) ||
          c.description.toLowerCase().includes(qq) ||
          c.activity.toLowerCase().includes(qq) ||
          c.location.toLowerCase().includes(qq)
        );
      }
      return true;
    });
    if (search.sort === "soonest") {
      result = [...result].sort((a, b) => {
        const at = a.start_at ? new Date(a.start_at).getTime() : Infinity;
        const bt = b.start_at ? new Date(b.start_at).getTime() : Infinity;
        return at - bt;
      });
    } else if (search.sort === "duration") {
      result = [...result].sort((a, b) => a.duration_min - b.duration_min);
    }
    return result;
  }, [classes, search]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch({ q, location });
  };

  const hasFilters = search.q || search.activity || search.location || search.type !== "all";

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
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
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
                  onClick={() => navigate({ search: { q: "", activity: "", location: "", type: "all", sort: "newest" } })}
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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Booking type</label>
              <Select value={search.type} onValueChange={(v) => updateSearch({ type: v as typeof search.type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="on_request">On request</SelectItem>
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
                  <SelectItem value="duration">Shortest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </aside>

          {/* Results */}
          <main>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "class" : "classes"} found`}
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
                <p className="text-muted-foreground mt-1">Try a different activity, location, or clear filters.</p>
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
        © {new Date().getFullYear()} Dryvon · Move together
      </footer>
    </div>
  );
}

function ClassCard({ cls }: { cls: ClassRow }) {
  const when = cls.start_at ? new Date(cls.start_at) : null;
  return (
    <Link to="/classes/$classId" params={{ classId: cls.id }} className="group block">
      <Card className="overflow-hidden shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5 py-0 gap-0">
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {cls.image_url ? (
            <img src={cls.image_url} alt={cls.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-3xl font-bold">
              {cls.activity}
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-0">{cls.activity}</Badge>
          {cls.booking_type === "on_request" && (
            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground border-0">On request</Badge>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1">{cls.title}</h3>
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{cls.location}</div>
            {when && (
              <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />
                {when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </div>
            )}
            <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{cls.duration_min} min{cls.capacity ? <><span className="mx-1">·</span><Users className="h-3.5 w-3.5" />{cls.capacity} spots</> : null}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
