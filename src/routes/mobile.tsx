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
  | "class"
  | "booking"
  | "payment"
  | "confirmation";

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
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">Mobile preview</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            The Dryvon app, end to end
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Tap through a live prototype of the full booking flow — browse, host
            profile, class detail, booking, payment, confirmation.
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-8">
          {/* Left flow guide */}
          <FlowGuide current={screen} />

          {/* Phone */}
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
                <ConfirmationScreen cls={selected} onDone={reset} />
              )}
            </div>
            <PhoneTabBar
              screen={screen}
              onHome={() => setScreen("browse")}
            />
          </PhoneFrame>

          {/* Right controls */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Jump to screen
            </p>
            {(
              [
                ["browse", "Browse"],
                ["host", "Host profile"],
                ["class", "Class detail"],
                ["booking", "Booking"],
                ["payment", "Payment"],
                ["confirmation", "Confirmation"],
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

function PhoneTabBar({ screen, onHome }: { screen: Screen; onHome: () => void }) {
  const tabs = [
    { id: "browse" as Screen, icon: Home, label: "Browse" },
    { id: "bookings" as const, icon: CalendarDays, label: "Bookings" },
    { id: "profile" as const, icon: UserIcon, label: "Profile" },
  ];
  return (
    <div className="border-t bg-card flex items-center justify-around py-2 px-4">
      {tabs.map((t) => {
        const active = t.id === "browse" && screen === "browse";
        return (
          <button
            key={t.label}
            onClick={t.id === "browse" ? onHome : undefined}
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
}: {
  cls: ClassItem;
  onBack: () => void;
  onSelectClass: () => void;
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

        {isGym && (
          <div className="mt-5">
            <h3 className="font-semibold text-sm mb-2">Special events</h3>
            <Card className="p-3 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">Event</span>
              </div>
              <p className="font-semibold text-sm">Summer Open Mat & BBQ</p>
              <p className="text-xs text-muted-foreground mt-0.5">Jul 4 · 12:00 PM · Free</p>
            </Card>
          </div>
        )}
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

function ConfirmationScreen({ cls, onDone }: { cls: ClassItem; onDone: () => void }) {
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
        <Button className="w-full bg-gradient-hero shadow-elegant">Add to calendar</Button>
        <Button variant="outline" onClick={onDone} className="w-full">
          Back to browse
        </Button>
      </div>
    </div>
  );
}
