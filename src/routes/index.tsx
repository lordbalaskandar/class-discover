import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITIES } from "@/lib/activities";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Search,
  Calendar,
  Sparkles,
  Users,
  Compass,
  Clock,
  CalendarDays,
  UserCheck,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dryvon — Book classes and trainers near you" },
      { name: "description", content: "Discover fixed-day classes and book personal trainers for your own schedule — pilates, boxing, pickleball, yoga and more." },
    ],
  }),
  component: HomePage,
});

const HERO_SLIDES = [
  { src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1920&q=70", label: "Pilates" },
  { src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1920&q=70", label: "Boxing" },
  { src: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1920&q=70", label: "Pickleball" },
  { src: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1920&q=70", label: "HIIT" },
  { src: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1920&q=70", label: "Yoga" },
  { src: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1920&q=70", label: "Rock Climbing" },
];

type FeaturedRow = {
  id: string;
  title: string;
  activity: string;
  location: string;
  image_url: string | null;
  duration_min: number;
  start_at: string | null;
  listing_type: "class" | "trainer";
};

const baseSearch: { q: string; activity: string; location: string; category: "all" | "class" | "trainer"; type: "all" | "scheduled" | "on_request"; when: "any" | "today" | "tomorrow" | "this_week" | "this_weekend" | "next_week"; duration: "any" | "short" | "medium" | "long"; capacity: "any" | "private" | "small" | "medium" | "large"; spots: "any" | "available"; media: "any" | "with_image"; sort: "newest" | "soonest" | "duration" } = { q: "", activity: "", location: "", category: "all", type: "all", when: "any", duration: "any", capacity: "any", spots: "any", media: "any", sort: "newest" };

function HomePage() {
  const navigate = useNavigate();
  const [heroActivity, setHeroActivity] = useState<string>("any");
  const [heroLocation, setHeroLocation] = useState("");

  const { data: featured = [] } = useQuery({
    queryKey: ["featured", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, title, activity, location, image_url, duration_min, start_at, listing_type")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as FeaturedRow[];
    },
  });

  function onHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/browse",
      search: { ...baseSearch, activity: heroActivity === "any" ? "" : heroActivity, location: heroLocation },
    });
  }

  const scrollSlides = [...HERO_SLIDES, ...HERO_SLIDES];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 overflow-hidden">
          <div className="flex h-full w-max animate-netflix-scroll" style={{ willChange: "transform" }}>
            {scrollSlides.map((s, i) => (
              <div key={`${s.src}-${i}`} className="relative h-full w-[40vw] min-w-[320px] flex-shrink-0 overflow-hidden">
                <img src={s.src} alt={`${s.label} class`} className="h-full w-full object-cover" loading={i < HERO_SLIDES.length ? "eager" : "lazy"} />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/20" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-background/75 via-background/55 to-primary/40" />
        </div>

        <div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-28">
          <div className="max-w-3xl text-foreground">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Unlock your <span className="text-primary">potential</span>.
            </h1>
            <p className="mt-3 text-lg text-foreground/90 max-w-xl">
              Book scheduled sessions or hire personal trainers around your availability — all in one place.
            </p>
          </div>

          <form onSubmit={onHeroSearch} className="relative mt-8 max-w-4xl rounded-2xl bg-background shadow-elegant border p-4 md:p-5">
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
                      <SelectItem key={a} value={a}>{a}</SelectItem>
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
                <Button type="submit" size="lg" className="h-12 w-full md:w-auto md:px-8 bg-gradient-hero hover:opacity-90 shadow-elegant">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Popular:</span>
              {["Pilates", "Boxing", "Pickleball", "Yoga", "HIIT"].map((p) => (
                <Link
                  key={p}
                  to="/browse"
                  search={{ ...baseSearch, activity: p }}
                  className="rounded-full border px-3 py-1 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {p}
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* Featured carousel */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Featured this week</h2>
              <p className="text-muted-foreground mt-1">Hand-picked classes and trainers near you.</p>
            </div>
            <Link to="/browse" search={baseSearch} className="text-sm font-medium text-primary hover:underline hidden sm:inline">
              See all →
            </Link>
          </div>
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-4">
              {featured.map((f) => (
                <CarouselItem key={f.id} className="pl-4 basis-[80%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <FeaturedCard item={f} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </section>
      )}

      {/* Browse by category */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Browse by category</h2>
          <p className="text-muted-foreground mt-1">Two ways to move — pick what fits your week.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CategoryCard
            to="/browse"
            search={{ ...baseSearch, category: "class" }}
            title="Classes"
            tagline="Group sessions on a fixed day & time"
            description="Drop into reformer pilates, boxing fundamentals, pickleball open play and more."
            image="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=70"
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <CategoryCard
            to="/browse"
            search={{ ...baseSearch, category: "trainer" }}
            title="Trainers"
            tagline="Book a coach around your availability"
            description="1-on-1 personal trainers and instructors. Pick a time that works for you."
            image="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=70"
            icon={<UserCheck className="h-5 w-5" />}
          />
        </div>
      </section>

      {/* Browse by activity */}
      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Browse by activity</h2>
            <p className="text-muted-foreground mt-1">Pick what you love. Or try something new.</p>
          </div>
          <Link to="/browse" search={baseSearch} className="text-sm font-medium text-primary hover:underline hidden sm:inline">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {HERO_SLIDES.map((s) => (
            <Link
              key={s.label}
              to="/browse"
              search={{ ...baseSearch, activity: s.label }}
              className="group relative aspect-square overflow-hidden rounded-xl shadow-card hover:shadow-elegant transition-all"
            >
              <img src={s.src} alt={s.label} className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 text-primary-foreground font-semibold">{s.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">How Dryvon works</h2>
          <p className="text-center text-muted-foreground mt-2">Three simple steps to your next session.</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Compass, title: "Discover", body: "Browse local classes and trainers filtered by activity, time and location." },
              { icon: Calendar, title: "Book", body: "Reserve a scheduled class or request a time with a trainer." },
              { icon: Users, title: "Show up", body: "Meet your host, move together, repeat. It's free to book." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border bg-background p-6 shadow-card">
                <div className="h-10 w-10 rounded-lg bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-elegant">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hosts CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-gradient-hero text-primary-foreground p-10 md:p-14 shadow-elegant relative overflow-hidden">
          <Sparkles className="absolute top-6 right-6 h-12 w-12 opacity-20" />
          <div className="max-w-2xl">
            <Badge className="bg-background/20 text-primary-foreground border-background/30 mb-3">For hosts</Badge>
            <h2 className="text-2xl md:text-4xl font-bold">Teach what you love.</h2>
            <p className="mt-3 text-primary-foreground/90">
              List your classes or trainer profile on Dryvon and fill seats faster. Free to get started.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/host">Become a host</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Dryvon · Move together
      </footer>
    </div>
  );
}

function FeaturedCard({ item }: { item: FeaturedRow }) {
  const when = item.start_at ? new Date(item.start_at) : null;
  return (
    <Link to="/classes/$classId" params={{ classId: item.id }} className="group block h-full">
      <Card className="overflow-hidden shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5 py-0 gap-0 h-full">
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {item.activity}
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-0">{item.activity}</Badge>
          <Badge className={`absolute top-3 right-3 border-0 ${item.listing_type === "trainer" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
            {item.listing_type === "trainer" ? "Trainer" : "Class"}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold leading-tight line-clamp-1">{item.title}</h3>
          <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{item.location}</div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {when
                ? when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
                : `${item.duration_min} min · by appointment`}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CategoryCard({
  to,
  search,
  title,
  tagline,
  description,
  image,
  icon,
}: {
  to: string;
  search: typeof baseSearch;
  title: string;
  tagline: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      search={search}
      className="group relative overflow-hidden rounded-2xl shadow-card hover:shadow-elegant transition-all h-72 block"
    >
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-tr from-foreground/85 via-foreground/55 to-foreground/20" />
      <div className="relative h-full p-6 md:p-8 flex flex-col justify-end text-primary-foreground">
        <div className="absolute top-6 right-6 h-10 w-10 rounded-lg bg-background/15 backdrop-blur flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-2xl md:text-3xl font-bold">{title}</h3>
        <p className="text-primary-foreground/90 mt-1 font-medium">{tagline}</p>
        <p className="text-primary-foreground/75 text-sm mt-2 max-w-md">{description}</p>
        <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium">
          Explore {title.toLowerCase()} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
