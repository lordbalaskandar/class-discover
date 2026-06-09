import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { MapPin, Search, Calendar, Sparkles, Users, Compass } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dryvon — Book pilates, boxing, pickleball and more" },
      { name: "description", content: "Discover and book local fitness classes — pilates, boxing, pickleball, yoga and more, all in seconds." },
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

function HomePage() {
  const navigate = useNavigate();
  const [heroActivity, setHeroActivity] = useState<string>("any");
  const [heroLocation, setHeroLocation] = useState("");

  function onHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/browse",
      search: {
        q: "",
        activity: heroActivity === "any" ? "" : heroActivity,
        location: heroLocation,
        type: "all",
        sort: "newest",
      },
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
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/75 via-foreground/55 to-primary/40" />
        </div>

        <div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-28">
          <div className="max-w-3xl text-primary-foreground">
            <Badge className="bg-background/15 text-primary-foreground border-background/30 backdrop-blur mb-4">
              Pilates · Boxing · Pickleball · and more
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Find your next <span className="text-accent">class</span>.
            </h1>
            <p className="mt-3 text-lg text-primary-foreground/90 max-w-xl">
              Search thousands of pilates, boxing, pickleball and wellness sessions near you — book in seconds.
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
                  Search classes
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Popular:</span>
              {["Pilates", "Boxing", "Pickleball", "Yoga", "HIIT"].map((p) => (
                <Link
                  key={p}
                  to="/browse"
                  search={{ q: "", activity: p, location: "", type: "all", sort: "newest" }}
                  className="rounded-full border px-3 py-1 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {p}
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* Browse by activity */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Browse by activity</h2>
            <p className="text-muted-foreground mt-1">Pick what you love. Or try something new.</p>
          </div>
          <Link to="/browse" search={{ q: "", activity: "", location: "", type: "all", sort: "newest" }} className="text-sm font-medium text-primary hover:underline hidden sm:inline">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {HERO_SLIDES.map((s) => (
            <Link
              key={s.label}
              to="/browse"
              search={{ q: "", activity: s.label, location: "", type: "all", sort: "newest" }}
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
              { icon: Compass, title: "Discover", body: "Browse local classes filtered by activity, time and location." },
              { icon: Calendar, title: "Book", body: "Reserve a scheduled spot or send an on-request booking." },
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
              List your classes on Dryvon and fill seats faster. Free to get started.
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
