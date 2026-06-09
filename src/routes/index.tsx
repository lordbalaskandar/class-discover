import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
import { Calendar, MapPin, Clock, Search, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dryvon — Book pilates, boxing, pickleball and more" },
      { name: "description", content: "Browse local fitness classes and book in seconds." },
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

const HERO_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1920&q=70",
    label: "Pilates",
  },
  {
    src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=70",
    label: "Boxing",
  },
  {
    src: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1920&q=70",
    label: "Pickleball",
  },
  {
    src: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1920&q=70",
    label: "HIIT",
  },
  {
    src: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1920&q=70",
    label: "Yoga",
  },
  {
    src: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1920&q=70",
    label: "Rock Climbing",
  },
];

function BrowsePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState<string | null>(null);

  // Hero form state
  const [heroActivity, setHeroActivity] = useState<string>("any");
  const [heroLocation, setHeroLocation] = useState("");
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

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
    return classes.filter((c) => {
      if (activity && c.activity !== activity) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.activity.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [classes, search, activity]);

  function onHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    if (heroActivity && heroActivity !== "any") setActivity(heroActivity);
    else setActivity(null);
    setSearch(heroLocation);
    // scroll to results
    const el = document.getElementById("results");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero — AutoTrader-style search card on top of a carousel backdrop */}
      <section className="relative overflow-hidden border-b">
        {/* Carousel background */}
        <div className="absolute inset-0">
          {HERO_SLIDES.map((s, i) => (
            <img
              key={s.src}
              src={s.src}
              alt={`${s.label} class`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                i === slide ? "opacity-100" : "opacity-0"
              }`}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/75 via-foreground/55 to-primary/40" />
        </div>

        <div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-28">
          <div className="max-w-3xl text-primary-foreground">
            <Badge className="bg-background/15 text-primary-foreground border-background/30 backdrop-blur mb-4">
              {HERO_SLIDES[slide].label} · and so much more
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Find your next <span className="text-accent">class</span>.
            </h1>
            <p className="mt-3 text-lg text-primary-foreground/90 max-w-xl">
              Search thousands of pilates, boxing, pickleball and wellness sessions near you — book in seconds.
            </p>
          </div>

          {/* Search card */}
          <form
            onSubmit={onHeroSearch}
            className="relative mt-8 max-w-4xl rounded-2xl bg-background shadow-elegant border p-4 md:p-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.3fr_auto] gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground px-1">Activity</label>
                <Select value={heroActivity} onValueChange={setHeroActivity}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Any activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any activity</SelectItem>
                    {ACTIVITIES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground px-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={heroLocation}
                    onChange={(e) => setHeroLocation(e.target.value)}
                    placeholder="City, neighborhood, or studio"
                    className="pl-9 h-12 text-base"
                  />
                </div>
              </div>

              <div className="flex md:items-end">
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full md:w-auto md:px-8 bg-gradient-hero hover:opacity-90 shadow-elegant"
                >
                  <Search className="h-4 w-4" />
                  Search classes
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Popular:</span>
              {["Pilates", "Boxing", "Pickleball", "Yoga", "HIIT"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setHeroActivity(p);
                    setActivity(p);
                    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-full border px-3 py-1 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </form>

          {/* Slide dots */}
          <div className="relative mt-6 flex gap-1.5">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                aria-label={`Show ${s.label}`}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-8 bg-primary-foreground" : "w-3 bg-primary-foreground/50 hover:bg-primary-foreground/80"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Activity chips */}
      <section id="results" className="container mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={activity === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActivity(null)}
            className="rounded-full"
          >
            All
          </Button>
          {ACTIVITIES.map((a) => (
            <Button
              key={a}
              variant={activity === a ? "default" : "outline"}
              size="sm"
              onClick={() => setActivity(a)}
              className="rounded-full whitespace-nowrap"
            >
              {a}
            </Button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 pb-16 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-medium">No classes match your search</p>
            <p className="text-muted-foreground mt-1">Try a different activity or location.</p>
            <Button asChild className="mt-4 bg-gradient-hero" onClick={() => { setActivity(null); setSearch(""); }}>
              <Link to="/">Clear filters</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <ClassCard key={c.id} cls={c} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Dryvon · Move together
      </footer>
    </div>
  );
}

function ClassCard({ cls }: { cls: ClassRow }) {
  const when = cls.start_at ? new Date(cls.start_at) : null;
  return (
    <Link
      to="/classes/$classId"
      params={{ classId: cls.id }}
      className="group block"
    >
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
