import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  SlidersHorizontal,
  X,
  Map as MapIcon,
  LogOut,
} from "lucide-react";
import { HostsMap } from "@/components/mobile/HostsMap";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { PulstractAuthProvider, usePulstractAuth } from "@/lib/pulstract/auth";
import { ServiceHealthBar } from "@/components/pulstract/ServiceHealthBar";
import { AuthScreens } from "@/components/mobile/AuthScreens";
import {
  useLiveClasses,
  useLiveHosts,
  useLiveHostClasses,
  useLiveMyBookings,
  useLiveMyGym,
} from "@/lib/pulstract/live-data";
import {
  useMe,
  useCreateBooking,
  useCreatePaymentIntent,
  useCreateClass,
  useCreateGym,
  useUpdateGym,
} from "@/lib/pulstract/hooks";
import { toast } from "sonner";

type MobileSearch = { flow?: "user" | "host"; screen?: string };

export const Route = createFileRoute("/mobile")({
  validateSearch: (search: Record<string, unknown>): MobileSearch => ({
    flow: search.flow === "user" || search.flow === "host" ? search.flow : undefined,
    screen: typeof search.screen === "string" ? search.screen : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mobile preview — Pulstract" },
      { name: "description", content: "Interactive mobile prototype of the Pulstract booking flow." },
    ],
  }),
  component: MobileShowcase,
});

type Screen =
  | "browse"
  | "hosts"
  | "map"
  | "host"
  | "gym"
  | "class"
  | "booking"
  | "payment"
  | "confirmation"
  | "bookings"
  | "profile"
  | "saved"
  | "pPayment"
  | "pNotifications"
  | "pBecomeHost"
  | "pHelp"
  | "pMyGym"
  | "filters";

type HostItem = {
  id: string;
  name: string;
  type: "person" | "gym";
  activities: string[];
  location: string;
  distance: number; // miles
  rating: number;
  reviews: number;
  pricePerHour: number;
  classId: string; // links to a CLASS for the existing host/gym detail screens
  image: string;
  bio: string;
  lat: number;
  lng: number;
};

const HOSTS: HostItem[] = [
  {
    id: "h1",
    name: "Maya Calder",
    type: "person",
    activities: ["Yoga", "Mobility"],
    location: "Mission, SF",
    distance: 1.2,
    rating: 4.9,
    reviews: 184,
    pricePerHour: 60,
    classId: "1",
    image: "linear-gradient(135deg,#f4b942,#e07a5f)",
    bio: "RYT-500 yoga teacher. Sunrise flows in the park.",
    lat: 37.7599,
    lng: -122.4148,
  },
  {
    id: "h2",
    name: "Iron Forge Gym",
    type: "gym",
    activities: ["BJJ", "Strength", "HIIT"],
    location: "SoMa, SF",
    distance: 2.8,
    rating: 4.8,
    reviews: 96,
    pricePerHour: 45,
    classId: "2",
    image: "linear-gradient(135deg,#2c2c2e,#5c5c5e)",
    bio: "Combat sports & strength gym. Open mats nightly.",
    lat: 37.7785,
    lng: -122.4056,
  },
  {
    id: "h3",
    name: "Devon Walsh",
    type: "person",
    activities: ["Running", "HIIT"],
    location: "Marin, SF",
    distance: 6.4,
    rating: 5.0,
    reviews: 42,
    pricePerHour: 50,
    classId: "3",
    image: "linear-gradient(135deg,#84a98c,#52796f)",
    bio: "Endurance coach. Trail runs & threshold work.",
    lat: 37.8915,
    lng: -122.5239,
  },
  {
    id: "h4",
    name: "Priya Anand",
    type: "person",
    activities: ["Climbing", "Mobility"],
    location: "Dogpatch, SF",
    distance: 3.1,
    rating: 4.7,
    reviews: 58,
    pricePerHour: 70,
    classId: "1",
    image: "linear-gradient(135deg,#7c83fd,#96baff)",
    bio: "Climbing coach — bouldering technique & projecting.",
    lat: 37.7587,
    lng: -122.3884,
  },
  {
    id: "h5",
    name: "Mission Athletic Club",
    type: "gym",
    activities: ["Strength", "Yoga", "HIIT"],
    location: "Mission, SF",
    distance: 1.6,
    rating: 4.6,
    reviews: 212,
    pricePerHour: 35,
    classId: "2",
    image: "linear-gradient(135deg,#3a506b,#5bc0be)",
    bio: "Boutique club with daily group classes.",
    lat: 37.7625,
    lng: -122.4194,
  },
  {
    id: "h6",
    name: "Sam Okafor",
    type: "person",
    activities: ["Boxing", "HIIT", "Strength"],
    location: "SoMa, SF",
    distance: 4.2,
    rating: 4.9,
    reviews: 73,
    pricePerHour: 80,
    classId: "3",
    image: "linear-gradient(135deg,#e63946,#f1a208)",
    bio: "Former amateur boxer. 1-on-1 pad work & conditioning.",
    lat: 37.7825,
    lng: -122.4001,
  },
];

const HOST_ACTIVITIES = ["Yoga", "BJJ", "Running", "HIIT", "Climbing", "Strength", "Boxing", "Mobility"] as const;

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
    <PulstractAuthProvider>
      <MobileShowcaseInner />
    </PulstractAuthProvider>
  );
}

function MobileShowcaseInner() {
  const { flow, screen } = Route.useSearch();
  const showUser = !flow || flow === "user";
  const showHost = !flow || flow === "host";
  const { session, signOut } = usePulstractAuth();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">Mobile preview · live backend</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            The Pulstract app, end to end
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Interactive prototype wired to the real Pulstract dev backend —
            classes, bookings and profile all round-trip through the gateway.
          </p>
        </div>

        <div className="mb-8 space-y-3">
          <ServiceHealthBar />
          {session && (
            <div className="flex items-center justify-between text-xs bg-card border rounded-md px-3 py-2">
              <span className="text-muted-foreground">
                Signed in as <span className="font-semibold text-foreground">{session.email}</span>
              </span>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3 w-3" /> Sign out
              </button>
            </div>
          )}
        </div>

        {!session ? (
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Sign in or create an account to use the mobile prototype against
              the live backend. Dev accounts are auto-confirmed.
            </p>
            <PhoneFrame>
              <PhoneStatusBar />
              <AuthScreens />
            </PhoneFrame>
          </div>
        ) : (
          <>
            {showUser && (
              <FlowSection
                eyebrow="User flow"
                title="Book a class"
                description="Browse, check the host, review the class, pick a date, pay, and confirm."
              >
                <UserFlow initialScreen={flow === "user" ? (screen as Screen | undefined) : undefined} />
              </FlowSection>
            )}

            {showUser && showHost && <div className="my-16 border-t" />}

            {showHost && (
              <FlowSection
                eyebrow="Host flow"
                title="Run your classes"
                description="See today's schedule, publish a class, manage attendees, and track earnings."
              >
                <HostFlow initialScreen={flow === "host" ? (screen as HostScreenId | undefined) : undefined} />
              </FlowSection>
            )}
          </>
        )}
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

function UserFlow({ initialScreen }: { initialScreen?: Screen }) {
  const CLASSES = useLiveClasses();
  const [screen, setScreen] = useState<Screen>(initialScreen ?? "browse");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [browseFiltersOpen, setBrowseFiltersOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const toggleSaved = (id: string) =>
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selected = useMemo(
    () => CLASSES.find((c) => c.id === selectedId) ?? CLASSES[0] ?? null,
    [selectedId, CLASSES],
  );

  const reset = () => {
    setScreen("browse");
    setSelectedId("1");
    setBrowseFiltersOpen(false);
  };

  return (
    <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-8">
      <FlowGuide current={screen} />

      <PhoneFrame>
        <PhoneStatusBar />
        <div className="flex-1 overflow-hidden relative bg-background">
          {(screen === "browse" || screen === "filters") && (
            <BrowseScreen
              filtersOpenInitially={screen === "filters" || browseFiltersOpen}
              savedIds={savedIds}
              onToggleSaved={toggleSaved}
              onSelect={(id) => {
                setSelectedId(id);
                setScreen("class");
                setBrowseFiltersOpen(false);
              }}
              onHost={(id) => {
                setSelectedId(id);
                setScreen("host");
                setBrowseFiltersOpen(false);
              }}
            />
          )}
          {screen === "hosts" && (
            <HostsScreen
              onSelect={(h) => {
                setSelectedId(h.classId);
                setScreen(h.type === "gym" ? "gym" : "host");
              }}
            />
          )}
          {screen === "map" && (
            <MapScreen
              onSelectHost={(h) => {
                setSelectedId(h.classId);
                setScreen(h.type === "gym" ? "gym" : "host");
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
              savedCount={savedIds.size}
              onBookings={() => setScreen("bookings")}
              onBrowse={() => setScreen("browse")}
              onSaved={() => setScreen("saved")}
              onOpenSection={(s) => setScreen(s)}
            />
          )}
          {screen === "saved" && (
            <SavedScreen
              savedIds={savedIds}
              onToggleSaved={toggleSaved}
              onBack={() => setScreen("profile")}
              onBrowse={() => setScreen("browse")}
              onOpen={(id) => {
                setSelectedId(id);
                setScreen("class");
              }}
            />
          )}
          {screen === "pPayment" && (
            <ProfilePaymentScreen onBack={() => setScreen("profile")} />
          )}
          {screen === "pNotifications" && (
            <ProfileNotificationsScreen onBack={() => setScreen("profile")} />
          )}
          {screen === "pBecomeHost" && (
            <ProfileBecomeHostScreen onBack={() => setScreen("profile")} />
          )}
          {screen === "pHelp" && (
            <ProfileHelpScreen onBack={() => setScreen("profile")} />
          )}
          {screen === "pMyGym" && (
            <ProfileMyGymScreen onBack={() => setScreen("profile")} />
          )}
        </div>
        <PhoneTabBar
          screen={screen}
          onHome={() => setScreen("browse")}
          onHosts={() => setScreen("hosts")}
          onMap={() => setScreen("map")}
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
            ["browse", "Sessions", 0],
            ["filters", "Session filters", 1],
            ["hosts", "Hosts", 0],
            ["map", "Map", 0],
            ["host", "Host profile", 0],
            ["gym", "Gym profile", 0],
            ["class", "Class detail", 0],
            ["booking", "Booking", 0],
            ["payment", "Payment", 0],
            ["confirmation", "Confirmation", 0],
            ["bookings", "My bookings", 0],
            ["profile", "Profile", 0],
            ["saved", "Saved classes", 1],
            ["pPayment", "Payment methods", 1],
            ["pNotifications", "Notifications", 1],
            ["pMyGym", "My gym", 1],
            ["pBecomeHost", "Become a host", 1],
            ["pHelp", "Help & support", 1],
          ] as [Screen, string, number][]
        ).map(([s, label, level]) => (
          <button
            key={s}
            onClick={() => {
              setScreen(s);
              if (s === "filters") setBrowseFiltersOpen(true);
              else setBrowseFiltersOpen(false);
            }}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg border transition-all",
              level === 1 && "ml-4 w-[calc(100%-1rem)] py-2",
              level === 2 && "ml-8 w-[calc(100%-2rem)] py-1.5",
              screen === s
                ? "bg-primary text-primary-foreground border-primary shadow-elegant"
                : "bg-card hover:bg-muted border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("font-medium", level === 1 && "text-sm", level === 2 && "text-xs")}>{label}</span>
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
  onHosts,
  onMap,
  onBookings,
  onProfile,
}: {
  screen: Screen;
  onHome: () => void;
  onHosts: () => void;
  onMap: () => void;
  onBookings: () => void;
  onProfile: () => void;
}) {
  const tabs = [
    { id: "browse" as Screen, icon: Home, label: "Sessions", onClick: onHome },
    { id: "hosts" as Screen, icon: Users, label: "Hosts", onClick: onHosts },
    { id: "map" as Screen, icon: MapIcon, label: "Map", onClick: onMap },
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
  filtersOpenInitially = false,
  savedIds,
  onToggleSaved,
}: {
  onSelect: (id: string) => void;
  onHost: (id: string) => void;
  filtersOpenInitially?: boolean;
  savedIds: Set<string>;
  onToggleSaved: (id: string) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(filtersOpenInitially);
  useEffect(() => {
    setFiltersOpen(filtersOpenInitially);
  }, [filtersOpenInitially]);
  const [filters, setFilters] = useState({
    category: "all" as "all" | "class" | "trainer",
    activity: "all" as "all" | "Yoga" | "BJJ" | "Running" | "HIIT" | "Climbing",
    when: "any" as "any" | "today" | "tomorrow" | "this_week" | "this_weekend",
    duration: "any" as "any" | "short" | "medium" | "long",
    capacity: "any" as "any" | "private" | "small" | "medium" | "large",
    type: "all" as "all" | "scheduled" | "on_request",
    spots: "any" as "any" | "available",
    sort: "newest" as "newest" | "soonest" | "duration",
    distance: "any" as "any" | "1" | "5" | "10" | "25" | "50",
    dateRange: undefined as DateRange | undefined,
  });
  const activeCount =
    (filters.category !== "all" ? 1 : 0) +
    (filters.activity !== "all" ? 1 : 0) +
    (filters.when !== "any" ? 1 : 0) +
    (filters.duration !== "any" ? 1 : 0) +
    (filters.capacity !== "any" ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0) +
    (filters.spots !== "any" ? 1 : 0) +
    (filters.distance !== "any" ? 1 : 0) +
    (filters.dateRange ? 1 : 0);

  return (
    <div className="h-full relative">
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search classes, trainers, gyms" className="pl-9 rounded-full bg-muted/60 border-0" />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className={cn(
              "relative h-10 w-10 shrink-0 rounded-full flex items-center justify-center border",
              activeCount > 0
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
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
          <h3 className="font-semibold text-sm">Results</h3>
          <span className="text-xs text-muted-foreground">{CLASSES.filter((c) => filters.activity === "all" || c.activity === filters.activity).length} found</span>
        </div>
        <div className="space-y-3">
          {CLASSES.filter((c) => filters.activity === "all" || c.activity === filters.activity).map((c) => (
            <Card
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border-border/60"
            >
              <div
                className="h-28 relative"
                style={{ background: c.image }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSaved(c.id);
                  }}
                  aria-label={savedIds.has(c.id) ? "Unsave class" : "Save class"}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-colors",
                      savedIds.has(c.id)
                        ? "fill-primary text-primary"
                        : "text-foreground",
                    )}
                  />
                </button>
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

      {/* Filters slide-up */}
      <div
        className={cn(
          "absolute inset-0 z-30 transition-opacity",
          filtersOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-foreground/40"
          onClick={() => setFiltersOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-background rounded-t-3xl border-t shadow-elegant max-h-[88%] flex flex-col transition-transform duration-300",
            filtersOpen ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="pt-2 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="px-5 py-3 flex items-center justify-between border-b">
            <h3 className="font-display text-lg font-semibold">Filters</h3>
            <button
              onClick={() => setFiltersOpen(false)}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterGroup
              label="Category"
              value={filters.category}
              onChange={(v) => setFilters((f) => ({ ...f, category: v as typeof f.category }))}
              options={[
                { v: "all", l: "All" },
                { v: "class", l: "Classes" },
                { v: "trainer", l: "Trainers" },
              ]}
            />
            <FilterGroup
              label="Activity"
              value={filters.activity}
              onChange={(v) => setFilters((f) => ({ ...f, activity: v as typeof f.activity }))}
              options={[
                { v: "all", l: "All" },
                { v: "Yoga", l: "Yoga" },
                { v: "BJJ", l: "BJJ" },
                { v: "Running", l: "Running" },
                { v: "HIIT", l: "HIIT" },
                { v: "Climbing", l: "Climbing" },
              ]}
            />
            <FilterGroup
              label="When"
              value={filters.when}
              onChange={(v) => setFilters((f) => ({ ...f, when: v as typeof f.when }))}
              options={[
                { v: "any", l: "Anytime" },
                { v: "today", l: "Today" },
                { v: "tomorrow", l: "Tomorrow" },
                { v: "this_week", l: "This week" },
                { v: "this_weekend", l: "This weekend" },
              ]}
            />
            <FilterGroup
              label="Duration"
              value={filters.duration}
              onChange={(v) => setFilters((f) => ({ ...f, duration: v as typeof f.duration }))}
              options={[
                { v: "any", l: "Any" },
                { v: "short", l: "≤ 30 min" },
                { v: "medium", l: "31–60 min" },
                { v: "long", l: "60+ min" },
              ]}
            />
            <FilterGroup
              label="Group size"
              value={filters.capacity}
              onChange={(v) => setFilters((f) => ({ ...f, capacity: v as typeof f.capacity }))}
              options={[
                { v: "any", l: "Any" },
                { v: "private", l: "1-on-1" },
                { v: "small", l: "Small (2–6)" },
                { v: "medium", l: "Medium (7–15)" },
                { v: "large", l: "Large (16+)" },
              ]}
            />
            <FilterGroup
              label="Booking type"
              value={filters.type}
              onChange={(v) => setFilters((f) => ({ ...f, type: v as typeof f.type }))}
              options={[
                { v: "all", l: "All" },
                { v: "scheduled", l: "Scheduled" },
                { v: "on_request", l: "On request" },
              ]}
            />
            <FilterGroup
              label="Availability"
              value={filters.spots}
              onChange={(v) => setFilters((f) => ({ ...f, spots: v as typeof f.spots }))}
              options={[
                { v: "any", l: "Any" },
                { v: "available", l: "Open / upcoming only" },
              ]}
            />
            <FilterGroup
              label="Sort by"
              value={filters.sort}
              onChange={(v) => setFilters((f) => ({ ...f, sort: v as typeof f.sort }))}
              options={[
                { v: "newest", l: "Newest" },
                { v: "soonest", l: "Soonest" },
                { v: "duration", l: "Shortest" },
              ]}
            />
            <FilterGroup
              label="Distance"
              value={filters.distance}
              onChange={(v) => setFilters((f) => ({ ...f, distance: v as typeof f.distance }))}
              options={[
                { v: "any", l: "Any" },
                { v: "1", l: "< 1 mi" },
                { v: "5", l: "< 5 mi" },
                { v: "10", l: "< 10 mi" },
                { v: "25", l: "< 25 mi" },
                { v: "50", l: "< 50 mi" },
              ]}
            />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                Date range
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-full",
                      !filters.dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd")} -{" "}
                          {format(filters.dateRange.to, "LLL dd")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "LLL dd")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={filters.dateRange}
                    onSelect={(range) =>
                      setFilters((f) => ({ ...f, dateRange: range }))
                    }
                    numberOfMonths={1}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="border-t bg-card px-5 py-3 flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                setFilters({
                  category: "all",
                  activity: "all",
                  when: "any",
                  duration: "any",
                  capacity: "any",
                  type: "all",
                  spots: "any",
                  sort: "newest",
                  distance: "any",
                  dateRange: undefined,
                })
              }
            >
              Clear all
            </Button>
            <Button
              className="flex-[1.4] bg-gradient-hero shadow-elegant"
              onClick={() => setFiltersOpen(false)}
            >
              Show results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onChange(o.v)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs border transition-all",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border",
              )}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}


function HostsScreen({ onSelect }: { onSelect: (h: HostItem) => void }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<string>("All");
  const [filters, setFilters] = useState({
    type: "all" as "all" | "person" | "gym",
    activity: "all" as "all" | (typeof HOST_ACTIVITIES)[number],
    distance: "any" as "any" | "1" | "5" | "10" | "25",
    minRating: "any" as "any" | "4.5" | "4.8",
    price: "any" as "any" | "low" | "mid" | "high",
    sort: "recommended" as "recommended" | "rating" | "distance" | "price",
  });
  const activeCount =
    (filters.type !== "all" ? 1 : 0) +
    (filters.activity !== "all" ? 1 : 0) +
    (filters.distance !== "any" ? 1 : 0) +
    (filters.minRating !== "any" ? 1 : 0) +
    (filters.price !== "any" ? 1 : 0);

  const filtered = useMemo(() => {
    let list = HOSTS.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.activities.some((a) => a.toLowerCase().includes(q)) ||
          h.location.toLowerCase().includes(q),
      );
    }
    if (activeChip !== "All") {
      list = list.filter((h) => h.activities.includes(activeChip));
    }
    if (filters.type !== "all") list = list.filter((h) => h.type === filters.type);
    if (filters.activity !== "all")
      list = list.filter((h) => h.activities.includes(filters.activity));
    if (filters.distance !== "any")
      list = list.filter((h) => h.distance <= Number(filters.distance));
    if (filters.minRating !== "any")
      list = list.filter((h) => h.rating >= Number(filters.minRating));
    if (filters.price !== "any") {
      list = list.filter((h) =>
        filters.price === "low"
          ? h.pricePerHour < 50
          : filters.price === "mid"
            ? h.pricePerHour >= 50 && h.pricePerHour < 75
            : h.pricePerHour >= 75,
      );
    }
    if (filters.sort === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (filters.sort === "distance") list.sort((a, b) => a.distance - b.distance);
    else if (filters.sort === "price") list.sort((a, b) => a.pricePerHour - b.pricePerHour);
    return list;
  }, [query, activeChip, filters]);

  return (
    <div className="h-full relative">
      <ScreenScroll>
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Discover</p>
              <h2 className="font-display text-2xl font-semibold">Find a host</h2>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-semibold">
              J
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search trainers and gyms"
                className="pl-9 rounded-full bg-muted/60 border-0"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              className={cn(
                "relative h-10 w-10 shrink-0 rounded-full flex items-center justify-center border",
                activeCount > 0
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto mt-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["All", ...HOST_ACTIVITIES] as string[]).map((c) => {
              const active = c === activeChip;
              return (
                <button
                  key={c}
                  onClick={() => setActiveChip(c)}
                  className={cn(
                    "shrink-0 px-3 py-1 rounded-full text-xs border transition-all",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-foreground border-border",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Hosts</h3>
            <span className="text-xs text-muted-foreground">{filtered.length} found</span>
          </div>
          <div className="space-y-3">
            {filtered.map((h) => (
              <Card
                key={h.id}
                onClick={() => onSelect(h)}
                className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border-border/60"
              >
                <div className="p-3 flex gap-3">
                  <div
                    className="h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-background font-semibold"
                    style={{ background: h.image }}
                  >
                    {h.type === "gym" ? (
                      <Building2 className="h-6 w-6" />
                    ) : (
                      h.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm leading-tight truncate">
                          {h.name}
                        </h4>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {h.type === "gym" ? (
                              <>
                                <Building2 className="h-3 w-3" /> Gym
                              </>
                            ) : (
                              <>
                                <UserIcon className="h-3 w-3" /> Trainer
                              </>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            {h.rating} ({h.reviews})
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        ${h.pricePerHour}
                        <span className="text-[10px] font-normal text-muted-foreground">/hr</span>
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {h.location}
                      </span>
                      <span>· {h.distance} mi</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {h.activities.map((a) => (
                        <span
                          key={a}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-foreground border border-border"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">
                No hosts match your filters.
              </p>
            )}
          </div>
        </div>
      </ScreenScroll>

      {/* Filters slide-up */}
      <div
        className={cn(
          "absolute inset-0 z-30 transition-opacity",
          filtersOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-foreground/40"
          onClick={() => setFiltersOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-background rounded-t-3xl border-t shadow-elegant max-h-[88%] flex flex-col transition-transform duration-300",
            filtersOpen ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="pt-2 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="px-5 py-3 flex items-center justify-between border-b">
            <h3 className="font-display text-lg font-semibold">Filter hosts</h3>
            <button
              onClick={() => setFiltersOpen(false)}
              className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterGroup
              label="Host type"
              value={filters.type}
              onChange={(v) => setFilters((f) => ({ ...f, type: v as typeof f.type }))}
              options={[
                { v: "all", l: "All" },
                { v: "person", l: "Trainers" },
                { v: "gym", l: "Gyms" },
              ]}
            />
            <FilterGroup
              label="Activity"
              value={filters.activity}
              onChange={(v) => setFilters((f) => ({ ...f, activity: v as typeof f.activity }))}
              options={[
                { v: "all", l: "All" },
                ...HOST_ACTIVITIES.map((a) => ({ v: a, l: a })),
              ]}
            />
            <FilterGroup
              label="Distance"
              value={filters.distance}
              onChange={(v) => setFilters((f) => ({ ...f, distance: v as typeof f.distance }))}
              options={[
                { v: "any", l: "Any" },
                { v: "1", l: "< 1 mi" },
                { v: "5", l: "< 5 mi" },
                { v: "10", l: "< 10 mi" },
                { v: "25", l: "< 25 mi" },
              ]}
            />
            <FilterGroup
              label="Min rating"
              value={filters.minRating}
              onChange={(v) => setFilters((f) => ({ ...f, minRating: v as typeof f.minRating }))}
              options={[
                { v: "any", l: "Any" },
                { v: "4.5", l: "4.5+" },
                { v: "4.8", l: "4.8+" },
              ]}
            />
            <FilterGroup
              label="Price / hour"
              value={filters.price}
              onChange={(v) => setFilters((f) => ({ ...f, price: v as typeof f.price }))}
              options={[
                { v: "any", l: "Any" },
                { v: "low", l: "< $50" },
                { v: "mid", l: "$50–75" },
                { v: "high", l: "$75+" },
              ]}
            />
            <FilterGroup
              label="Sort by"
              value={filters.sort}
              onChange={(v) => setFilters((f) => ({ ...f, sort: v as typeof f.sort }))}
              options={[
                { v: "recommended", l: "Recommended" },
                { v: "rating", l: "Top rated" },
                { v: "distance", l: "Nearest" },
                { v: "price", l: "Lowest price" },
              ]}
            />
          </div>
          <div className="border-t bg-card px-5 py-3 flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                setFilters({
                  type: "all",
                  activity: "all",
                  distance: "any",
                  minRating: "any",
                  price: "any",
                  sort: "recommended",
                })
              }
            >
              Clear all
            </Button>
            <Button
              className="flex-[1.4] bg-gradient-hero shadow-elegant"
              onClick={() => setFiltersOpen(false)}
            >
              Show results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapScreen({ onSelectHost }: { onSelectHost: (h: HostItem) => void }) {
  const [typeFilter, setTypeFilter] = useState<"all" | "person" | "gym">("all");
  const [activity, setActivity] = useState<"All" | (typeof HOST_ACTIVITIES)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    return HOSTS.filter((h) => {
      if (typeFilter !== "all" && h.type !== typeFilter) return false;
      if (activity !== "All" && !h.activities.includes(activity)) return false;
      return true;
    });
  }, [typeFilter, activity]);

  const selected = visible.find((h) => h.id === selectedId) ?? null;

  return (
    <div className="h-full relative">
      <div className="absolute inset-0">
        <HostsMap
          hosts={visible}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>

      {/* Top overlay: search + type pills */}
      <div className="absolute inset-x-0 top-0 z-10 px-4 pt-3 pb-2 bg-gradient-to-b from-background/95 to-background/0">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search this area"
              className="pl-9 rounded-full bg-card border-border shadow-elegant"
            />
          </div>
          <button className="h-10 w-10 shrink-0 rounded-full bg-card border border-border flex items-center justify-center shadow-elegant">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "person", "gym"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1 rounded-full text-xs border shadow-sm",
                typeFilter === t
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border",
              )}
            >
              {t === "all" ? "All" : t === "person" ? "Trainers" : "Gyms"}
            </button>
          ))}
        </div>
      </div>

      {/* Activity chips strip */}
      <div className="absolute inset-x-0 top-[112px] z-10 px-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["All", ...HOST_ACTIVITIES] as const).map((a) => (
            <button
              key={a}
              onClick={() => setActivity(a)}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-[11px] border shadow-sm",
                activity === a
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border",
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: selected host card or count */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-3">
        {selected ? (
          <Card
            onClick={() => onSelectHost(selected)}
            className="cursor-pointer overflow-hidden border-border/60 shadow-elegant active:scale-[0.99] transition-transform"
          >
            <div className="p-3 flex gap-3">
              <div
                className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center text-background font-semibold"
                style={{ background: selected.image }}
              >
                {selected.type === "gym" ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  selected.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight truncate">
                    {selected.name}
                  </h4>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    ${selected.pricePerHour}
                    <span className="text-[10px] font-normal text-muted-foreground">/hr</span>
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {selected.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selected.location}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {selected.activities.slice(0, 3).map((a) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-foreground border border-border"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t px-3 py-2 flex items-center justify-between text-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(null);
                }}
                className="text-muted-foreground"
              >
                Close
              </button>
              <span className="font-semibold text-primary inline-flex items-center gap-1">
                View profile <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </Card>
        ) : (
          <div className="mx-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-elegant text-xs">
            <MapPin className="h-3 w-3 text-primary" />
            {visible.length} hosts in this area
          </div>
        )}
      </div>
    </div>
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
        {/* Special events */}
        <div className="mt-5">

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

function SavedScreen({
  savedIds,
  onToggleSaved,
  onBack,
  onBrowse,
  onOpen,
}: {
  savedIds: Set<string>;
  onToggleSaved: (id: string) => void;
  onBack: () => void;
  onBrowse: () => void;
  onOpen: (id: string) => void;
}) {
  const saved = CLASSES.filter((c) => savedIds.has(c.id));
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="Saved classes" onBack={onBack} />
      <ScreenScroll>
        {saved.length === 0 ? (
          <div className="px-6 pt-14 pb-10 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-sm">No saved classes yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
              Tap the heart on any class to save it here for later.
            </p>
            <Button onClick={onBrowse} className="mt-5 bg-gradient-hero shadow-elegant">
              Browse classes
            </Button>
          </div>
        ) : (
          <div className="px-5 pt-3">
            <p className="text-xs text-muted-foreground mb-3">
              {saved.length} saved class{saved.length === 1 ? "" : "es"}
            </p>
            <div className="space-y-3">
              {saved.map((c) => (
                <Card
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border-border/60"
                >
                  <div className="flex">
                    <div
                      className="h-24 w-28 shrink-0"
                      style={{ background: c.image }}
                    />
                    <div className="p-3 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight truncate">
                          {c.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSaved(c.id);
                          }}
                          aria-label="Unsave"
                          className="h-7 w-7 -mt-1 -mr-1 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Heart className="h-4 w-4 fill-primary text-primary" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {c.host}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {c.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {c.location}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {c.activity}
                        </Badge>
                        <span className="text-sm font-semibold">${c.price}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </ScreenScroll>
    </div>
  );
}

type ProfileSection = "pPayment" | "pNotifications" | "pBecomeHost" | "pHelp" | "pMyGym";

function ProfileScreen({
  onBookings,
  onBrowse,
  onSaved,
  onOpenSection,
  savedCount,
}: {
  onBookings: () => void;
  onBrowse: () => void;
  onSaved: () => void;
  onOpenSection: (s: ProfileSection) => void;
  savedCount: number;
}) {
  const stats = [
    { label: "Booked", value: "12" },
    { label: "Hosts", value: "7" },
    { label: "Reviews", value: "9" },
  ];
  const rows: { label: string; sub: string; onClick?: () => void }[] = [
    { label: "My bookings", sub: "View upcoming & past classes", onClick: onBookings },
    { label: "My gym", sub: "Calder Strength Lab · Active", onClick: () => onOpenSection("pMyGym") },
    { label: "Payment methods", sub: "Visa •••• 4242", onClick: () => onOpenSection("pPayment") },
    {
      label: "Saved classes",
      sub: savedCount === 0 ? "No saved classes yet" : `${savedCount} saved`,
      onClick: onSaved,
    },
    { label: "Notifications", sub: "Push & email", onClick: () => onOpenSection("pNotifications") },
    { label: "Become a host", sub: "Share your craft on Pulstract", onClick: () => onOpenSection("pBecomeHost") },
    { label: "Help & support", sub: "FAQ, contact us", onClick: () => onOpenSection("pHelp") },
  ];

  return (
    <ScreenScroll>
      <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center font-display text-2xl font-semibold shadow-elegant">
          AM
        </div>
        <h2 className="font-display text-xl font-semibold mt-3">Alex Morgan</h2>
        <p className="text-xs text-muted-foreground">alex@pulstract.com</p>
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

function ProfilePaymentScreen({ onBack }: { onBack: () => void }) {
  const [methods, setMethods] = useState([
    { id: "1", brand: "Visa", last4: "4242", exp: "08/27", default: true },
    { id: "2", brand: "Mastercard", last4: "1117", exp: "03/26", default: false },
  ]);
  const makeDefault = (id: string) =>
    setMethods((m) => m.map((x) => ({ ...x, default: x.id === id })));
  const remove = (id: string) => setMethods((m) => m.filter((x) => x.id !== id));
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="Payment methods" onBack={onBack} />
      <ScreenScroll>
        <div className="px-5 pt-3 space-y-2">
          {methods.map((m) => (
            <Card key={m.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-12 rounded-md bg-gradient-hero text-primary-foreground flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {m.brand} •••• {m.last4}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Exp {m.exp}</p>
                </div>
                {m.default ? (
                  <Badge variant="secondary" className="text-[10px]">Default</Badge>
                ) : (
                  <button
                    onClick={() => makeDefault(m.id)}
                    className="text-[11px] text-primary font-medium"
                  >
                    Set default
                  </button>
                )}
              </div>
              {!m.default && (
                <button
                  onClick={() => remove(m.id)}
                  className="mt-2 text-[11px] text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              )}
            </Card>
          ))}
          <Button variant="outline" className="w-full mt-2">
            <Plus className="h-4 w-4 mr-1" /> Add payment method
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-3 px-4">
            <Lock className="inline h-3 w-3 mr-1" />
            Payments are processed securely.
          </p>
        </div>
      </ScreenScroll>
    </div>
  );
}

function ProfileNotificationsScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState({
    pushBookings: true,
    pushReminders: true,
    pushPromos: false,
    pushMessages: true,
    emailBookings: true,
    emailDigest: false,
    emailPromos: false,
  });
  type Key = keyof typeof prefs;
  const toggle = (k: Key) => setPrefs((p) => ({ ...p, [k]: !p[k] }));
  const Row = ({ k, label, sub }: { k: Key; label: string; sub: string }) => (
    <div className="py-2.5 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <button
        onClick={() => toggle(k)}
        role="switch"
        aria-checked={prefs[k]}
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors shrink-0",
          prefs[k] ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all",
            prefs[k] ? "left-[18px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="Notifications" onBack={onBack} />
      <ScreenScroll>
        <div className="px-5 pt-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            Push
          </p>
          <Card className="px-3 divide-y">
            <Row k="pushBookings" label="Booking updates" sub="Confirmations & changes" />
            <Row k="pushReminders" label="Class reminders" sub="1 hour before start" />
            <Row k="pushMessages" label="Messages from hosts" sub="Replies & questions" />
            <Row k="pushPromos" label="Offers & promos" sub="Occasional deals" />
          </Card>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1 mt-4">
            Email
          </p>
          <Card className="px-3 divide-y">
            <Row k="emailBookings" label="Booking receipts" sub="Always recommended" />
            <Row k="emailDigest" label="Weekly digest" sub="New classes near you" />
            <Row k="emailPromos" label="Promotional emails" sub="Featured hosts & events" />
          </Card>
        </div>
      </ScreenScroll>
    </div>
  );
}

function ProfileBecomeHostScreen({ onBack }: { onBack: () => void }) {
  const benefits = [
    { icon: DollarSign, label: "Set your own price", sub: "Keep 90% of every booking" },
    { icon: CalendarDays, label: "Flexible schedule", sub: "List sessions when you're free" },
    { icon: Users, label: "Reach new clients", sub: "Get discovered by people nearby" },
    { icon: TrendingUp, label: "Grow your brand", sub: "Reviews, followers, and metrics" },
  ];
  const steps = [
    "Tell us about you and your craft",
    "Add your first class or service",
    "Verify your ID and payouts",
    "Go live and start hosting",
  ];
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="Become a host" onBack={onBack} />
      <ScreenScroll>
        <div
          className="mx-5 mt-3 rounded-2xl p-5 text-primary-foreground shadow-elegant"
          style={{ background: "linear-gradient(135deg,#f4b942,#e07a5f)" }}
        >
          <Badge className="bg-background/20 text-primary-foreground hover:bg-background/20 border-0 mb-2">
            Earn on Pulstract
          </Badge>
          <h3 className="font-display text-xl font-semibold leading-tight">
            Turn your craft into income
          </h3>
          <p className="text-xs opacity-90 mt-1">
            Host yoga, BJJ, running clubs, PT sessions and more.
          </p>
        </div>

        <div className="px-5 mt-4 space-y-2">
          {benefits.map((b) => (
            <Card key={b.label} className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                <b.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{b.label}</p>
                <p className="text-[11px] text-muted-foreground">{b.sub}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="px-5 mt-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            How it works
          </p>
          <Card className="p-3 space-y-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-foreground text-background text-[11px] font-semibold flex items-center justify-center">
                  {i + 1}
                </div>
                <p className="text-sm">{s}</p>
              </div>
            ))}
          </Card>
        </div>

        <div className="px-5 mt-5 pb-2">
          <Button className="w-full bg-gradient-hero shadow-elegant">
            Start hosting
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Takes about 5 minutes
          </p>
        </div>
      </ScreenScroll>
    </div>
  );
}

function ProfileHelpScreen({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const faqs = [
    {
      q: "How do refunds work?",
      a: "Cancel up to 24 hours before the class for a full refund. Inside 24 hours we offer credit toward another class.",
    },
    {
      q: "What if my host cancels?",
      a: "You'll be refunded in full automatically and notified by push and email.",
    },
    {
      q: "Can I message a host before booking?",
      a: "Yes — tap a host's profile and use the Message button to ask a question.",
    },
    {
      q: "Is my payment information secure?",
      a: "Payments are processed by our PCI-compliant provider. We never store full card numbers.",
    },
  ];
  const links: { icon: typeof MessageSquare; label: string; sub: string }[] = [
    { icon: MessageSquare, label: "Chat with support", sub: "Replies in ~5 min" },
    { icon: Bell, label: "Report an issue", sub: "Booking, payment or host" },
    { icon: Sparkles, label: "Suggest a feature", sub: "Help shape Pulstract" },
  ];
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="Help & support" onBack={onBack} />
      <ScreenScroll>
        <div className="px-5 pt-3 space-y-2">
          {links.map((l) => (
            <Card
              key={l.label}
              className="p-3 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                <l.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{l.label}</p>
                <p className="text-[11px] text-muted-foreground">{l.sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Card>
          ))}
        </div>

        <div className="px-5 mt-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            FAQ
          </p>
          <Card className="divide-y">
            {faqs.map((f) => {
              const isOpen = open === f.q;
              return (
                <button
                  key={f.q}
                  onClick={() => setOpen(isOpen ? null : f.q)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-sm">{f.q}</p>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-90",
                      )}
                    />
                  </div>
                  {isOpen && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      {f.a}
                    </p>
                  )}
                </button>
              );
            })}
          </Card>
          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Pulstract · v1.0.0
          </p>
        </div>
      </ScreenScroll>
    </div>
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
  | "hostProfile"
  | "hpTemplates"
  | "hpPayouts"
  | "hpAvailability"
  | "hpReviews"
  | "hpSupport"
  | "hpGym"
  | "hpGymCreate"
  | "hpGymMembers"
  | "hpGymCoach"
  | "hpGymEdit";

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

type GymMember = {
  id: string;
  name: string;
  initials: string;
  email: string;
  plan: "Monthly" | "Annual" | "Day pass";
  role: "Owner" | "Coach" | "Member";
  joined: string;
  status: "Active" | "Pending" | "Paused";
};

type GymInfo = {
  created: boolean;
  name: string;
  tagline: string;
  address: string;
  capacity: number;
  monthlyPrice: number;
  amenities: string[];
};

const DEFAULT_GYM: GymInfo = {
  created: true,
  name: "Calder Strength Lab",
  tagline: "Small-group strength & conditioning in SoMa.",
  address: "248 Brannan St, San Francisco, CA",
  capacity: 18,
  monthlyPrice: 129,
  amenities: ["Showers", "Lockers", "Free weights", "Open gym hours"],
};

const DEFAULT_MEMBERS: GymMember[] = [
  { id: "m1", name: "Alex Morgan", initials: "AM", email: "alex@pulstract.com", plan: "Monthly", role: "Member", joined: "Mar 2025", status: "Active" },
  { id: "m2", name: "Priya Shah", initials: "PS", email: "priya.s@mail.com", plan: "Annual", role: "Member", joined: "Jan 2025", status: "Active" },
  { id: "m3", name: "Devon Walsh", initials: "DW", email: "devon@walsh.io", plan: "Monthly", role: "Coach", joined: "Nov 2024", status: "Active" },
  { id: "m4", name: "Mika Chen", initials: "MC", email: "mika.c@mail.com", plan: "Day pass", role: "Member", joined: "Today", status: "Pending" },
  { id: "m5", name: "Sam Reyes", initials: "SR", email: "sam.r@mail.com", plan: "Monthly", role: "Member", joined: "Feb 2025", status: "Paused" },
];

function HostFlow({ initialScreen }: { initialScreen?: HostScreenId }) {
  const [screen, setScreen] = useState<HostScreenId>(initialScreen ?? "dashboard");
  const [selectedId, setSelectedId] = useState<string>("h1");
  const [gym, setGym] = useState<GymInfo>(DEFAULT_GYM);
  const [members, setMembers] = useState<GymMember[]>(DEFAULT_MEMBERS);
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
    { id: "hpGym", label: "Manage your gym" },
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
              onOpenSection={(s) => setScreen(s)}
            />
          )}
          {screen === "hpTemplates" && (
            <HostTemplatesScreen onBack={() => setScreen("hostProfile")} />
          )}
          {screen === "hpPayouts" && (
            <HostPayoutsScreen onBack={() => setScreen("hostProfile")} />
          )}
          {screen === "hpAvailability" && (
            <HostAvailabilityScreen onBack={() => setScreen("hostProfile")} />
          )}
          {screen === "hpReviews" && (
            <HostReviewsScreen onBack={() => setScreen("hostProfile")} />
          )}
          {screen === "hpSupport" && (
            <HostSupportScreen onBack={() => setScreen("hostProfile")} />
          )}
          {screen === "hpGym" && (
            <HostGymScreen
              gym={gym}
              memberCount={members.length}
              onBack={() => setScreen("hostProfile")}
              onCreate={() => setScreen("hpGymCreate")}
              onMembers={() => setScreen("hpGymMembers")}
              onEdit={() => setScreen("hpGymEdit")}
            />
          )}
          {screen === "hpGymCreate" && (
            <HostGymCreateScreen
              onBack={() => setScreen("hpGym")}
              onCreate={(g) => {
                setGym({ ...g, created: true });
                setScreen("hpGym");
              }}
            />
          )}
          {screen === "hpGymMembers" && (
            <HostGymMembersScreen
              members={members}
              onChange={setMembers}
              onBack={() => setScreen("hpGym")}
            />
          )}
          {screen === "hpGymCoach" && (
            <HostGymCoachScreen
              gym={gym}
              members={members}
              onBack={() => setScreen("hpGym")}
              onMembers={() => setScreen("hpGymMembers")}
            />
          )}
          {screen === "hpGymEdit" && (
            <HostGymEditScreen
              gym={gym}
              onSave={(g) => {
                setGym({ ...g, created: true });
                setScreen("hpGym");
              }}
              onBack={() => setScreen("hpGym")}
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
            ["dashboard", "Dashboard", 0],
            ["create", "Publish a class", 0],
            ["manage", "Manage class", 0],
            ["earnings", "Earnings", 0],
            ["metrics", "Metrics", 0],
            ["hostProfile", "Host profile", 0],
            ["hpGym", "My gym", 1],
            ["hpGymCreate", "Create gym", 2],
            ["hpGymMembers", "Gym members", 2],
            ["hpGymCoach", "Coach view", 2],
            ["hpGymEdit", "Edit gym", 2],
            ["hpTemplates", "Class templates", 1],
            ["hpPayouts", "Payout settings", 1],
            ["hpAvailability", "Availability", 1],
            ["hpReviews", "Reviews", 1],
            ["hpSupport", "Help & support", 1],
          ] as [HostScreenId, string, number][]
        ).map(([s, label, level]) => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg border transition-all",
              level === 1 && "ml-4 w-[calc(100%-1rem)] py-2",
              level === 2 && "ml-8 w-[calc(100%-2rem)] py-1.5",
              screen === s
                ? "bg-primary text-primary-foreground border-primary shadow-elegant"
                : "bg-card hover:bg-muted border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("font-medium", level === 1 && "text-sm", level === 2 && "text-xs")}>{label}</span>
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
          <div className="mt-4">
            <svg viewBox="0 0 280 80" className="w-full h-20" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradEarnings" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {(() => {
                const w = 280, h = 76;
                const pts = bars.map((v, i) => {
                  const x = (i / (bars.length - 1)) * w;
                  const y = h - (v / 100) * h + 2;
                  return [x, y] as const;
                });
                const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
                const area = `${line} L${w},${h + 2} L0,${h + 2} Z`;
                return (
                  <>
                    <path d={area} fill="url(#gradEarnings)" />
                    <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                    {pts.map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r={bars[i] > 70 ? 3 : 2} fill="hsl(var(--primary))" />
                    ))}
                  </>
                );
              })()}
            </svg>
            <div className="flex justify-between mt-1 px-0.5">
              {days.map((d, i) => (
                <span key={i} className="text-[10px] text-muted-foreground">{d}</span>
              ))}
            </div>
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

function HostProfileScreen({
  onDashboard,
  onOpenSection,
}: {
  onDashboard: () => void;
  onOpenSection: (s: HostScreenId) => void;
}) {
  const stats = [
    { label: "Classes", value: "128" },
    { label: "Students", value: "1.2k" },
    { label: "Rating", value: "4.9" },
  ];
  const rows: { id: HostScreenId; label: string; sub: string }[] = [
    { id: "hpGym", label: "My gym", sub: "Manage gym & members" },
    { id: "hpTemplates", label: "Class templates", sub: "5 saved" },
    { id: "hpPayouts", label: "Payout settings", sub: "Bank •••• 6201" },
    { id: "hpAvailability", label: "Availability", sub: "Mon–Sat mornings" },
    { id: "hpReviews", label: "Reviews", sub: "184 reviews" },
    { id: "hpSupport", label: "Help & support", sub: "FAQ, contact us" },
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
          <button
            key={r.id}
            onClick={() => onOpenSection(r.id)}
            className="w-full text-left"
          >
            <Card className="p-3 flex items-center gap-3 hover:bg-muted transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{r.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Card>
          </button>
        ))}

        <Button onClick={onDashboard} variant="outline" className="w-full mt-2">
          Back to dashboard
        </Button>
      </div>
    </ScreenScroll>
  );
}

function HostTemplatesScreen({ onBack }: { onBack: () => void }) {
  const templates = [
    { title: "Sunrise Vinyasa Flow", activity: "Yoga", duration: "60 min", price: 22, uses: 42 },
    { title: "Lunchtime Mobility", activity: "Mobility", duration: "45 min", price: 18, uses: 18 },
    { title: "Evening Power Flow", activity: "Yoga", duration: "75 min", price: 28, uses: 31 },
    { title: "Yin & Restore", activity: "Yoga", duration: "60 min", price: 20, uses: 12 },
    { title: "Core & Breath", activity: "Pilates", duration: "45 min", price: 19, uses: 7 },
  ];
  return (
    <ScreenScroll>
      <ScreenHeader title="Class templates" onBack={onBack} />
      <div className="px-5 pb-4 space-y-2">
        <p className="text-xs text-muted-foreground mb-1">
          Reuse a template to publish a class in seconds.
        </p>
        {templates.map((t) => (
          <Card key={t.title} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{t.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.activity} · {t.duration} · ${t.price}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                Used {t.uses}×
              </Badge>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1 h-8 text-xs">Use template</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs">Edit</Button>
            </div>
          </Card>
        ))}
        <Button variant="outline" className="w-full mt-2">
          <Plus className="h-4 w-4 mr-1" /> New template
        </Button>
      </div>
    </ScreenScroll>
  );
}

function HostPayoutsScreen({ onBack }: { onBack: () => void }) {
  const payouts = [
    { date: "May 28", amount: 1240, status: "Paid" },
    { date: "May 14", amount: 980, status: "Paid" },
    { date: "Apr 30", amount: 1105, status: "Paid" },
    { date: "Apr 16", amount: 860, status: "Paid" },
  ];
  return (
    <ScreenScroll>
      <ScreenHeader title="Payout settings" onBack={onBack} />
      <div className="px-5 pb-4 space-y-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Next payout</p>
          <p className="font-display text-2xl font-semibold mt-1">$842.50</p>
          <p className="text-[11px] text-muted-foreground">Scheduled June 11</p>
        </Card>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Payout method
          </p>
          <Card className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Chase Checking</p>
              <p className="text-[11px] text-muted-foreground">Bank •••• 6201</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Default</Badge>
          </Card>
          <Button variant="outline" size="sm" className="w-full mt-2 h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add payout method
          </Button>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Schedule
          </p>
          <Card className="p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Frequency</span>
              <span className="font-medium">Bi-weekly</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-medium">USD</span>
            </div>
          </Card>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Recent payouts
          </p>
          <Card className="p-2 divide-y">
            {payouts.map((p) => (
              <div key={p.date} className="flex items-center justify-between px-2 py-2 text-sm">
                <span>{p.date}</span>
                <span className="font-medium">${p.amount.toLocaleString()}</span>
                <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </ScreenScroll>
  );
}

function HostAvailabilityScreen({ onBack }: { onBack: () => void }) {
  const days = [
    { d: "Mon", slots: ["7–9a", "12–1p"] },
    { d: "Tue", slots: ["7–9a"] },
    { d: "Wed", slots: ["7–9a", "6–8p"] },
    { d: "Thu", slots: ["7–9a"] },
    { d: "Fri", slots: ["7–9a", "12–1p"] },
    { d: "Sat", slots: ["8–11a"] },
    { d: "Sun", slots: [] },
  ];
  return (
    <ScreenScroll>
      <ScreenHeader title="Availability" onBack={onBack} />
      <div className="px-5 pb-4 space-y-3">
        <Card className="p-3 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Accepting bookings</p>
            <p className="text-[11px] text-muted-foreground">Show your classes in browse</p>
          </div>
          <div className="h-6 w-10 rounded-full bg-primary relative">
            <div className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow" />
          </div>
        </Card>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Weekly hours
          </p>
          <Card className="p-2 divide-y">
            {days.map((d) => (
              <div key={d.d} className="flex items-center justify-between px-2 py-2.5">
                <span className="font-medium text-sm w-12">{d.d}</span>
                <div className="flex-1 flex flex-wrap gap-1 justify-end">
                  {d.slots.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground">Unavailable</span>
                  ) : (
                    d.slots.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">
                        {s}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Time off
          </p>
          <Card className="p-3 text-sm">
            <p className="font-medium">Jun 20 – Jun 27</p>
            <p className="text-[11px] text-muted-foreground">Vacation · classes paused</p>
          </Card>
          <Button variant="outline" size="sm" className="w-full mt-2 h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add time off
          </Button>
        </div>
      </div>
    </ScreenScroll>
  );
}

function HostReviewsScreen({ onBack }: { onBack: () => void }) {
  const summary = [
    { stars: 5, pct: 86 },
    { stars: 4, pct: 10 },
    { stars: 3, pct: 3 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 0 },
  ];
  const reviews = [
    { name: "Priya S.", stars: 5, text: "Maya's flow is the highlight of my week. Calm, clear cues.", when: "2d" },
    { name: "Devon W.", stars: 5, text: "Best sunrise class in the city. Worth the early alarm.", when: "5d" },
    { name: "Mika C.", stars: 4, text: "Loved the playlist. Could use a bit more cool-down.", when: "1w" },
    { name: "Sam R.", stars: 5, text: "Beginner-friendly without being boring.", when: "2w" },
  ];
  return (
    <ScreenScroll>
      <ScreenHeader title="Reviews" onBack={onBack} />
      <div className="px-5 pb-4 space-y-3">
        <Card className="p-4 flex items-center gap-4">
          <div className="text-center">
            <p className="font-display text-3xl font-semibold">4.9</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              184 reviews
            </p>
          </div>
          <div className="flex-1 space-y-1">
            {summary.map((s) => (
              <div key={s.stars} className="flex items-center gap-2 text-[11px]">
                <span className="w-3 text-muted-foreground">{s.stars}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
                <span className="w-7 text-right text-muted-foreground">{s.pct}%</span>
              </div>
            ))}
          </div>
        </Card>

        {reviews.map((r) => (
          <Card key={r.name} className="p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{r.name}</p>
              <span className="text-[10px] text-muted-foreground">{r.when}</span>
            </div>
            <div className="flex gap-0.5 my-1">
              {Array.from({ length: r.stars }).map((_, i) => (
                <Sparkles key={i} className="h-3 w-3 text-primary" />
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground leading-snug">{r.text}</p>
          </Card>
        ))}
      </div>
    </ScreenScroll>
  );
}

function HostSupportScreen({ onBack }: { onBack: () => void }) {
  const faqs = [
    "How do payouts work?",
    "Can I cancel or reschedule a class?",
    "What happens if a student no-shows?",
    "How do I edit my host profile?",
    "Tax documents and 1099s",
  ];
  return (
    <ScreenScroll>
      <ScreenHeader title="Help & support" onBack={onBack} />
      <div className="px-5 pb-4 space-y-3">
        <Card className="p-4 bg-gradient-hero text-primary-foreground">
          <p className="font-display text-lg font-semibold">Need a hand?</p>
          <p className="text-[12px] opacity-90 mt-0.5">
            Our host team replies in under 2 hours, 7 days a week.
          </p>
          <Button size="sm" variant="secondary" className="mt-3 h-8 text-xs">
            Message support
          </Button>
        </Card>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Popular questions
          </p>
          <Card className="p-1 divide-y">
            {faqs.map((q) => (
              <button
                key={q}
                className="w-full flex items-center justify-between px-3 py-3 text-left text-sm hover:bg-muted rounded-md"
              >
                <span className="pr-3">{q}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </Card>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Contact
          </p>
          <Card className="p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">hosts@pulstract.app</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Response time</span>
              <span className="font-medium">~2 hours</span>
            </div>
          </Card>
        </div>
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
          <div className="mt-4">
            <svg viewBox="0 0 280 110" className="w-full h-28" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradImp" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="gradViews" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {(() => {
                const w = 280, h = 100;
                const pts = (key: "impressions" | "views") =>
                  visibility.map((d, i) => {
                    const x = (i / (visibility.length - 1)) * w;
                    const y = h - (d[key] / maxImp) * h;
                    return [x, y] as const;
                  });
                const toPath = (p: readonly (readonly [number, number])[]) =>
                  p.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
                const toArea = (p: readonly (readonly [number, number])[]) =>
                  `${toPath(p)} L${w},${h} L0,${h} Z`;
                const impPts = pts("impressions");
                const viewPts = pts("views");
                return (
                  <>
                    <path d={toArea(impPts)} fill="url(#gradImp)" />
                    <path d={toPath(impPts)} fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.6" strokeWidth="1.5" />
                    <path d={toArea(viewPts)} fill="url(#gradViews)" />
                    <path d={toPath(viewPts)} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                    {viewPts.map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="2" fill="hsl(var(--primary))" />
                    ))}
                  </>
                );
              })()}
            </svg>
            <div className="flex justify-between mt-1 px-0.5">
              {visibility.map((d, i) => (
                <span key={i} className="text-[10px] text-muted-foreground">{d.day}</span>
              ))}
            </div>
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

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Return rate", value: "62%", delta: "+4%", up: true },
              { label: "Avg sessions", value: "8.3", delta: "+0.6", up: true },
              { label: "Churn / mo", value: "11%", delta: "−2%", up: true },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border p-2">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className="font-display text-base font-semibold leading-tight">{s.value}</p>
                <p className={cn("text-[10px] mt-0.5", s.up ? "text-primary" : "text-destructive")}>
                  {s.delta} vs last mo
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium">Returning vs new students</p>
              <span className="text-[10px] text-muted-foreground">last 6 weeks</span>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {[
                { r: 18, n: 9 }, { r: 22, n: 11 }, { r: 24, n: 8 },
                { r: 28, n: 12 }, { r: 31, n: 7 }, { r: 34, n: 10 },
              ].map((b, i) => {
                const total = b.r + b.n;
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className="bg-muted rounded-t-sm"
                      style={{ height: `${(b.n / 45) * 100}%` }}
                    />
                    <div
                      className="bg-primary"
                      style={{ height: `${(b.r / 45) * 100}%` }}
                    />
                    <p className="text-[9px] text-center text-muted-foreground mt-1">W{i + 1}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-primary" /> Returning
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-muted" /> New
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {[
              { label: "Lifetime value", value: "$184", sub: "avg per student", icon: DollarSign },
              { label: "Loyal students", value: "47", sub: "5+ classes booked", icon: Star },
              { label: "At-risk", value: "12", sub: "no booking in 21 days", icon: TrendingUp },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3 rounded-lg border p-2.5">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.sub}</p>
                </div>
                <p className="font-display text-sm font-semibold">{r.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg bg-primary/10 border border-primary/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-primary">
                Win-back idea
              </span>
            </div>
            <p className="text-xs">
              Send a free pass to the 12 at-risk students. Hosts who do see a 28% reactivation rate.
            </p>
            <Button size="sm" className="w-full mt-2 h-8 text-xs">
              Create win-back campaign
            </Button>
          </div>
        </Card>

        {/* Peak hours */}
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Peak booking hours</p>
          <p className="font-display text-lg font-semibold">When students book</p>
          <div className="mt-3">
            <svg viewBox="0 0 280 80" className="w-full h-20" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradPeak" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {(() => {
                const w = 280, h = 76;
                const pts = peakHours.map((p, i) => {
                  const x = (i / (peakHours.length - 1)) * w;
                  const y = h - (p.v / 100) * h + 2;
                  return [x, y] as const;
                });
                const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
                const area = `${line} L${w},${h + 2} L0,${h + 2} Z`;
                return (
                  <>
                    <path d={area} fill="url(#gradPeak)" />
                    <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                    {pts.map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r={peakHours[i].v > 70 ? 3 : 2} fill="hsl(var(--primary))" />
                    ))}
                  </>
                );
              })()}
            </svg>
            <div className="flex justify-between mt-1 px-0.5">
              {peakHours.map((p) => (
                <span key={p.h} className="text-[9px] text-muted-foreground">{p.h}</span>
              ))}
            </div>
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

/* ---------------- Gym management ---------------- */

const GYM_AMENITIES = [
  "Showers",
  "Lockers",
  "Free weights",
  "Open gym hours",
  "Sauna",
  "Childcare",
  "Parking",
  "Towel service",
];

function HostGymScreen({
  gym,
  memberCount,
  onBack,
  onCreate,
  onMembers,
  onEdit,
}: {
  gym: GymInfo;
  memberCount: number;
  onBack: () => void;
  onCreate: () => void;
  onMembers: () => void;
  onEdit: () => void;
}) {
  if (!gym.created) {
    return (
      <div className="h-full flex flex-col">
        <ScreenHeader title="My gym" onBack={onBack} />
        <ScreenScroll>
          <div
            className="mx-5 mt-3 rounded-2xl p-5 text-primary-foreground shadow-elegant"
            style={{ background: "linear-gradient(135deg,#5f4bdb,#9d8df1)" }}
          >
            <Badge className="bg-background/20 text-primary-foreground hover:bg-background/20 border-0 mb-2">
              New
            </Badge>
            <h3 className="font-display text-xl font-semibold leading-tight">
              Own a space? Open your gym.
            </h3>
            <p className="text-xs opacity-90 mt-1">
              Manage members, plans, and open-gym hours alongside your classes.
            </p>
          </div>
          <div className="px-5 mt-4 space-y-2">
            {[
              { icon: Users, label: "Manage members", sub: "Invite, suspend, set roles" },
              { icon: CreditCard, label: "Recurring plans", sub: "Monthly, annual, day passes" },
              { icon: BarChart3, label: "Track activity", sub: "Check-ins, retention, growth" },
              { icon: Building2, label: "Your branded page", sub: "A public profile on Pulstract" },
            ].map((b) => (
              <Card key={b.label} className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                  <b.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{b.label}</p>
                  <p className="text-[11px] text-muted-foreground">{b.sub}</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="px-5 mt-5 pb-4">
            <Button onClick={onCreate} className="w-full bg-gradient-hero hover:opacity-90 shadow-elegant">
              Create your gym
            </Button>
          </div>
        </ScreenScroll>
      </div>
    );
  }

  const active = "—";
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="My gym" onBack={onBack} />
      <ScreenScroll>
        <div className="px-5 pt-3">
          <Card className="overflow-hidden">
            <div
              className="h-24 w-full"
              style={{ background: "linear-gradient(135deg,#5f4bdb,#9d8df1)" }}
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold leading-tight">{gym.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{gym.address}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  <Building2 className="h-3 w-3 mr-1" />
                  Owner
                </Badge>
              </div>
              <p className="text-xs mt-2 text-muted-foreground">{gym.tagline}</p>
            </div>
          </Card>

          <Card className="p-3 mt-3 grid grid-cols-3 divide-x">
            <div className="text-center px-2">
              <p className="font-display text-lg font-semibold">{memberCount}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Members</p>
            </div>
            <div className="text-center px-2">
              <p className="font-display text-lg font-semibold">${gym.monthlyPrice}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Monthly</p>
            </div>
            <div className="text-center px-2">
              <p className="font-display text-lg font-semibold">{gym.capacity}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Capacity</p>
            </div>
          </Card>

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-4 mb-1">
            Manage
          </p>
          <div className="space-y-2">
            {[
              { label: "Members", sub: `${memberCount} total · review pending`, icon: Users, onClick: onMembers },
              { label: "Gym details", sub: "Name, address, amenities", icon: Building2, onClick: onEdit },
              { label: "Plans & pricing", sub: `From $${gym.monthlyPrice}/mo`, icon: CreditCard },
              { label: "Check-ins", sub: `${active} today`, icon: Activity },
              { label: "Insights", sub: "Retention & growth", icon: BarChart3 },
            ].map((r) => (
              <Card
                key={r.label}
                onClick={r.onClick}
                className={cn(
                  "p-3 flex items-center gap-3",
                  r.onClick && "cursor-pointer active:scale-[0.99] transition-transform",
                )}
              >
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            ))}
          </div>

          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-4 mb-1">
            Amenities
          </p>
          <div className="flex flex-wrap gap-1.5 pb-4">
            {gym.amenities.map((a) => (
              <Badge key={a} variant="secondary" className="text-[10px]">
                {a}
              </Badge>
            ))}
          </div>
        </div>
      </ScreenScroll>
    </div>
  );
}

function HostGymCreateScreen({
  onBack,
  onCreate,
}: {
  onBack: () => void;
  onCreate: (g: GymInfo) => void;
}) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [monthlyPrice, setMonthlyPrice] = useState("99");
  const [amenities, setAmenities] = useState<string[]>(["Showers", "Lockers"]);
  const toggle = (a: string) =>
    setAmenities((arr) => (arr.includes(a) ? arr.filter((x) => x !== a) : [...arr, a]));
  const valid = name.trim().length > 1 && address.trim().length > 3;
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="Create your gym" onBack={onBack} />
      <ScreenScroll>
        <div className="px-5 pt-3 pb-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Gym name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calder Strength Lab" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tagline</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line about your gym" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Capacity</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Monthly $</Label>
              <Input type="number" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Amenities</Label>
            <div className="flex flex-wrap gap-1.5">
              {GYM_AMENITIES.map((a) => {
                const on = amenities.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggle(a)}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground",
                    )}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <Button
            disabled={!valid}
            onClick={() =>
              onCreate({
                created: true,
                name: name.trim(),
                tagline: tagline.trim() || "Welcome to our gym.",
                address: address.trim(),
                capacity: Math.max(1, parseInt(capacity || "20", 10)),
                monthlyPrice: Math.max(0, parseInt(monthlyPrice || "0", 10)),
                amenities,
              })
            }
            className="w-full bg-gradient-hero hover:opacity-90 shadow-elegant"
          >
            Create gym
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            You can edit any of these later.
          </p>
        </div>
      </ScreenScroll>
    </div>
  );
}

function HostGymEditScreen({
  gym,
  onBack,
  onSave,
}: {
  gym: GymInfo;
  onBack: () => void;
  onSave: (g: GymInfo) => void;
}) {
  const [name, setName] = useState(gym.name);
  const [tagline, setTagline] = useState(gym.tagline);
  const [address, setAddress] = useState(gym.address);
  const [capacity, setCapacity] = useState(String(gym.capacity));
  const [monthlyPrice, setMonthlyPrice] = useState(String(gym.monthlyPrice));
  const [amenities, setAmenities] = useState<string[]>(gym.amenities);
  const toggle = (a: string) =>
    setAmenities((arr) => (arr.includes(a) ? arr.filter((x) => x !== a) : [...arr, a]));
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="Edit gym" onBack={onBack} />
      <ScreenScroll>
        <div className="px-5 pt-3 pb-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Gym name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tagline</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Capacity</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Monthly $</Label>
              <Input type="number" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Amenities</Label>
            <div className="flex flex-wrap gap-1.5">
              {GYM_AMENITIES.map((a) => {
                const on = amenities.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggle(a)}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground",
                    )}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <Button
            onClick={() =>
              onSave({
                created: true,
                name: name.trim() || gym.name,
                tagline: tagline.trim(),
                address: address.trim() || gym.address,
                capacity: Math.max(1, parseInt(capacity || "1", 10)),
                monthlyPrice: Math.max(0, parseInt(monthlyPrice || "0", 10)),
                amenities,
              })
            }
            className="w-full bg-gradient-hero hover:opacity-90 shadow-elegant"
          >
            Save changes
          </Button>
        </div>
      </ScreenScroll>
    </div>
  );
}

function HostGymMembersScreen({
  members,
  onChange,
  onBack,
}: {
  members: GymMember[];
  onChange: (m: GymMember[]) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "Active" | "Pending" | "Paused">("all");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPlan, setNewPlan] = useState<GymMember["plan"]>("Monthly");

  const filtered = members.filter((m) => {
    const matchQ =
      !query ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === "all" || m.status === filter;
    return matchQ && matchF;
  });

  const setRole = (id: string, role: GymMember["role"]) =>
    onChange(members.map((m) => (m.id === id ? { ...m, role } : m)));
  const setStatus = (id: string, status: GymMember["status"]) =>
    onChange(members.map((m) => (m.id === id ? { ...m, status } : m)));
  const remove = (id: string) => onChange(members.filter((m) => m.id !== id));
  const add = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const initials = newName
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    onChange([
      ...members,
      {
        id: `m${Date.now()}`,
        name: newName.trim(),
        email: newEmail.trim(),
        initials,
        plan: newPlan,
        role: "Member",
        joined: "Today",
        status: "Pending",
      },
    ]);
    setNewName("");
    setNewEmail("");
    setAdding(false);
  };

  const counts = {
    all: members.length,
    Active: members.filter((m) => m.status === "Active").length,
    Pending: members.filter((m) => m.status === "Pending").length,
    Paused: members.filter((m) => m.status === "Paused").length,
  };

  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="Members" onBack={onBack} />
      <ScreenScroll>
        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="pl-9"
            />
          </div>

          <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
            {(["all", "Active", "Pending", "Paused"] as const).map((f) => {
              const on = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors",
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground",
                  )}
                >
                  {f === "all" ? "All" : f} · {counts[f]}
                </button>
              );
            })}
          </div>

          {adding ? (
            <Card className="p-3 mt-3 space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Full name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Plan</Label>
                <div className="flex gap-1.5">
                  {(["Monthly", "Annual", "Day pass"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewPlan(p)}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                        newPlan === p
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={add} size="sm" className="flex-1">Send invite</Button>
                <Button onClick={() => setAdding(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </Card>
          ) : (
            <Button onClick={() => setAdding(true)} variant="outline" className="w-full mt-3">
              <Plus className="h-4 w-4 mr-1" /> Invite member
            </Button>
          )}

          <div className="mt-3 space-y-2 pb-4">
            {filtered.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-xs text-muted-foreground">No members match.</p>
              </Card>
            )}
            {filtered.map((m) => (
              <Card key={m.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center font-semibold text-xs">
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <Badge
                    variant={m.status === "Active" ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px]",
                      m.status === "Pending" && "border-amber-500 text-amber-600",
                      m.status === "Paused" && "border-muted-foreground text-muted-foreground",
                    )}
                  >
                    {m.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span>{m.plan}</span>
                  <span>·</span>
                  <span>{m.role}</span>
                  <span>·</span>
                  <span>Joined {m.joined}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(["Member", "Coach", "Owner"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(m.id, r)}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                        m.role === r
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                  <div className="flex-1" />
                  {m.status !== "Active" && (
                    <button
                      onClick={() => setStatus(m.id, "Active")}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border text-primary"
                    >
                      Activate
                    </button>
                  )}
                  {m.status === "Active" && (
                    <button
                      onClick={() => setStatus(m.id, "Paused")}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground"
                    >
                      Pause
                    </button>
                  )}
                  <button
                    onClick={() => remove(m.id)}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </ScreenScroll>
    </div>
  );
}

/* ---------------- Host: coach-of-a-gym view ---------------- */

function HostGymCoachScreen({
  gym,
  members,
  onBack,
  onMembers,
}: {
  gym: GymInfo;
  members: GymMember[];
  onBack: () => void;
  onMembers: () => void;
}) {
  const myStudents = members.filter((m) => m.role === "Member").slice(0, 4);
  const upcoming = [
    { day: "Today", time: "6:30 PM", title: "Strength Foundations", attendees: 9, cap: 12 },
    { day: "Tomorrow", time: "7:00 AM", title: "Olympic Lifting", attendees: 6, cap: 8 },
    { day: "Wed", time: "5:30 PM", title: "Conditioning", attendees: 11, cap: 12 },
  ];
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="Coach view" onBack={onBack} />
      <ScreenScroll>
        <div className="px-5 pt-3">
          <Card className="overflow-hidden">
            <div
              className="h-20 w-full"
              style={{ background: "linear-gradient(135deg,#0ea5a3,#22c55e)" }}
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Coaching at
                  </p>
                  <h3 className="font-display text-lg font-semibold leading-tight">{gym.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{gym.address}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" /> Coach
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-3 mt-3 grid grid-cols-3 divide-x">
            <div className="text-center px-2">
              <p className="font-display text-lg font-semibold">{myStudents.length * 4}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Students</p>
            </div>
            <div className="text-center px-2">
              <p className="font-display text-lg font-semibold">14</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sessions / wk</p>
            </div>
            <div className="text-center px-2">
              <p className="font-display text-lg font-semibold">4.9</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Rating</p>
            </div>
          </Card>

          <h3 className="font-semibold text-sm mt-4 mb-2">Your schedule</h3>
          <div className="space-y-2">
            {upcoming.map((u) => (
              <Card key={u.title + u.day} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {u.day} · {u.time}
                    </p>
                    <p className="font-medium text-sm truncate">{u.title}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    <Users className="h-3 w-3 mr-1" />
                    {u.attendees}/{u.cap}
                  </Badge>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(u.attendees / u.cap) * 100}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 mb-2">
            <h3 className="font-semibold text-sm">My students</h3>
            <button onClick={onMembers} className="text-xs text-primary">
              See all
            </button>
          </div>
          <div className="space-y-2 pb-4">
            {myStudents.map((m) => (
              <Card key={m.id} className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-hero text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {m.plan} · joined {m.joined}
                  </p>
                </div>
                <button className="text-[10px] px-2 py-1 rounded-full border border-border">
                  Message
                </button>
              </Card>
            ))}
          </div>

          <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-primary">
                Coach tip
              </span>
            </div>
            <p className="text-xs">
              3 of your students haven't booked in 2 weeks. Send a quick check-in to keep them on track.
            </p>
          </div>
        </div>
      </ScreenScroll>
    </div>
  );
}

/* ---------------- User: my gym ---------------- */

function ProfileMyGymScreen({ onBack }: { onBack: () => void }) {
  const gym = {
    name: "Calder Strength Lab",
    address: "248 Brannan St, San Francisco, CA",
    plan: "Monthly · $129",
    nextBill: "Jul 14, 2026",
    visitsThisMonth: 9,
    streak: 4,
  };
  const perks = [
    { icon: Building2, label: "Open gym access", sub: "5:30 AM – 10 PM daily" },
    { icon: CalendarDays, label: "Unlimited classes", sub: "Book up to 7 days ahead" },
    { icon: Users, label: "Bring a friend", sub: "2 guest passes / month" },
    { icon: Star, label: "Member-only events", sub: "Workshops & socials" },
  ];
  const upcoming = [
    { day: "Tonight", time: "6:30 PM", title: "Strength Foundations", coach: "Devon W." },
    { day: "Thu", time: "7:00 AM", title: "Olympic Lifting", coach: "Devon W." },
  ];
  return (
    <div className="h-full flex flex-col">
      <ScreenHeader title="My gym" onBack={onBack} />
      <ScreenScroll>
        <div className="px-5 pt-3">
          <Card className="overflow-hidden">
            <div
              className="h-24 w-full"
              style={{ background: "linear-gradient(135deg,#5f4bdb,#9d8df1)" }}
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold leading-tight">{gym.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{gym.address}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{gym.plan}</span>
                <span>Renews {gym.nextBill}</span>
              </div>
            </div>
          </Card>

          <Card className="p-3 mt-3 grid grid-cols-3 divide-x">
            <div className="text-center px-2">
              <p className="font-display text-lg font-semibold">{gym.visitsThisMonth}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Visits</p>
            </div>
            <div className="text-center px-2">
              <p className="font-display text-lg font-semibold">{gym.streak}w</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Streak</p>
            </div>
            <div className="text-center px-2">
              <p className="font-display text-lg font-semibold">2</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Guest pass</p>
            </div>
          </Card>

          <h3 className="font-semibold text-sm mt-4 mb-2">Your perks</h3>
          <div className="space-y-2">
            {perks.map((p) => (
              <Card key={p.label} className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                  <p.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground">{p.sub}</p>
                </div>
              </Card>
            ))}
          </div>

          <h3 className="font-semibold text-sm mt-4 mb-2">Upcoming at your gym</h3>
          <div className="space-y-2">
            {upcoming.map((u) => (
              <Card key={u.title + u.day} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {u.day} · {u.time}
                    </p>
                    <p className="font-medium text-sm truncate">{u.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">with {u.coach}</p>
                  </div>
                  <Button size="sm" className="h-8 text-xs">Book</Button>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </ScreenScroll>
    </div>
  );
}
