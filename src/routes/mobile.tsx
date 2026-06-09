import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Star,
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  ChevronRight,
  Heart,
  Share2,
  Sparkles,
  Home,
  CalendarDays,
  User as UserIcon,
  Signal,
  Wifi,
  BatteryFull,
  Plus,
  DollarSign,
  BarChart3,
  Bell,
  MessageSquare,
  Pencil,
  Eye,
  TrendingUp,
  Repeat,
  Target,
  Activity,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile")({
  head: () => ({
    meta: [
      { title: "Mobile preview — Dryvon" },
      { name: "description", content: "Interactive mobile prototype of the Dryvon booking flow." },
    ],
  }),
  component: MobileShowcase,
});

type Screen =
  | "browse"
  | "host"
  | "gym"
  | "class"
  | "booking"
  | "payment"
  | "confirmation"
  | "bookings"
  | "profile";

type ClassItem = {
  id: string;
  title: string;
  host: string;
  hostType: "person" | "gym";
  activity: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  spots: number;
  capacity: number;
  image: string;
};

const CLASSES: ClassItem[] = [
  {
    id: "1",
    title: "Sunrise Vinyasa Flow",
    host: "Maya Calder",
    hostType: "person",
    activity: "Yoga",
    location: "Dolores Park, SF",
    date: "Sat, Jun 14",
    time: "7:00 AM",
    duration: "60 min",
    price: 22,
    rating: 4.9,
    reviews: 184,
    spots: 4,
    capacity: 12,
    image: "linear-gradient(135deg,#f4b942,#e07a5f)",
  },
  {
    id: "2",
    title: "Iron Forge — Open Mat",
    host: "Iron Forge Gym",
    hostType: "gym",
    activity: "BJJ",
    location: "SoMa, SF",
    date: "Sun, Jun 15",
    time: "11:00 AM",
    duration: "90 min",
    price: 35,
    rating: 4.8,
    reviews: 96,
    spots: 8,
    capacity: 20,
    image: "linear-gradient(135deg,#2c2c2e,#5c5c5e)",
  },
  {
    id: "3",
    title: "Trail Run + Coffee",
    host: "Devon Walsh",
    hostType: "person",
    activity: "Running",
    location: "Marin Headlands",
    date: "Sat, Jun 14",
    time: "8:30 AM",
    duration: "75 min",
    price: 15,
    rating: 5.0,
    reviews: 42,
    spots: 2,
    capacity: 8,
    image: "linear-gradient(135deg,#84a98c,#52796f)",
  },
];

function MobileShowcase() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">Mobile preview</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            The Dryvon app, end to end
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Two interactive prototypes — the user flow for booking a class, and
            the host flow for running them.
          </p>
        </div>

        <FlowSection
          eyebrow="User flow"
          title="Book a class"
          description="Browse, check the host, review the class, pick a date, pay, and confirm."
        >
          <UserFlow />
        </FlowSection>

        <div className="my-16 border-t" />

        <FlowSection
          eyebrow="Host flow"
          title="Run your classes"
          description="See today's schedule, publish a class, manage attendees, and track earnings."
        >
          <HostFlow />
        </FlowSection>
      </div>
    </div>
  );
}

function FlowSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-3">{eyebrow}</Badge>
        <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-sm">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function UserFlow() {
  const [screen, setScreen] = useState<Screen>("browse");
  const [selectedId, setSelectedId] = useState<string>("1");
  const selected = useMemo(
    () => CLASSES.find((c) => c.id === selectedId) ?? CLASSES[0],
    [selectedId],
  );

  const reset = () => {
    setScreen("browse");
    setSelectedId("1");
  };

  return (
    <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-8">
      <FlowGuide current={screen} />

      <PhoneFrame>
        <PhoneStatusBar />
        <div className="flex-1 overflow-hidden relative bg-background">
          {screen === "browse" && (
            <BrowseScreen
              onSelect={(id) => {
                setSelectedId(id);
                setScreen("class");
              }}
              onHost={(id) => {
                setSelectedId(id);
                setScreen("host");
              }}
            />
          )}
          {screen === "host" && (
            <HostScreen
              cls={selected}
              onBack={() => setScreen("browse")}
              onSelectClass={() => setScreen("class")}
              onGym={() => {
                setSelectedId("2");
                setScreen("gym");
              }}
            />
          )}
          {screen === "gym" && (
            <GymScreen
              cls={CLASSES.find((c) => c.id === "2") ?? CLASSES[1]}
              onBack={() => setScreen("browse")}
              onSelectClass={() => {
                setSelectedId("2");
                setScreen("class");
              }}
            />
          )}
          {screen === "class" && (
            <ClassScreen
              cls={selected}
              onBack={() => setScreen("browse")}
              onHost={() => setScreen("host")}
              onBook={() => setScreen("booking")}
            />
          )}
          {screen === "booking" && (
            <BookingScreen
              cls={selected}
              onBack={() => setScreen("class")}
              onContinue={() => setScreen("payment")}
            />
          )}
          {screen === "payment" && (
            <PaymentScreen
              cls={selected}
              onBack={() => setScreen("booking")}
              onPay={() => setScreen("confirmation")}
            />
          )}
          {screen === "confirmation" && (
            <ConfirmationScreen
              cls={selected}
              onDone={reset}
              onViewBookings={() => setScreen("bookings")}
            />
          )}
          {screen === "bookings" && (
            <BookingsScreen
              onOpen={(id) => {
                setSelectedId(id);
                setScreen("class");
              }}
              onProfile={() => setScreen("profile")}
            />
          )}
          {screen === "profile" && (
            <ProfileScreen
              onBookings={() => setScreen("bookings")}
              onBrowse={() => setScreen("browse")}
            />
          )}
        </div>
        <PhoneTabBar
          screen={screen}
          onHome={() => setScreen("browse")}
          onBookings={() => setScreen("bookings")}
          onProfile={() => setScreen("profile")}
        />
      </PhoneFrame>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Jump to screen
        </p>
        {(
          [
            ["browse", "Browse"],
            ["host", "Host profile"],
            ["gym", "Gym profile"],
            ["class", "Class detail"],
            ["booking", "Booking"],
            ["payment", "Payment"],
            ["confirmation", "Confirmation"],
            ["bookings", "My bookings"],
            ["profile", "Profile"],
          ] as [Screen, string][]
        ).map(([s, label]) => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg border transition-all",
              screen === s
                ? "bg-primary text-primary-foreground border-primary shadow-elegant"
                : "bg-card hover:bg-muted border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{label}</span>
              <ChevronRight className="h-4 w-4 opacity-60" />
            </div>
          </button>
        ))}
        <Button onClick={reset} variant="outline" className="w-full mt-2">
          Restart flow
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Phone chrome ---------------- */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 360 }}>
      <div className="relative rounded-[3rem] bg-foreground p-3 shadow-elegant">
        <div className="relative h-[720px] w-[336px] overflow-hidden rounded-[2.4rem] bg-background flex flex-col">
          {children}
          {/* Notch */}
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 h-6 w-28 rounded-full bg-foreground" />
        </div>
      </div>
    </div>
  );
}

function PhoneStatusBar() {
  return (
    <div className="h-10 px-6 pt-3 flex items-center justify-between text-[11px] font-semibold text-foreground bg-background z-10 relative">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <Signal className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <BatteryFull className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

function PhoneTabBar({
  screen,
  onHome,
  onBookings,
  onProfile,
}: {
  screen: Screen;
  onHome: () => void;
  onBookings: () => void;
  onProfile: () => void;
}) {
  const tabs = [
    { id: "browse" as Screen, icon: Home, label: "Browse", onClick: onHome },
    { id: "bookings" as Screen, icon: CalendarDays, label: "Bookings", onClick: onBookings },
    { id: "profile" as Screen, icon: UserIcon, label: "Profile", onClick: onProfile },
  ];
  return (
    <div className="border-t bg-card flex items-center justify-around py-2 px-4">
      {tabs.map((t) => {
        const active = screen === t.id;
        return (
          <button
            key={t.label}
            onClick={t.onClick}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <t.icon className="h-5 w-5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Flow guide ---------------- */

function FlowGuide({ current }: { current: Screen }) {
  const steps: { id: Screen; label: string }[] = [
    { id: "browse", label: "Discover classes" },
    { id: "host", label: "Check the host" },
    { id: "class", label: "Review the class" },
    { id: "booking", label: "Choose date & seats" },
    { id: "payment", label: "Mock payment" },
    { id: "confirmation", label: "Confirmed" },
  ];
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        The flow
      </p>
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.id} className="flex items-center gap-3 py-2">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border",
                active && "bg-primary text-primary-foreground border-primary",
                done && "bg-foreground/80 text-background border-foreground/80",
                !active && !done && "bg-muted text-muted-foreground border-border",
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-sm",
                active ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Screens ---------------- */

function ScreenScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

function BrowseScreen({
  onSelect,
  onHost,
}: {
  onSelect: (id: string) => void;
  onHost: (id: string) => void;
}) {
  return (
    <ScreenScroll>
      <div className="px-5 pt-3 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Good morning</p>
            <h2 className="font-display text-2xl font-semibold">Find your class</h2>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-semibold">
            J
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search classes, trainers, gyms" className="pl-9 rounded-full bg-muted/60 border-0" />
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["All", "Yoga", "BJJ", "Running", "HIIT", "Climbing"].map((c, i) => (
            <span
              key={c}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs border",
                i === 0
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border",
              )}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="px-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Near you this weekend</h3>
          <span className="text-xs text-primary">See all</span>
        </div>
        <div className="space-y-3">
          {CLASSES.map((c) => (
            <Card
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border-border/60"
            >
              <div
                className="h-28 relative"
                style={{ background: c.image }}
              >
                <div className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <Badge className="bg-background/90 text-foreground hover:bg-background/90">{c.activity}</Badge>
                  {c.hostType === "gym" && (
                    <Badge className="bg-foreground text-background hover:bg-foreground">Gym</Badge>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight">{c.title}</h4>
                  <span className="text-sm font-semibold whitespace-nowrap">${c.price}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onHost(c.id);
                  }}
                  className="text-xs text-muted-foreground hover:text-primary mt-0.5 inline-flex items-center gap-1"
                >
                  {c.hostType === "gym" ? <Building2 className="h-3 w-3" /> : null}
                  {c.host}
                </button>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />{c.rating}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScreenScroll>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="px-5 py-3 flex items-center gap-3 border-b bg-background sticky top-0 z-10">
      <button onClick={onBack} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <h2 className="font-semibold text-sm truncate flex-1">{title}</h2>
      <button className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function HostScreen({
  cls,
  onBack,
  onSelectClass,
  onGym,
}: {
  cls: ClassItem;
  onBack: () => void;
  onSelectClass: () => void;
  onGym?: () => void;
}) {
  const isGym = cls.hostType === "gym";
  return (
    <ScreenScroll>
      <ScreenHeader title={cls.host} onBack={onBack} />
      <div
        className="h-32 relative"
        style={{ background: cls.image }}
      />
      <div className="px-5 -mt-10 relative">
        <div className="h-20 w-20 rounded-2xl bg-card border-4 border-background shadow-card flex items-center justify-center text-2xl font-display font-semibold">
          {isGym ? <Building2 className="h-8 w-8" /> : cls.host[0]}
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold">{cls.host}</h2>
            {isGym && <Badge variant="secondary"><Building2 className="h-3 w-3 mr-1" />Gym</Badge>}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />{cls.location}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" />{cls.rating} · {cls.reviews} reviews</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">3 yrs hosting</span>
          </div>
          <p className="text-sm mt-3 text-foreground/80 leading-relaxed">
            {isGym
              ? "Community-owned strength gym in SoMa. Open mats, comps, and small-group classes led by black-belt coaches."
              : "RYT-500 yoga teacher with a soft, grounded style. Outdoor flows in SF since 2021."}
          </p>
        </div>

        <div className="mt-5">
          <h3 className="font-semibold text-sm mb-2">Upcoming sessions</h3>
          <div className="space-y-2">
            {CLASSES.slice(0, 3).map((c) => (
              <Card
                key={c.id}
                onClick={onSelectClass}
                className="p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="h-12 w-12 rounded-lg shrink-0" style={{ background: c.image }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.title}</p>
                  <p className="text-[11px] text-muted-foreground">{c.date} · {c.time}</p>
                </div>
                <span className="text-sm font-semibold">${c.price}</span>
              </Card>
            ))}
          </div>
        </div>

        {/* AI analysis */}
        <Card className="mt-5 p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                AI review summary
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {cls.reviews} reviews
            </Badge>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed">
            {isGym
              ? "Students consistently praise the welcoming open-mat culture and the coaches' technical feedback. A few mention the space gets busy on Saturdays — earlier sessions tend to be quieter."
              : "Students describe Maya's sessions as calm, beginner-friendly, and physically thorough. The outdoor setting and a gentle savasana are repeat highlights."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: "Vibe", score: isGym ? 92 : 96 },
              { label: "Skill", score: isGym ? 95 : 91 },
              { label: "Value", score: isGym ? 88 : 90 },
              { label: "Beginner friendly", score: isGym ? 78 : 97 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold">{s.score}</span>
                </div>
                <div className="h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(isGym
              ? ["Skilled coaches", "Welcoming", "Great open mats", "Busy weekends"]
              : ["Calm energy", "Beginner friendly", "Clear cues", "Great setting"]
            ).map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-background border"
              >
                {t}
              </span>
            ))}
          </div>
        </Card>

        {/* Reviews */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Reviews</h3>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              {cls.rating} · {cls.reviews}
            </span>
          </div>

          {/* Rating distribution */}
          <Card className="p-3 mb-2">
            {[
              { stars: 5, pct: 84 },
              { stars: 4, pct: 11 },
              { stars: 3, pct: 3 },
              { stars: 2, pct: 1 },
              { stars: 1, pct: 1 },
            ].map((r) => (
              <div key={r.stars} className="flex items-center gap-2 py-0.5">
                <span className="text-[11px] w-3 text-muted-foreground">{r.stars}</span>
                <Star className="h-3 w-3 fill-primary text-primary" />
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-7 text-right">{r.pct}%</span>
              </div>
            ))}
          </Card>

          <div className="space-y-2">
            {(isGym
              ? [
                  { name: "Alex M.", initials: "AM", rating: 5, date: "2 weeks ago", text: "Coaches actually watch your rolls and give real feedback. Felt at home on day one." },
                  { name: "Priya S.", initials: "PS", rating: 5, date: "1 month ago", text: "Best open mat in SoMa. Wide skill range and zero ego." },
                  { name: "Devon W.", initials: "DW", rating: 4, date: "1 month ago", text: "Saturday class was packed — try a weekday if you're new." },
                ]
              : [
                  { name: "Riya P.", initials: "RP", rating: 5, date: "1 week ago", text: "Maya's cues are so clear. First yoga class I didn't feel lost in." },
                  { name: "Mika C.", initials: "MC", rating: 5, date: "3 weeks ago", text: "The sunrise setting at Dolores is unreal. Worth waking up for." },
                  { name: "Toni B.", initials: "TB", rating: 4, date: "1 month ago", text: "Beautiful flow, just bring an extra layer — it's chilly before 8." },
                ]
            ).map((r) => (
              <Card key={r.name} className="p-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center text-[11px] font-semibold">
                    {r.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < r.rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/40",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground/85 mt-2 leading-relaxed">{r.text}</p>
              </Card>
            ))}
          </div>

          <button className="w-full mt-2 text-xs text-primary font-medium py-2">
            See all {cls.reviews} reviews
          </button>
        </div>

        {isGym && onGym && (
          <div className="mt-5 pb-4">
            <button
              onClick={onGym}
              className="w-full p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">View gym profile</p>
                <p className="text-[11px] text-muted-foreground">Special events, coaches & facility</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </ScreenScroll>
  );
}

function GymScreen({
  cls,
  onBack,
  onSelectClass,
}: {
  cls: ClassItem;
  onBack: () => void;
  onSelectClass: () => void;
}) {
  const events = [
    {
      title: "Summer Open Mat & BBQ",
      date: "Jul 4 · 12:00 PM",
      tag: "Community",
      price: "Free",
      spots: "32 going",
      gradient: "linear-gradient(135deg,#f4b942,#e07a5f)",
      desc: "All-levels open mat followed by a backyard BBQ. Family & friends welcome.",
    },
    {
      title: "No-Gi Submission Tournament",
      date: "Jul 19 · 10:00 AM",
      tag: "Competition",
      price: "$45",
      spots: "18 / 40 spots",
      gradient: "linear-gradient(135deg,#2c2c2e,#5c5c5e)",
      desc: "In-house bracket across three weight classes. Medals & post-event film review.",
    },
    {
      title: "Women's Self-Defense Seminar",
      date: "Aug 2 · 2:00 PM",
      tag: "Seminar",
      price: "$25",
      spots: "Limited",
      gradient: "linear-gradient(135deg,#84a98c,#52796f)",
      desc: "2-hour fundamentals workshop led by Coach Renata. Open to non-members.",
    },
    {
      title: "Black Belt Guest Class — Prof. Lima",
      date: "Aug 16 · 11:00 AM",
      tag: "Guest coach",
      price: "$30",
      spots: "12 / 25 spots",
      gradient: "linear-gradient(135deg,#5b8def,#3d5a80)",
      desc: "Special drop-in class with ADCC veteran Prof. Marcelo Lima.",
    },
  ];

  const coaches = [
    { name: "Renata Costa", role: "Head coach · Black belt", initials: "RC" },
    { name: "Marcus Hale", role: "No-gi · Brown belt", initials: "MH" },
    { name: "Yuki Tanaka", role: "Kids program · Purple", initials: "YT" },
  ];

  return (
    <ScreenScroll>
      <ScreenHeader title={cls.host} onBack={onBack} />
      <div className="h-40 relative" style={{ background: cls.image }}>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <Badge className="absolute top-3 left-3 bg-background/95 text-foreground hover:bg-background/95">
          <Building2 className="h-3 w-3 mr-1" />Gym profile
        </Badge>
      </div>
      <div className="px-5 -mt-10 relative">
        <div className="h-20 w-20 rounded-2xl bg-card border-4 border-background shadow-card flex items-center justify-center">
          <Building2 className="h-8 w-8" />
        </div>
        <div className="mt-3">
          <h2 className="font-display text-xl font-semibold">{cls.host}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />{cls.location} · Open today 6am–10pm
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" />{cls.rating} · {cls.reviews} reviews</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">240 members</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Classes / wk", value: "32" },
            { label: "Coaches", value: "8" },
            { label: "Events / mo", value: "4" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-lg bg-muted/60 text-center">
              <p className="font-display text-lg font-semibold leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly schedule */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">This week's sessions</h3>
            <span className="text-xs text-primary">Full schedule</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <span
                key={d}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-[11px] border",
                  i === 5
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-foreground border-border",
                )}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { title: "Fundamentals Gi", coach: "Coach Renata", time: "6:00 AM · 60 min", spots: "4 / 16", price: 25, gradient: "linear-gradient(135deg,#5b8def,#3d5a80)" },
              { title: "Open Mat", coach: "All coaches", time: "11:00 AM · 90 min", spots: "8 / 20", price: 35, gradient: "linear-gradient(135deg,#2c2c2e,#5c5c5e)" },
              { title: "No-Gi Advanced", coach: "Coach Marcus", time: "6:30 PM · 75 min", spots: "2 / 12", price: 30, gradient: "linear-gradient(135deg,#84a98c,#52796f)" },
              { title: "Kids BJJ (7–12)", coach: "Coach Yuki", time: "4:00 PM · 45 min", spots: "6 / 14", price: 20, gradient: "linear-gradient(135deg,#f4b942,#e07a5f)" },
            ].map((s) => (
              <Card
                key={s.title}
                onClick={onSelectClass}
                className="p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="h-12 w-12 rounded-lg shrink-0" style={{ background: s.gradient }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{s.coach} · {s.time}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Users className="h-3 w-3" />{s.spots} spots
                  </p>
                </div>
                <span className="text-sm font-semibold">${s.price}</span>
              </Card>
            ))}
          </div>
        </div>


          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Special events</h3>
            </div>
            <span className="text-xs text-primary">See all</span>
          </div>
          <div className="space-y-2">
            {events.map((e) => (
              <Card
                key={e.title}
                onClick={onSelectClass}
                className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border-border/60"
              >
                <div className="h-20 relative" style={{ background: e.gradient }}>
                  <Badge className="absolute top-2 left-2 bg-background/90 text-foreground hover:bg-background/90 text-[10px]">
                    {e.tag}
                  </Badge>
                  <div className="absolute top-2 right-2 bg-foreground/90 text-background text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {e.price}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm leading-tight">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />{e.date}
                  </p>
                  <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{e.desc}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />{e.spots}
                    </span>
                    <Button size="sm" variant="secondary" className="h-7 text-xs">
                      RSVP
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Coaches */}
        <div className="mt-5">
          <h3 className="font-semibold text-sm mb-2">Coaches</h3>
          <div className="space-y-2">
            {coaches.map((c) => (
              <Card key={c.name} className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-tight">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.role}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            ))}
          </div>
        </div>

        {/* Facility */}
        <div className="mt-5 pb-4">
          <h3 className="font-semibold text-sm mb-2">Facility</h3>
          <div className="flex flex-wrap gap-1.5">
            {["1,800 sq ft mat space", "Showers", "Lockers", "Free parking", "Kids area", "Pro shop"].map((a) => (
              <span key={a} className="text-[11px] px-2.5 py-1 rounded-full bg-muted border">
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ScreenScroll>
  );
}

function ClassScreen({
  cls,
  onBack,
  onHost,
  onBook,
}: {
  cls: ClassItem;
  onBack: () => void;
  onHost: () => void;
  onBook: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <ScreenScroll>
        <ScreenHeader title="Class details" onBack={onBack} />
        <div className="h-48" style={{ background: cls.image }} />
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{cls.activity}</Badge>
            <Badge variant="outline">Small group</Badge>
          </div>
          <h2 className="font-display text-2xl font-semibold leading-tight">{cls.title}</h2>
          <button
            onClick={onHost}
            className="mt-1 text-sm text-primary inline-flex items-center gap-1"
          >
            {cls.hostType === "gym" ? <Building2 className="h-3.5 w-3.5" /> : null}
            with {cls.host}
          </button>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Info icon={CalendarIcon} label={cls.date} sub={cls.time} />
            <Info icon={Clock} label="Duration" sub={cls.duration} />
            <Info icon={MapPin} label="Location" sub={cls.location} />
            <Info icon={Users} label={`${cls.spots} of ${cls.capacity} left`} sub="Small group" />
          </div>

          <div className="mt-5">
            <h3 className="font-semibold text-sm mb-1">About this class</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A grounded, breath-led session for all levels. Bring a mat, water,
              and an open mind. We finish with a 10-minute savasana.
            </p>
          </div>

          <div className="mt-5">
            <h3 className="font-semibold text-sm mb-2">What to bring</h3>
            <ul className="space-y-1.5 text-sm">
              {["Mat (rentals available)", "Water bottle", "Light layer"].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />{x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ScreenScroll>
      <div className="border-t bg-card px-5 py-3 flex items-center gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Per spot</p>
          <p className="font-display text-xl font-semibold">${cls.price}</p>
        </div>
        <Button onClick={onBook} className="flex-1 bg-gradient-hero shadow-elegant">
          Book this class
        </Button>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/60">
      <Icon className="h-4 w-4 text-primary mb-1" />
      <p className="text-sm font-medium leading-tight">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function BookingScreen({
  cls,
  onBack,
  onContinue,
}: {
  cls: ClassItem;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [spots, setSpots] = useState(1);
  const [date, setDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  });
  const [open, setOpen] = useState(false);
  const times = ["7:00 AM", "9:30 AM", "5:30 PM"];
  const [timeIdx, setTimeIdx] = useState(0);

  return (
    <div className="h-full flex flex-col">
      <ScreenScroll>
        <ScreenHeader title="Book class" onBack={onBack} />
        <div className="px-5 py-4 space-y-5">
          <Card className="p-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg" style={{ background: cls.image }} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{cls.title}</p>
              <p className="text-xs text-muted-foreground truncate">with {cls.host}</p>
            </div>
          </Card>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Select date</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full mt-2 justify-start text-left font-normal h-12 rounded-xl",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {date ? format(date, "EEEE, MMM d") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setOpen(false);
                  }}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  classNames={{ day: "text-black hover:text-black" }}
                />
              </PopoverContent>
            </Popover>
          </div>


          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Time</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {times.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setTimeIdx(i)}
                  className={cn(
                    "py-2 rounded-lg border text-sm font-medium transition-all",
                    i === timeIdx
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Spots</Label>
            <div className="flex items-center justify-between mt-2 p-3 rounded-lg border bg-card">
              <div>
                <p className="font-medium text-sm">{spots} {spots === 1 ? "spot" : "spots"}</p>
                <p className="text-[11px] text-muted-foreground">{cls.spots} left for this session</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSpots(Math.max(1, spots - 1))}
                  className="h-8 w-8 rounded-full border flex items-center justify-center"
                >
                  −
                </button>
                <span className="font-semibold w-4 text-center">{spots}</span>
                <button
                  onClick={() => setSpots(Math.min(cls.spots, spots + 1))}
                  className="h-8 w-8 rounded-full border flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="note" className="text-xs uppercase tracking-widest text-muted-foreground">Note to host (optional)</Label>
            <textarea
              id="note"
              rows={3}
              placeholder="First time at this studio…"
              className="mt-2 w-full rounded-lg border bg-card p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <Card className="p-3 space-y-1.5 text-sm bg-muted/40">
            <Row label={`${spots} × $${cls.price}`} value={`$${spots * cls.price}`} />
            <Row label="Service fee" value="$2.50" />
            <div className="border-t pt-1.5 mt-1.5">
              <Row label="Total" value={`$${spots * cls.price + 2.5}`} bold />
            </div>
          </Card>
        </div>
      </ScreenScroll>
      <div className="border-t bg-card px-5 py-3">
        <Button onClick={onContinue} className="w-full bg-gradient-hero shadow-elegant">
          Continue to payment
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", bold && "font-semibold text-base")}>
      <span className={cn(!bold && "text-muted-foreground")}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PaymentScreen({
  cls,
  onBack,
  onPay,
}: {
  cls: ClassItem;
  onBack: () => void;
  onPay: () => void;
}) {
  const [method, setMethod] = useState<"card" | "apple" | "google">("card");
  const [processing, setProcessing] = useState(false);
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12 / 28");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("Jordan Lee");

  const total = cls.price + 2.5;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPay();
    }, 1400);
  };

  return (
    <div className="h-full flex flex-col">
      <ScreenScroll>
        <ScreenHeader title="Payment" onBack={onBack} />
        <div className="px-5 py-4 space-y-5">
          <Card className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total due</p>
              <p className="font-display text-2xl font-semibold">${total.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium truncate max-w-[140px]">{cls.title}</p>
              <p className="text-[11px] text-muted-foreground">Sat, Jun 14 · 7:00 AM</p>
            </div>
          </Card>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Pay with</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {([
                { id: "apple", label: " Pay" },
                { id: "google", label: "G Pay" },
                { id: "card", label: "Card" },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "py-3 rounded-lg border text-sm font-semibold transition-all",
                    method === m.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {method === "card" && (
            <div className="space-y-3">
              {/* Card preview */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-foreground to-foreground/70 text-background shadow-elegant">
                <div className="flex items-center justify-between">
                  <CreditCard className="h-5 w-5 opacity-80" />
                  <span className="text-[10px] uppercase tracking-widest opacity-80">Visa</span>
                </div>
                <p className="font-mono text-lg tracking-widest mt-6">
                  {card || "•••• •••• •••• ••••"}
                </p>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <div>
                    <p className="opacity-70 text-[9px] uppercase">Name</p>
                    <p>{name || "—"}</p>
                  </div>
                  <div>
                    <p className="opacity-70 text-[9px] uppercase">Exp</p>
                    <p>{exp || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <Label htmlFor="cn" className="text-xs">Card number</Label>
                  <Input id="cn" value={card} onChange={(e) => setCard(e.target.value)} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="ex" className="text-xs">Expiry</Label>
                    <Input id="ex" value={exp} onChange={(e) => setExp(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="cv" className="text-xs">CVC</Label>
                    <Input id="cv" value={cvc} onChange={(e) => setCvc(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nm" className="text-xs">Cardholder name</Label>
                  <Input id="nm" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
          )}

          {method !== "card" && (
            <Card className="p-6 text-center bg-muted/40">
              <p className="text-sm text-muted-foreground">
                Tap "Pay" to confirm with {method === "apple" ? "Apple Pay" : "Google Pay"}.
              </p>
            </Card>
          )}

          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />Encrypted · Demo only, no real charge
          </p>
        </div>
      </ScreenScroll>
      <div className="border-t bg-card px-5 py-3">
        <Button
          onClick={handlePay}
          disabled={processing}
          className="w-full bg-gradient-hero shadow-elegant"
        >
          {processing ? "Processing…" : `Pay $${total.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}

function ConfirmationScreen({
  cls,
  onDone,
  onViewBookings,
}: {
  cls: ClassItem;
  onDone: () => void;
  onViewBookings: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <ScreenScroll>
        <div className="px-5 pt-10 pb-4 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary" strokeWidth={2.2} />
          </div>
          <h2 className="font-display text-2xl font-semibold">You're booked!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            A confirmation was sent to your email.
          </p>
        </div>

        <div className="px-5 space-y-3">
          <Card className="overflow-hidden">
            <div className="h-24" style={{ background: cls.image }} />
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Booking #DRY-08421</p>
              <h3 className="font-semibold mt-1">{cls.title}</h3>
              <p className="text-xs text-muted-foreground">with {cls.host}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Info icon={CalendarIcon} label={cls.date} sub={cls.time} />
                <Info icon={MapPin} label="Location" sub={cls.location} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold mb-2">What's next</p>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex gap-2"><span className="text-primary">•</span> Add to your calendar</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Message your host with questions</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Show up 10 min early</li>
            </ul>
          </Card>
        </div>
      </ScreenScroll>
      <div className="border-t bg-card px-5 py-3 space-y-2">
        <Button onClick={onViewBookings} className="w-full bg-gradient-hero shadow-elegant">
          View my bookings
        </Button>
        <Button variant="outline" onClick={onDone} className="w-full">
          Back to browse
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Bookings ---------------- */

function BookingsScreen({
  onOpen,
  onProfile,
}: {
  onOpen: (id: string) => void;
  onProfile: () => void;
}) {
  const upcoming = [
    { cls: CLASSES[0], code: "DRY-08421", status: "Confirmed" as const },
    { cls: CLASSES[2], code: "DRY-08390", status: "Confirmed" as const },
  ];
  const past = [
    { cls: CLASSES[1], code: "DRY-07712", status: "Completed" as const },
  ];

  return (
    <ScreenScroll>
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">My bookings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <button
          onClick={onProfile}
          className="h-10 w-10 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center font-semibold text-sm shadow-elegant"
        >
          AM
        </button>
      </div>

      <div className="px-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3 mb-2">
          Upcoming
        </p>
        <div className="space-y-2">
          {upcoming.map((b) => (
            <Card
              key={b.code}
              onClick={() => onOpen(b.cls.id)}
              className="overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex">
                <div className="w-20 shrink-0" style={{ background: b.cls.image }} />
                <div className="p-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{b.cls.title}</p>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    with {b.cls.host}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {b.cls.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {b.cls.time}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-5 mb-2">
          Past
        </p>
        <div className="space-y-2 pb-4">
          {past.map((b) => (
            <Card
              key={b.code}
              onClick={() => onOpen(b.cls.id)}
              className="overflow-hidden cursor-pointer opacity-80"
            >
              <div className="flex">
                <div className="w-20 shrink-0 grayscale" style={{ background: b.cls.image }} />
                <div className="p-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{b.cls.title}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    with {b.cls.host}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      Rate this class
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScreenScroll>
  );
}

/* ---------------- Profile ---------------- */

function ProfileScreen({
  onBookings,
  onBrowse,
}: {
  onBookings: () => void;
  onBrowse: () => void;
}) {
  const stats = [
    { label: "Booked", value: "12" },
    { label: "Hosts", value: "7" },
    { label: "Reviews", value: "9" },
  ];
  const rows: { label: string; sub: string; onClick?: () => void }[] = [
    { label: "My bookings", sub: "View upcoming & past classes", onClick: onBookings },
    { label: "Payment methods", sub: "Visa •••• 4242" },
    { label: "Saved classes", sub: "5 favourites" },
    { label: "Notifications", sub: "Push & email" },
    { label: "Become a host", sub: "Share your craft on Dryvon" },
    { label: "Help & support", sub: "FAQ, contact us" },
  ];

  return (
    <ScreenScroll>
      <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center font-display text-2xl font-semibold shadow-elegant">
          AM
        </div>
        <h2 className="font-display text-xl font-semibold mt-3">Alex Morgan</h2>
        <p className="text-xs text-muted-foreground">alex@dryvon.com</p>
        <Badge variant="secondary" className="mt-2 text-[10px]">
          <Sparkles className="h-3 w-3 mr-1" />
          Member since 2024
        </Badge>
      </div>

      <div className="px-5">
        <Card className="p-3 grid grid-cols-3 divide-x">
          {stats.map((s) => (
            <div key={s.label} className="text-center px-2">
              <p className="font-display text-lg font-semibold">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </Card>
      </div>

      <div className="px-5 mt-4 space-y-2 pb-4">
        {rows.map((r) => (
          <Card
            key={r.label}
            onClick={r.onClick}
            className={cn(
              "p-3 flex items-center gap-3",
              r.onClick && "cursor-pointer active:scale-[0.99] transition-transform",
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{r.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Card>
        ))}

        <Button onClick={onBrowse} variant="outline" className="w-full mt-2">
          Find your next class
        </Button>
      </div>
    </ScreenScroll>
  );
}

/* ============================================================
   HOST FLOW
   ============================================================ */

type HostScreenId =
  | "dashboard"
  | "create"
  | "manage"
  | "earnings"
  | "metrics"
  | "hostProfile";

type HostClass = {
  id: string;
  title: string;
  activity: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  booked: number;
  capacity: number;
  image: string;
};

const HOST_CLASSES: HostClass[] = [
  {
    id: "h1",
    title: "Sunrise Vinyasa Flow",
    activity: "Yoga",
    date: "Today",
    time: "7:00 AM",
    duration: "60 min",
    price: 22,
    booked: 8,
    capacity: 12,
    image: "linear-gradient(135deg,#f4b942,#e07a5f)",
  },
  {
    id: "h2",
    title: "Lunchtime Mobility",
    activity: "Mobility",
    date: "Today",
    time: "12:15 PM",
    duration: "45 min",
    price: 18,
    booked: 5,
    capacity: 10,
    image: "linear-gradient(135deg,#84a98c,#52796f)",
  },
  {
    id: "h3",
    title: "Evening Power Flow",
    activity: "Yoga",
    date: "Tomorrow",
    time: "6:30 PM",
    duration: "75 min",
    price: 28,
    booked: 11,
    capacity: 14,
    image: "linear-gradient(135deg,#9d8df1,#5f4bdb)",
  },
];

const HOST_ATTENDEES = [
  { name: "Alex Morgan", initials: "AM", note: "First class!" },
  { name: "Priya Shah", initials: "PS", note: "Returning" },
  { name: "Devon Walsh", initials: "DW", note: "" },
  { name: "Mika Chen", initials: "MC", note: "Brought a mat" },
  { name: "Sam Reyes", initials: "SR", note: "" },
  { name: "Jordan Lee", initials: "JL", note: "First class!" },
  { name: "Riya Patel", initials: "RP", note: "" },
  { name: "Toni Brooks", initials: "TB", note: "" },
];

function HostFlow() {
  const [screen, setScreen] = useState<HostScreenId>("dashboard");
  const [selectedId, setSelectedId] = useState<string>("h1");
  const selected = useMemo(
    () => HOST_CLASSES.find((c) => c.id === selectedId) ?? HOST_CLASSES[0],
    [selectedId],
  );

  const steps: { id: HostScreenId; label: string }[] = [
    { id: "dashboard", label: "Open dashboard" },
    { id: "create", label: "Publish a class" },
    { id: "manage", label: "Manage attendees" },
    { id: "earnings", label: "Track earnings" },
    { id: "metrics", label: "Review metrics" },
    { id: "hostProfile", label: "Your host profile" },
  ];
  const idx = steps.findIndex((s) => s.id === screen);

  return (
    <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-8">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          The flow
        </p>
        {steps.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <div key={s.id} className="flex items-center gap-3 py-2">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border",
                  active && "bg-primary text-primary-foreground border-primary",
                  done && "bg-foreground/80 text-background border-foreground/80",
                  !active && !done && "bg-muted text-muted-foreground border-border",
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-sm",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <PhoneFrame>
        <PhoneStatusBar />
        <div className="flex-1 overflow-hidden relative bg-background">
          {screen === "dashboard" && (
            <HostDashboardScreen
              onCreate={() => setScreen("create")}
              onOpenClass={(id) => {
                setSelectedId(id);
                setScreen("manage");
              }}
              onEarnings={() => setScreen("earnings")}
              onMetrics={() => setScreen("metrics")}
            />
          )}
          {screen === "create" && (
            <HostCreateScreen
              onBack={() => setScreen("dashboard")}
              onPublish={() => setScreen("dashboard")}
            />
          )}
          {screen === "manage" && (
            <HostManageScreen
              cls={selected}
              onBack={() => setScreen("dashboard")}
              onMetrics={() => setScreen("metrics")}
            />
          )}
          {screen === "earnings" && (
            <HostEarningsScreen onBack={() => setScreen("dashboard")} />
          )}
          {screen === "metrics" && (
            <HostMetricsScreen onBack={() => setScreen("dashboard")} />
          )}
          {screen === "hostProfile" && (
            <HostProfileScreen
              onDashboard={() => setScreen("dashboard")}
            />
          )}
        </div>
        <HostTabBar
          screen={screen}
          onDashboard={() => setScreen("dashboard")}
          onCreate={() => setScreen("create")}
          onEarnings={() => setScreen("earnings")}
          onProfile={() => setScreen("hostProfile")}
        />
      </PhoneFrame>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Jump to screen
        </p>
        {(
          [
            ["dashboard", "Dashboard"],
            ["create", "Publish a class"],
            ["manage", "Manage class"],
            ["earnings", "Earnings"],
            ["metrics", "Metrics"],
            ["hostProfile", "Host profile"],
          ] as [HostScreenId, string][]
        ).map(([s, label]) => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg border transition-all",
              screen === s
                ? "bg-primary text-primary-foreground border-primary shadow-elegant"
                : "bg-card hover:bg-muted border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{label}</span>
              <ChevronRight className="h-4 w-4 opacity-60" />
            </div>
          </button>
        ))}
        <Button onClick={() => setScreen("dashboard")} variant="outline" className="w-full mt-2">
          Restart flow
        </Button>
      </div>
    </div>
  );
}

function HostTabBar({
  screen,
  onDashboard,
  onCreate,
  onEarnings,
  onProfile,
}: {
  screen: HostScreenId;
  onDashboard: () => void;
  onCreate: () => void;
  onEarnings: () => void;
  onProfile: () => void;
}) {
  const tabs = [
    { id: "dashboard" as HostScreenId, icon: Home, label: "Home", onClick: onDashboard },
    { id: "create" as HostScreenId, icon: Plus, label: "Create", onClick: onCreate },
    { id: "earnings" as HostScreenId, icon: DollarSign, label: "Earnings", onClick: onEarnings },
    { id: "hostProfile" as HostScreenId, icon: UserIcon, label: "Profile", onClick: onProfile },
  ];
  return (
    <div className="border-t bg-card flex items-center justify-around py-2 px-4">
      {tabs.map((t) => {
        const active = screen === t.id;
        return (
          <button
            key={t.label}
            onClick={t.onClick}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <t.icon className="h-5 w-5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function HostDashboardScreen({
  onCreate,
  onOpenClass,
  onEarnings,
  onMetrics,
}: {
  onCreate: () => void;
  onOpenClass: (id: string) => void;
  onEarnings: () => void;
  onMetrics: () => void;
}) {
  const totalBooked = HOST_CLASSES.reduce((a, c) => a + c.booked, 0);
  const today = HOST_CLASSES.filter((c) => c.date === "Today");
  return (
    <ScreenScroll>
      <div className="px-5 pt-3 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <h2 className="font-display text-2xl font-semibold">Maya</h2>
          </div>
          <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onEarnings}
            className="p-3 rounded-xl bg-gradient-hero text-primary-foreground text-left shadow-elegant"
          >
            <DollarSign className="h-4 w-4 mb-1 opacity-90" />
            <p className="text-[10px] uppercase tracking-widest opacity-80">This week</p>
            <p className="font-display text-lg font-semibold">$842</p>
          </button>
          <div className="p-3 rounded-xl bg-card border">
            <Users className="h-4 w-4 mb-1 text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Booked</p>
            <p className="font-display text-lg font-semibold">{totalBooked}</p>
          </div>
          <div className="p-3 rounded-xl bg-card border">
            <Star className="h-4 w-4 mb-1 fill-primary text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Rating</p>
            <p className="font-display text-lg font-semibold">4.9</p>
          </div>
        </div>

        <button
          onClick={onMetrics}
          className="mt-3 w-full p-3 rounded-xl border bg-card flex items-center gap-3 active:scale-[0.99] transition-transform"
        >
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-sm">Advanced metrics</p>
            <p className="text-[11px] text-muted-foreground">Visibility, retention, conversion</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="px-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Today's classes</h3>
          <span className="text-xs text-muted-foreground">{today.length} sessions</span>
        </div>
        <div className="space-y-2">
          {today.map((c) => (
            <Card
              key={c.id}
              onClick={() => onOpenClass(c.id)}
              className="overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex">
                <div className="w-20 shrink-0" style={{ background: c.image }} />
                <div className="p-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{c.title}</p>
                    <Badge variant="secondary" className="text-[10px]">{c.activity}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.time}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.booked}/{c.capacity}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(c.booked / c.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <h3 className="font-semibold text-sm mt-5 mb-2">Coming up</h3>
        <div className="space-y-2 pb-4">
          {HOST_CLASSES.filter((c) => c.date !== "Today").map((c) => (
            <Card
              key={c.id}
              onClick={() => onOpenClass(c.id)}
              className="p-3 flex items-center gap-3 cursor-pointer"
            >
              <div className="h-10 w-10 rounded-lg shrink-0" style={{ background: c.image }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{c.title}</p>
                <p className="text-[11px] text-muted-foreground">{c.date} · {c.time}</p>
              </div>
              <span className="text-xs text-muted-foreground">{c.booked}/{c.capacity}</span>
            </Card>
          ))}
        </div>

        <Button onClick={onCreate} className="w-full bg-gradient-hero shadow-elegant mb-4">
          <Plus className="h-4 w-4" /> Publish a new class
        </Button>
      </div>
    </ScreenScroll>
  );
}

function HostCreateScreen({
  onBack,
  onPublish,
}: {
  onBack: () => void;
  onPublish: () => void;
}) {
  const [title, setTitle] = useState("Evening Power Flow");
  const [activity, setActivity] = useState("Yoga");
  const [location, setLocation] = useState("Dolores Park, SF");
  const [price, setPrice] = useState("28");
  const [capacity, setCapacity] = useState("12");
  const [bookingType, setBookingType] = useState<"scheduled" | "request">("scheduled");

  return (
    <div className="h-full flex flex-col">
      <ScreenScroll>
        <ScreenHeader title="New class" onBack={onBack} />
        <div className="px-5 py-4 space-y-4">
          <div className="h-28 rounded-xl bg-muted/60 border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground">
            <Sparkles className="h-5 w-5 mb-1" />
            <p className="text-xs">Add a cover photo</p>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Activity</Label>
              <Input value={activity} onChange={(e) => setActivity(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Price</Label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2" />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Booking type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {([
                { id: "scheduled", label: "Scheduled" },
                { id: "request", label: "On request" },
              ] as const).map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBookingType(b.id)}
                  className={cn(
                    "py-2.5 rounded-lg border text-sm font-medium transition-all",
                    bookingType === b.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border",
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Capacity</Label>
            <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-2" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
            <textarea
              rows={3}
              defaultValue="A grounded, breath-led session for all levels."
              className="mt-2 w-full rounded-lg border bg-card p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </ScreenScroll>
      <div className="border-t bg-card px-5 py-3">
        <Button onClick={onPublish} className="w-full bg-gradient-hero shadow-elegant">
          Publish class
        </Button>
      </div>
    </div>
  );
}

function HostManageScreen({
  cls,
  onBack,
  onMetrics,
}: {
  cls: HostClass;
  onBack: () => void;
  onMetrics: () => void;
}) {
  const attendees = HOST_ATTENDEES.slice(0, cls.booked);
  return (
    <div className="h-full flex flex-col">
      <ScreenScroll>
        <ScreenHeader title="Manage class" onBack={onBack} />
        <div className="h-28" style={{ background: cls.image }} />
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold leading-tight">{cls.title}</h2>
            <button onClick={onMetrics} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center" aria-label="View metrics">
              <Activity className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{cls.date} · {cls.time} · {cls.duration}</p>


          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-3 rounded-lg bg-muted/60">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Booked</p>
              <p className="font-display text-lg font-semibold">{cls.booked}/{cls.capacity}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/60">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Revenue</p>
              <p className="font-display text-lg font-semibold">${cls.booked * cls.price}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/60">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Waitlist</p>
              <p className="font-display text-lg font-semibold">2</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Attendees</h3>
              <button className="text-xs text-primary inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Message all
              </button>
            </div>
            <div className="space-y-2">
              {attendees.map((a) => (
                <Card key={a.name} className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {a.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{a.name}</p>
                    {a.note && <p className="text-[11px] text-muted-foreground">{a.note}</p>}
                  </div>
                  <button className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ScreenScroll>
      <div className="border-t bg-card px-5 py-3 flex items-center gap-2">
        <Button variant="outline" className="flex-1">Check in</Button>
        <Button className="flex-1 bg-gradient-hero shadow-elegant">Start class</Button>
      </div>
    </div>
  );
}

function HostEarningsScreen({ onBack }: { onBack: () => void }) {
  const bars = [40, 65, 30, 80, 55, 90, 70];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const recent = [
    { label: "Sunrise Vinyasa", date: "Today", amount: 176 },
    { label: "Lunchtime Mobility", date: "Today", amount: 90 },
    { label: "Evening Power Flow", date: "Yesterday", amount: 308 },
    { label: "Trail Run", date: "Mon", amount: 120 },
    { label: "Sunrise Vinyasa", date: "Sun", amount: 198 },
  ];
  return (
    <ScreenScroll>
      <ScreenHeader title="Earnings" onBack={onBack} />
      <div className="px-5 py-4 space-y-5">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-foreground to-foreground/70 text-background shadow-elegant">
          <p className="text-[10px] uppercase tracking-widest opacity-80">Available to cash out</p>
          <p className="font-display text-3xl font-semibold mt-1">$842.50</p>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="opacity-80">Next payout · Fri</span>
            <button className="px-3 py-1.5 rounded-full bg-background text-foreground font-semibold">
              Cash out
            </button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">This week</p>
              <p className="font-display text-xl font-semibold">$842</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              <BarChart3 className="h-3 w-3 mr-1" /> +18%
            </Badge>
          </div>
          <div className="mt-4 flex items-end gap-1.5 h-24">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full rounded-t",
                    i === bars.length - 1 ? "bg-primary" : "bg-foreground/70",
                  )}
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{days[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        <div>
          <h3 className="font-semibold text-sm mb-2">Recent</h3>
          <div className="space-y-2 pb-4">
            {recent.map((r, i) => (
              <Card key={i} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground">{r.date}</p>
                </div>
                <span className="font-semibold text-sm">+${r.amount}</span>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScreenScroll>
  );
}

function HostProfileScreen({ onDashboard }: { onDashboard: () => void }) {
  const stats = [
    { label: "Classes", value: "128" },
    { label: "Students", value: "1.2k" },
    { label: "Rating", value: "4.9" },
  ];
  const rows = [
    { label: "Class templates", sub: "5 saved" },
    { label: "Payout settings", sub: "Bank •••• 6201" },
    { label: "Availability", sub: "Mon–Sat mornings" },
    { label: "Reviews", sub: "184 reviews" },
    { label: "Help & support", sub: "FAQ, contact us" },
  ];
  return (
    <ScreenScroll>
      <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center font-display text-2xl font-semibold shadow-elegant">
          M
        </div>
        <h2 className="font-display text-xl font-semibold mt-3">Maya Calder</h2>
        <p className="text-xs text-muted-foreground">RYT-500 · SF, CA</p>
        <Badge variant="secondary" className="mt-2 text-[10px]">
          <Sparkles className="h-3 w-3 mr-1" />
          Top host 2025
        </Badge>
      </div>

      <div className="px-5">
        <Card className="p-3 grid grid-cols-3 divide-x">
          {stats.map((s) => (
            <div key={s.label} className="text-center px-2">
              <p className="font-display text-lg font-semibold">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </Card>
      </div>

      <div className="px-5 mt-4 space-y-2 pb-4">
        {rows.map((r) => (
          <Card key={r.label} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{r.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Card>
        ))}

        <Button onClick={onDashboard} variant="outline" className="w-full mt-2">
          Back to dashboard
        </Button>
      </div>
    </ScreenScroll>
  );
}

function HostMetricsScreen({ onBack }: { onBack: () => void }) {
  const range = ["7d", "30d", "90d"];
  const [active, setActive] = useState(1);

  const kpis = [
    { icon: Eye, label: "Profile views", value: "3,482", delta: "+24%", up: true },
    { icon: Target, label: "View → book", value: "9.4%", delta: "+1.8pt", up: true },
    { icon: Repeat, label: "Returning", value: "62%", delta: "+5pt", up: true },
    { icon: Users, label: "Fill rate", value: "84%", delta: "−3pt", up: false },
  ];

  const visibility = [
    { day: "M", impressions: 38, views: 14 },
    { day: "T", impressions: 52, views: 22 },
    { day: "W", impressions: 44, views: 18 },
    { day: "T", impressions: 71, views: 31 },
    { day: "F", impressions: 60, views: 24 },
    { day: "S", impressions: 88, views: 41 },
    { day: "S", impressions: 76, views: 33 },
  ];
  const maxImp = Math.max(...visibility.map((v) => v.impressions));

  const funnel = [
    { label: "Impressions", value: 3482, pct: 100 },
    { label: "Profile views", value: 1240, pct: 36 },
    { label: "Class views", value: 612, pct: 18 },
    { label: "Started booking", value: 198, pct: 6 },
    { label: "Completed", value: 142, pct: 4 },
  ];

  const cohorts = [
    { label: "Wk 1", values: [100, 72, 58, 49, 44] },
    { label: "Wk 2", values: [100, 81, 64, 55] },
    { label: "Wk 3", values: [100, 78, 66] },
    { label: "Wk 4", values: [100, 84] },
  ];

  const peakHours = [
    { h: "6a", v: 30 }, { h: "8a", v: 70 }, { h: "10a", v: 45 },
    { h: "12p", v: 50 }, { h: "2p", v: 25 }, { h: "4p", v: 40 },
    { h: "6p", v: 88 }, { h: "8p", v: 55 },
  ];

  const topClasses = [
    { title: "Sunrise Vinyasa Flow", fill: 92, rating: 4.9, repeat: 71 },
    { title: "Evening Power Flow", fill: 79, rating: 4.8, repeat: 64 },
    { title: "Lunchtime Mobility", fill: 50, rating: 4.7, repeat: 38 },
  ];

  return (
    <ScreenScroll>
      <ScreenHeader title="Advanced metrics" onBack={onBack} />
      <div className="px-5 py-4 space-y-5">
        {/* Range selector */}
        <div className="flex items-center gap-2">
          {range.map((r, i) => (
            <button
              key={r}
              onClick={() => setActive(i)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border",
                i === active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border text-muted-foreground",
              )}
            >
              {r}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground inline-flex items-center gap-1">
            <Activity className="h-3 w-3" /> Live
          </span>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((k) => (
            <div key={k.label} className="p-3 rounded-xl border bg-card">
              <div className="flex items-center justify-between">
                <k.icon className="h-4 w-4 text-primary" />
                <span
                  className={cn(
                    "text-[10px] font-semibold inline-flex items-center gap-0.5",
                    k.up ? "text-primary" : "text-destructive",
                  )}
                >
                  <TrendingUp className={cn("h-3 w-3", !k.up && "rotate-180")} />
                  {k.delta}
                </span>
              </div>
              <p className="font-display text-xl font-semibold mt-1.5">{k.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {k.label}
              </p>
            </div>
          ))}
        </div>

        {/* Visibility chart */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Visibility</p>
              <p className="font-display text-lg font-semibold">Impressions vs views</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-foreground/70" /> Impr.
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-primary" /> Views
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-end gap-2 h-28">
            {visibility.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5 h-full">
                  <div
                    className="flex-1 rounded-t bg-foreground/70"
                    style={{ height: `${(d.impressions / maxImp) * 100}%` }}
                  />
                  <div
                    className="flex-1 rounded-t bg-primary"
                    style={{ height: `${(d.views / maxImp) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Conversion funnel */}
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Conversion funnel</p>
          <p className="font-display text-lg font-semibold">Discover → book</p>
          <div className="mt-3 space-y-2">
            {funnel.map((f, i) => (
              <div key={f.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">
                    {f.value.toLocaleString()}{" "}
                    <span className="text-muted-foreground">· {f.pct}%</span>
                  </span>
                </div>
                <div className="h-2 mt-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      i === funnel.length - 1 ? "bg-primary" : "bg-foreground/70",
                    )}
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Retention cohorts */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Retention</p>
              <p className="font-display text-lg font-semibold">Student cohorts</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              <Repeat className="h-3 w-3 mr-1" /> 62% return
            </Badge>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="grid grid-cols-6 gap-1 text-[10px] text-muted-foreground">
              <span>Cohort</span>
              {["W0", "W1", "W2", "W3", "W4"].map((w) => (
                <span key={w} className="text-center">{w}</span>
              ))}
            </div>
            {cohorts.map((c) => (
              <div key={c.label} className="grid grid-cols-6 gap-1 items-center">
                <span className="text-[10px] text-muted-foreground">{c.label}</span>
                {Array.from({ length: 5 }).map((_, i) => {
                  const v = c.values[i];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "h-7 rounded flex items-center justify-center text-[10px] font-medium",
                        v === undefined ? "bg-muted/40 text-transparent" : "text-background",
                      )}
                      style={
                        v !== undefined
                          ? {
                              backgroundColor: `color-mix(in oklab, var(--primary) ${Math.max(
                                15,
                                v,
                              )}%, transparent)`,
                              color: v > 50 ? "white" : "hsl(var(--foreground))",
                            }
                          : undefined
                      }
                    >
                      {v !== undefined ? `${v}%` : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        {/* Peak hours */}
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Peak booking hours</p>
          <p className="font-display text-lg font-semibold">When students book</p>
          <div className="mt-3 flex items-end gap-1.5 h-20">
            {peakHours.map((p) => (
              <div key={p.h} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full rounded-t",
                    p.v > 70 ? "bg-primary" : "bg-foreground/60",
                  )}
                  style={{ height: `${p.v}%` }}
                />
                <span className="text-[9px] text-muted-foreground">{p.h}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Most bookings happen Thursday evenings — consider adding a 6:30 PM slot.
          </p>
        </Card>

        {/* Top classes */}
        <div>
          <h3 className="font-semibold text-sm mb-2">Top performing</h3>
          <div className="space-y-2">
            {topClasses.map((t) => (
              <Card key={t.title} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{t.title}</p>
                  <span className="text-xs font-semibold">{t.fill}% full</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${t.fill}%` }} />
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" /> {t.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" /> {t.repeat}% return
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Insights */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
              Insights
            </span>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              Your booking conversion is 2.1× the platform average — keep the cover photo on Vinyasa.
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              Lunchtime Mobility fill rate dropped 12% — try a $15 intro price.
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              38% of new students don't return — send a follow-up message within 24h.
            </li>
          </ul>
        </Card>

        <div className="pb-4" />
      </div>
    </ScreenScroll>
  );
}
