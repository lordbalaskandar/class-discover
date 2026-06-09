import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ACTIVITIES } from "@/lib/activities";
import { Calendar, MapPin, Clock, Search, Users } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Movely — Book pilates, boxing, pickleball and more" },
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

function BrowsePage() {
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <img
          src={heroImg}
          alt="People in a sunlit pilates studio"
          className="absolute inset-0 h-full w-full object-cover"
          width={1600}
          height={1024}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/40 to-primary/40" />
        <div className="container relative mx-auto px-4 py-20 md:py-28 text-primary-foreground">
          <Badge className="bg-background/15 text-primary-foreground border-background/30 backdrop-blur mb-4">
            Move your body, your way
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold max-w-3xl leading-tight">
            Book the best <span className="text-accent">pilates, boxing, pickleball</span> & more near you.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-primary-foreground/90">
            One place to discover local classes and reserve your spot — or request a session that fits your schedule.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by class, activity, or city…"
                className="pl-9 h-12 bg-background text-foreground border-0 shadow-elegant"
              />
            </div>
            <Button asChild size="lg" className="h-12 bg-gradient-hero hover:opacity-90 shadow-elegant">
              <Link to="/host">List your class</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Activity chips */}
      <section className="container mx-auto px-4 py-6">
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
            <p className="text-lg font-medium">No classes yet</p>
            <p className="text-muted-foreground mt-1">Be the first — list a class to get started.</p>
            <Button asChild className="mt-4 bg-gradient-hero">
              <Link to="/host">Become a host</Link>
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
        © {new Date().getFullYear()} Movely · Move together
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
