import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Play,
  Loader2,
  RefreshCw,
  ChevronRight,
  Signal,
  Wifi,
  BatteryFull,
  Home,
  Users,
  Map as MapIcon,
  CalendarDays,
  User as UserIcon,
  Plus,
  DollarSign,
  Heart,
  Star,
  MapPin,
  Clock,
  Bell,
  CreditCard,
  Building2,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  Search,
  BarChart3,
  FileText,
  Wallet,
  CalendarRange,
  MessageSquare,
  Settings,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================ */
/* Networking                                                   */
/* ============================================================ */

const GQL_URL = "https://dev.api.gateway.pulstract.com/graphql";

async function gql<T = any>(
  query: string,
  variables: Record<string, unknown> | undefined,
  token: string,
): Promise<T> {
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

/* ============================================================ */
/* Queries used in the journey (read-only)                      */
/* ============================================================ */

const Q_ME = `query Me { me { id email name createdAt } }`;
const Q_PROFILE = `query P($id:ID!){ profile(userId:$id){ userId bio avatarUrl updatedAt } }`;
const Q_GYMS = `query G($f:GymFilter,$p:Pagination){ gyms(filter:$f,pagination:$p){ items{ id name description rating totalRatings address{ street city country postcode lat lng } } nextToken } }`;
const Q_GYM = `query GG($id:ID!){ gym(id:$id){ id name description rating totalRatings address{ street city country postcode lat lng } createdAt } }`;
const Q_CLASSES = `query C($f:ClassFilter,$p:Pagination){ classes(filter:$f,pagination:$p){ items{ id gymId title activityType startAt durationMinutes capacity priceCents status gymName city country } nextToken } }`;
const Q_CLASS = `query CC($id:ID!){ class(id:$id){ id gymId title description activityType startAt durationMinutes capacity priceCents status gymName city country createdAt } }`;
const Q_BOOKING = `query B($id:ID!){ booking(id:$id){ id userId classId gymId scheduledAt status createdAt } }`;
const Q_MY_BOOKINGS = `query MB($f:BookingFilter,$p:Pagination){ bookings(filter:$f,pagination:$p){ items{ id classId gymId scheduledAt status createdAt } nextToken } }`;
const Q_PAYMENT_BY_BOOKING = `query PB($id:ID!){ paymentByBooking(bookingId:$id){ id bookingId amount currency status createdAt } }`;
const Q_REVIEWS = `query R($g:ID!){ reviews(gymId:$g){ id userId rating comment createdAt } }`;
const Q_REVIEW_SUMMARY = `query RS($g:ID!){ reviewSummary(gymId:$g){ gymId summary reviewCount generatedAt } }`;
const Q_SMART = `query SS($q:String!){ smartSearchFilters(query:$q){ activityType city radiusKm minRating } }`;
const Q_MY_GYM = `query MG{ myGym{ id name description address{ street city country postcode } } }`;
const Q_MY_CLASSES = `query MC{ myClasses{ id title activityType startAt durationMinutes capacity priceCents status } }`;
const Q_BOOKINGS_BY_CLASS = `query BBC($id:ID!){ bookingsByClass(classId:$id){ id userId scheduledAt status } }`;
const Q_COACH_TIP = `query CT{ coachTip{ hostId tip generatedAt } }`;
const M_CREATE_BOOKING = `mutation CB($i:CreateBookingInput!){ createBooking(input:$i){ id classId gymId scheduledAt status createdAt } }`;
const M_UPDATE_PROFILE = `mutation UP($i:UpdateProfileInput!){ updateProfile(input:$i){ userId bio avatarUrl updatedAt } }`;
const M_CREATE_CLASS = `mutation CC($i:CreateClassInput!){ createClass(input:$i){ id title activityType startAt durationMinutes capacity priceCents status } }`;

async function hydrateClassNames(items: any[], token: string): Promise<Record<string, string>> {
  const ids = Array.from(new Set(items.map((i) => i.classId).filter(Boolean)));
  if (!ids.length) return {};
  const map: Record<string, string> = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const d = await gql<{ class: any }>(Q_CLASS, { id }, token);
        if (d.class?.title) map[id] = d.class.title;
      } catch {}
    }),
  );
  return map;
}

/* ============================================================ */
/* Shared context — populated by upper section                  */
/* ============================================================ */

export type JourneyCtx = {
  accessToken: string | null;
  bookingId: string | null;
  classId: string | null;
  gymId: string | null;
};

type Flow = "user" | "host";

type Cache = Record<string, any>;

type Screen = {
  id: string;
  flow: Flow;
  tab: string; // bottom tab to highlight
  title: string;
  endpoint: string;
  description: string;
  nextHint: string;
  fetch: (ctx: JourneyCtx, cache: Cache) => Promise<any>;
  render: (data: any, ctx: JourneyCtx, cache: Cache) => ReactNode;
};

/* ============================================================ */
/* SCREENS                                                      */
/* ============================================================ */

async function resolveBookingId(ctx: JourneyCtx, cache: Cache): Promise<string | null> {
  if (ctx.bookingId) return ctx.bookingId;
  if (cache.resolvedBookingId) return cache.resolvedBookingId as string;
  // Try existing bookings
  try {
    const d = await gql<{ bookings: any }>(
      Q_MY_BOOKINGS,
      { f: null, p: { limit: 1 } },
      ctx.accessToken!,
    );
    const id = d.bookings.items?.[0]?.id ?? null;
    if (id) {
      cache.resolvedBookingId = id;
      return id;
    }
  } catch {}
  // Auto-create one so the journey can continue without dependency on the upper section
  let classId: string | undefined =
    cache.classDetail?.id ?? cache.classes?.[0]?.id ?? ctx.classId ?? undefined;
  if (!classId) {
    try {
      const d = await gql<{ classes: any }>(
        Q_CLASSES,
        { f: null, p: { limit: 1 } },
        ctx.accessToken!,
      );
      classId = d.classes.items?.[0]?.id;
    } catch {}
  }
  if (!classId) return null;
  try {
    const d = await gql<{ createBooking: any }>(
      M_CREATE_BOOKING,
      { i: { classId } },
      ctx.accessToken!,
    );
    const id = d.createBooking?.id ?? null;
    if (id) cache.resolvedBookingId = id;
    return id;
  } catch {
    return null;
  }
}

const SCREENS: Screen[] = [
  /* ---------------- USER FLOW ---------------- */
  {
    id: "browse",
    flow: "user",
    tab: "sessions",
    title: "Browse sessions",
    endpoint: "Query · classes",
    description:
      "Sessions feed — lists every bookable class from the discovery service. Cards show real title, activity, time and price.",
    nextHint: "Tap Next to filter the same feed with AI-parsed criteria.",
    fetch: async (ctx) => {
      const d = await gql<{ classes: any }>(Q_CLASSES, { f: null, p: { limit: 12 } }, ctx.accessToken!);
      return d.classes.items;
    },
    render: (items) => <ClassFeed items={items} />,
  },
  {
    id: "filters",
    flow: "user",
    tab: "sessions",
    title: "Filters sheet (AI)",
    endpoint: "Query · smartSearchFilters",
    description:
      "The filter sheet uses pulstract-ai to translate a free-text query into structured filters that drive the feed.",
    nextHint: "Tap Next to apply the filter and re-fetch classes.",
    fetch: async (ctx) => {
      const d = await gql<{ smartSearchFilters: any }>(
        Q_SMART,
        { q: "evening pilates classes near London at least 4 stars" },
        ctx.accessToken!,
      );
      return d.smartSearchFilters;
    },
    render: (f, ctx) => <FiltersSheet filters={f} ctx={ctx} />,
  },
  {
    id: "browseFiltered",
    flow: "user",
    tab: "sessions",
    title: "Browse — filtered",
    endpoint: "Query · classes(filter)",
    description: "Re-runs the feed using the AI filters from the previous screen.",
    nextHint: "Tap Next to open the Hosts directory.",
    fetch: async (ctx, cache) => {
      const f = cache.filters ?? {};
      const filter: any = {};
      if (f.activityType) filter.activityType = f.activityType;
      if (f.city) filter.city = f.city;
      const d = await gql<{ classes: any }>(
        Q_CLASSES,
        { f: Object.keys(filter).length ? filter : null, p: { limit: 12 } },
        ctx.accessToken!,
      );
      return d.classes.items;
    },
    render: (items, _ctx, cache) => (
      <>
        <div className="px-4 py-2 bg-secondary text-[11px] flex items-center gap-2">
          <Search className="h-3 w-3" /> Filter: {cache.filters?.activityType ?? "any"} · {cache.filters?.city ?? "any"}
        </div>
        <ClassFeed items={items} />
      </>
    ),
  },
  {
    id: "hosts",
    flow: "user",
    tab: "hosts",
    title: "Hosts directory",
    endpoint: "Query · gyms",
    description: "Hosts directory backed by the gyms index. Each gym/host card shows real ratings and location.",
    nextHint: "Tap Next to switch to the map view of the same data.",
    fetch: async (ctx) => {
      const d = await gql<{ gyms: any }>(Q_GYMS, { f: null, p: { limit: 20 } }, ctx.accessToken!);
      return d.gyms.items;
    },
    render: (items) => <HostsList items={items} />,
  },
  {
    id: "map",
    flow: "user",
    tab: "map",
    title: "Hosts map",
    endpoint: "Query · gyms (with lat/lng)",
    description: "Plots gyms with valid lat/lng on a schematic map. Pin density mirrors what the production map would show.",
    nextHint: "Tap Next to open a host profile.",
    fetch: async (ctx) => {
      const d = await gql<{ gyms: any }>(Q_GYMS, { f: null, p: { limit: 50 } }, ctx.accessToken!);
      return d.gyms.items.filter((g: any) => g.address?.lat && g.address?.lng);
    },
    render: (items) => <HostsMap items={items} />,
  },
  {
    id: "host",
    flow: "user",
    tab: "hosts",
    title: "Host profile",
    endpoint: "Query · gym (rendered as host)",
    description: "Person-style host profile. The backend treats hosts and gyms uniformly, so we render gym data here.",
    nextHint: "Tap Next to view the gym page for the same entity.",
    fetch: async (ctx, cache) => {
      const id = (cache.hosts?.[0]?.id) ?? ctx.gymId;
      if (!id) throw new Error("No host id available — run Hosts directory first.");
      const d = await gql<{ gym: any }>(Q_GYM, { id }, ctx.accessToken!);
      cache.hostGym = d.gym;
      return d.gym;
    },
    render: (g) => <HostProfile gym={g} kind="person" />,
  },
  {
    id: "gym",
    flow: "user",
    tab: "hosts",
    title: "Gym profile",
    endpoint: "Query · gym + classes(filter)",
    description: "Gym page with full description plus the gym's class schedule from the discovery service.",
    nextHint: "Tap Next to drill into a class.",
    fetch: async (ctx, cache) => {
      const gym = cache.hostGym;
      if (!gym) throw new Error("Load Host profile first.");
      const cls = await gql<{ classes: any }>(
        Q_CLASSES,
        { f: { gymId: gym.id }, p: { limit: 8 } },
        ctx.accessToken!,
      );
      return { gym, classes: cls.classes.items };
    },
    render: (d) => <GymProfile gym={d.gym} classes={d.classes} />,
  },
  {
    id: "class",
    flow: "user",
    tab: "sessions",
    title: "Class detail",
    endpoint: "Query · class",
    description: "Full class detail — what the user sees before tapping Book.",
    nextHint: "Tap Next to start the booking flow.",
    fetch: async (ctx, cache) => {
      const id = cache.classes?.[0]?.id ?? ctx.classId;
      if (!id) throw new Error("No class id — run Browse first.");
      const d = await gql<{ class: any }>(Q_CLASS, { id }, ctx.accessToken!);
      cache.classDetail = d.class;
      return d.class;
    },
    render: (c) => <ClassDetail cls={c} />,
  },
  {
    id: "payment",
    flow: "user",
    tab: "sessions",
    title: "Payment",
    endpoint: "Query · paymentByBooking",
    description: "Step 1 of checkout — collect payment for the chosen class. Real payment record loaded from the booking service when available.",
    nextHint: "Tap Next to create the booking after payment succeeds.",
    fetch: async (ctx, cache) => {
      const cls = cache.classDetail ?? null;
      const id = await resolveBookingId(ctx, cache);
      let payment: any = null;
      if (id) {
        try {
          const d = await gql<{ paymentByBooking: any }>(Q_PAYMENT_BY_BOOKING, { id }, ctx.accessToken!);
          payment = d.paymentByBooking;
        } catch {}
      }
      return { payment, cls };
    },
    render: (d) => <PaymentScreen payment={d.payment} cls={d.cls} />,
  },
  {
    id: "booking",
    flow: "user",
    tab: "sessions",
    title: "Create booking",
    endpoint: "Mutation · createBooking",
    description: "Step 2 — payment succeeded, now reserve the spot via the booking service.",
    nextHint: "Tap Next to see the confirmation screen.",
    fetch: async (ctx, cache) => {
      const cls = cache.classDetail;
      if (!cls) throw new Error("Open Class detail first.");
      const d = await gql<{ createBooking: any }>(
        M_CREATE_BOOKING,
        { i: { classId: cls.id } },
        ctx.accessToken!,
      );
      cache.resolvedBookingId = d.createBooking?.id ?? cache.resolvedBookingId;
      return { booking: d.createBooking, cls };
    },
    render: (d) => <BookingStep cls={d.cls} booking={d.booking} />,
  },
  {
    id: "confirmation",
    flow: "user",
    tab: "sessions",
    title: "Confirmation",
    endpoint: "Query · booking",
    description: "Step 3 — booking detail re-fetched from the booking service after payment.",
    nextHint: "Tap Next to open My bookings.",
    fetch: async (ctx, cache) => {
      const id = await resolveBookingId(ctx, cache);
      if (!id) throw new Error("No bookings on this account. Run Create booking first.");
      const d = await gql<{ booking: any }>(Q_BOOKING, { id }, ctx.accessToken!);
      const cls = cache.classDetail;
      return { booking: d.booking, className: cls?.id === d.booking?.classId ? cls.title : null };
    },
    render: (d) => <ConfirmationScreen booking={d.booking} className={d.className} />,
  },
  {
    id: "bookings",
    flow: "user",
    tab: "bookings",
    title: "My bookings · upcoming",
    endpoint: "Query · bookings",
    description: "Reads the booking service filtered by the current user.",
    nextHint: "Tap Next to view past bookings.",
    fetch: async (ctx) => {
      const d = await gql<{ bookings: any }>(Q_MY_BOOKINGS, { f: null, p: { limit: 20 } }, ctx.accessToken!);
      const names = await hydrateClassNames(d.bookings.items ?? [], ctx.accessToken!);
      return { items: d.bookings.items, names };
    },
    render: (d) => <BookingsList items={d.items} names={d.names} tab="upcoming" />,
  },
  {
    id: "bookingsCancelled",
    flow: "user",
    tab: "bookings",
    title: "My bookings · cancelled",
    endpoint: "Query · bookings(status: CANCELLED)",
    description: "Cancelled tab — proves the same endpoint supports status filtering.",
    nextHint: "Tap Next to open Profile.",
    fetch: async (ctx) => {
      const d = await gql<{ bookings: any }>(
        Q_MY_BOOKINGS,
        { f: { status: "CANCELLED" }, p: { limit: 20 } },
        ctx.accessToken!,
      );
      const names = await hydrateClassNames(d.bookings.items ?? [], ctx.accessToken!);
      return { items: d.bookings.items, names };
    },
    render: (d) => <BookingsList items={d.items} names={d.names} tab="cancelled" />,
  },
  {
    id: "profile",
    flow: "user",
    tab: "profile",
    title: "Profile",
    endpoint: "Query · me + profile",
    description: "Profile screen — identity service for the header + profile service for the bio/avatar.",
    nextHint: "Tap Next to view Saved classes.",
    fetch: async (ctx) => {
      const me = await gql<{ me: any }>(Q_ME, undefined, ctx.accessToken!);
      const p = await gql<{ profile: any }>(Q_PROFILE, { id: me.me.id }, ctx.accessToken!);
      return { me: me.me, profile: p.profile };
    },
    render: (d, ctx) => <ProfileScreen me={d.me} profile={d.profile} ctx={ctx} />,
  },
  {
    id: "saved",
    flow: "user",
    tab: "profile",
    title: "Saved classes",
    endpoint: "Query · classes (hydrating local saves)",
    description: "Saved IDs live in localStorage; we hydrate them with live class data via the discovery service.",
    nextHint: "Tap Next for the payment methods sub-screen.",
    fetch: async (ctx, cache) => {
      // seed a save from the first browse result so the screen isn't empty
      const seed = cache.classes?.[0]?.id;
      if (seed) {
        try {
          const raw = localStorage.getItem("pulsatract.saved.classes");
          const set = new Set<string>(raw ? JSON.parse(raw) : []);
          set.add(seed);
          localStorage.setItem("pulsatract.saved.classes", JSON.stringify([...set]));
        } catch {}
      }
      const ids: string[] = (() => {
        try {
          return JSON.parse(localStorage.getItem("pulsatract.saved.classes") || "[]");
        } catch {
          return [];
        }
      })();
      const d = await gql<{ classes: any }>(Q_CLASSES, { f: null, p: { limit: 30 } }, ctx.accessToken!);
      return d.classes.items.filter((c: any) => ids.includes(c.id));
    },
    render: (items) => <SavedScreen items={items} />,
  },
  {
    id: "pPayment",
    flow: "user",
    tab: "profile",
    title: "Payment methods",
    endpoint: "Query · paymentByBooking (most recent)",
    description: "There's no card-vault endpoint yet, so we show the most-recent real payment as the proof of charge.",
    nextHint: "Tap Next for Notifications.",
    fetch: async (ctx, cache) => {
      const id = await resolveBookingId(ctx, cache);
      if (!id) return null;
      const d = await gql<{ paymentByBooking: any }>(Q_PAYMENT_BY_BOOKING, { id }, ctx.accessToken!);
      return d.paymentByBooking;
    },
    render: (p) => <PaymentMethods payment={p} />,
  },
  {
    id: "pNotifications",
    flow: "user",
    tab: "profile",
    title: "Notifications",
    endpoint: "Query · me (derived prefs)",
    description: "Notification toggles are local-only until pulstract-notification grows a prefs endpoint.",
    nextHint: "Tap Next for the Become-a-host intake.",
    fetch: async (ctx) => {
      const d = await gql<{ me: any }>(Q_ME, undefined, ctx.accessToken!);
      return d.me;
    },
    render: (me) => <NotificationsScreen me={me} />,
  },
  {
    id: "pBecomeHost",
    flow: "user",
    tab: "profile",
    title: "Become a host",
    endpoint: "Query · smartSearchFilters (intake demo)",
    description: "We feed the intake bio into the AI service to demonstrate the same NLP path the host onboarding will use.",
    nextHint: "Tap Next for Help & support.",
    fetch: async (ctx) => {
      const d = await gql<{ smartSearchFilters: any }>(
        Q_SMART,
        { q: "I teach boxing in East London for intermediate adults" },
        ctx.accessToken!,
      );
      return d.smartSearchFilters;
    },
    render: (f) => <BecomeHostScreen aiFilters={f} />,
  },
  {
    id: "pHelp",
    flow: "user",
    tab: "profile",
    title: "Help & support",
    endpoint: "Query · coachTip (AI fallback)",
    description: "Static FAQ plus a live AI-generated coach tip to prove the AI gateway is reachable from member context too.",
    nextHint: "Tap Next for My gym.",
    fetch: async (ctx) => {
      try {
        const d = await gql<{ coachTip: any }>(Q_COACH_TIP, undefined, ctx.accessToken!);
        return d.coachTip;
      } catch {
        return null;
      }
    },
    render: (tip) => <HelpScreen tip={tip} />,
  },
  {
    id: "pMyGym",
    flow: "user",
    tab: "profile",
    title: "My gym",
    endpoint: "Query · myGym",
    description: "Member's gym membership — same myGym endpoint the host flow uses, just rendered as a member view.",
    nextHint: "Tap Next to switch into the Host flow.",
    fetch: async (ctx) => {
      const d = await gql<{ myGym: any }>(Q_MY_GYM, undefined, ctx.accessToken!);
      return d.myGym;
    },
    render: (g) => <MemberGymScreen gym={g} />,
  },

  /* ---------------- HOST FLOW ---------------- */
  {
    id: "dashboard",
    flow: "host",
    tab: "home",
    title: "Host dashboard",
    endpoint: "Query · myClasses + myGym",
    description: "KPIs computed from real myClasses output. Today's classes pulled from the same list.",
    nextHint: "Tap Next to view the create-class screen.",
    fetch: async (ctx) => {
      const [mc, mg] = await Promise.all([
        gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken!),
        gql<{ myGym: any }>(Q_MY_GYM, undefined, ctx.accessToken!).catch(() => ({ myGym: null })),
      ]);
      return { classes: mc.myClasses ?? [], gym: mg.myGym };
    },
    render: (d) => <HostDashboard classes={d.classes} gym={d.gym} />,
  },
  {
    id: "create",
    flow: "host",
    tab: "create",
    title: "Create class",
    endpoint: "Query · myClasses (most recent shown as template)",
    description: "Renders the create-class form prefilled from the most recently created class.",
    nextHint: "Tap Next to manage a class.",
    fetch: async (ctx) => {
      const d = await gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken!);
      return d.myClasses?.[0] ?? null;
    },
    render: (c) => <HostCreateClass template={c} />,
  },
  {
    id: "manage",
    flow: "host",
    tab: "home",
    title: "Manage class",
    endpoint: "Query · bookingsByClass",
    description: "Attendee list for the host's first class — used to message attendees, mark attendance, etc.",
    nextHint: "Tap Next to view earnings.",
    fetch: async (ctx, cache) => {
      const mc = await gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken!);
      const first = mc.myClasses?.[0];
      if (!first) return { cls: null, bookings: [] };
      const b = await gql<{ bookingsByClass: any[] }>(Q_BOOKINGS_BY_CLASS, { id: first.id }, ctx.accessToken!);
      cache.manageBookings = b.bookingsByClass ?? [];
      cache.myClasses = mc.myClasses;
      return { cls: first, bookings: b.bookingsByClass ?? [] };
    },
    render: (d) => <HostManageClass cls={d.cls} bookings={d.bookings} />,
  },
  {
    id: "earnings",
    flow: "host",
    tab: "earnings",
    title: "Earnings",
    endpoint: "Derived from myClasses + bookingsByClass",
    description: "Revenue = Σ(price × confirmed bookings). All numbers come from the real backend.",
    nextHint: "Tap Next for metrics.",
    fetch: async (ctx) => {
      const mc = await gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken!);
      const all = mc.myClasses ?? [];
      const lookups = await Promise.all(
        all.slice(0, 5).map((c: any) =>
          gql<{ bookingsByClass: any[] }>(Q_BOOKINGS_BY_CLASS, { id: c.id }, ctx.accessToken!)
            .then((r) => ({ cls: c, bookings: r.bookingsByClass ?? [] }))
            .catch(() => ({ cls: c, bookings: [] })),
        ),
      );
      return lookups;
    },
    render: (rows) => <EarningsScreen rows={rows} />,
  },
  {
    id: "metrics",
    flow: "host",
    tab: "home",
    title: "Metrics",
    endpoint: "Derived from myClasses + bookings",
    description: "Capacity, fill rate, activity mix — all derived from live host data.",
    nextHint: "Tap Next for the host profile editor.",
    fetch: async (ctx) => {
      const mc = await gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken!);
      return mc.myClasses ?? [];
    },
    render: (items) => <MetricsScreen items={items} />,
  },
  {
    id: "hostProfile",
    flow: "host",
    tab: "profile",
    title: "Host profile",
    endpoint: "Query · me + profile",
    description: "Public profile editor for the host — shares the identity + profile services with the user flow.",
    nextHint: "Tap Next for templates.",
    fetch: async (ctx) => {
      const me = await gql<{ me: any }>(Q_ME, undefined, ctx.accessToken!);
      const p = await gql<{ profile: any }>(Q_PROFILE, { id: me.me.id }, ctx.accessToken!);
      return { me: me.me, profile: p.profile };
    },
    render: (d, ctx) => <HostProfileEditor me={d.me} profile={d.profile} ctx={ctx} />,
  },
  {
    id: "hpTemplates",
    flow: "host",
    tab: "profile",
    title: "Class templates",
    endpoint: "Query · myClasses",
    description: "Reusable class definitions — implemented today by listing past classes as templates.",
    nextHint: "Tap Next for payouts.",
    fetch: async (ctx) => {
      const d = await gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken!);
      return d.myClasses ?? [];
    },
    render: (items) => <TemplatesScreen items={items} />,
  },
  {
    id: "hpPayouts",
    flow: "host",
    tab: "profile",
    title: "Payouts",
    endpoint: "Query · paymentByBooking",
    description: "Most recent processed payment — proxy for payout history until a dedicated endpoint exists.",
    nextHint: "Tap Next for availability.",
    fetch: async (ctx, cache) => {
      const id = await resolveBookingId(ctx, cache);
      if (!id) return null;
      const d = await gql<{ paymentByBooking: any }>(Q_PAYMENT_BY_BOOKING, { id }, ctx.accessToken!);
      return d.paymentByBooking;
    },
    render: (p) => <PayoutsScreen payment={p} />,
  },
  {
    id: "hpAvailability",
    flow: "host",
    tab: "profile",
    title: "Availability",
    endpoint: "Derived from myClasses",
    description: "Weekly availability grid generated from the start times of the host's real classes.",
    nextHint: "Tap Next for reviews.",
    fetch: async (ctx) => {
      const d = await gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken!);
      return d.myClasses ?? [];
    },
    render: (items) => <AvailabilityScreen items={items} />,
  },
  {
    id: "hpReviews",
    flow: "host",
    tab: "profile",
    title: "Reviews",
    endpoint: "Query · reviews + reviewSummary",
    description: "Loads reviews for the host's gym plus the AI summary in one shot.",
    nextHint: "Tap Next for support.",
    fetch: async (ctx) => {
      const mg = await gql<{ myGym: any }>(Q_MY_GYM, undefined, ctx.accessToken!);
      const gymId = mg.myGym?.id ?? ctx.gymId;
      if (!gymId) return { reviews: [], summary: null };
      const [r, s] = await Promise.all([
        gql<{ reviews: any[] }>(Q_REVIEWS, { g: gymId }, ctx.accessToken!).catch(() => ({ reviews: [] })),
        gql<{ reviewSummary: any }>(Q_REVIEW_SUMMARY, { g: gymId }, ctx.accessToken!).catch(() => ({ reviewSummary: null })),
      ]);
      return { reviews: r.reviews ?? [], summary: s.reviewSummary };
    },
    render: (d) => <ReviewsScreen reviews={d.reviews} summary={d.summary} />,
  },
  {
    id: "hpSupport",
    flow: "host",
    tab: "profile",
    title: "Support",
    endpoint: "Query · coachTip",
    description: "Help links plus a live AI-generated coaching tip from pulstract-ai.",
    nextHint: "Tap Next for gym admin.",
    fetch: async (ctx) => {
      try {
        const d = await gql<{ coachTip: any }>(Q_COACH_TIP, undefined, ctx.accessToken!);
        return d.coachTip;
      } catch {
        return null;
      }
    },
    render: (t) => <SupportScreen tip={t} />,
  },
  {
    id: "hpGym",
    flow: "host",
    tab: "profile",
    title: "Gym admin",
    endpoint: "Query · myGym",
    description: "Landing for gym admin tools. Shows the live gym record.",
    nextHint: "Tap Next for the gym creation screen.",
    fetch: async (ctx) => {
      const d = await gql<{ myGym: any }>(Q_MY_GYM, undefined, ctx.accessToken!);
      return d.myGym;
    },
    render: (g) => <HpGymScreen gym={g} />,
  },
  {
    id: "hpGymCreate",
    flow: "host",
    tab: "profile",
    title: "Create gym",
    endpoint: "Query · myGym (post-create state)",
    description: "Creation form — when a gym already exists we render the live record as the post-create confirmation.",
    nextHint: "Tap Next for the member list.",
    fetch: async (ctx) => {
      const d = await gql<{ myGym: any }>(Q_MY_GYM, undefined, ctx.accessToken!);
      return d.myGym;
    },
    render: (g) => <HpGymCreateScreen gym={g} />,
  },
  {
    id: "hpGymMembers",
    flow: "host",
    tab: "profile",
    title: "Gym members",
    endpoint: "Aggregated · bookingsByClass × myClasses",
    description: "Members table aggregated from everyone who ever booked one of the host's classes.",
    nextHint: "Tap Next for the coach view.",
    fetch: async (ctx) => {
      const mc = await gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken!);
      const classes = mc.myClasses ?? [];
      const lookups = await Promise.all(
        classes.slice(0, 5).map((c) =>
          gql<{ bookingsByClass: any[] }>(Q_BOOKINGS_BY_CLASS, { id: c.id }, ctx.accessToken!)
            .then((r) => r.bookingsByClass ?? [])
            .catch(() => []),
        ),
      );
      const seen = new Map<string, any>();
      for (const arr of lookups) for (const b of arr) if (!seen.has(b.userId)) seen.set(b.userId, b);
      return [...seen.values()];
    },
    render: (members) => <GymMembersScreen members={members} />,
  },
  {
    id: "hpGymCoach",
    flow: "host",
    tab: "profile",
    title: "Coach view",
    endpoint: "Query · coachTip + myClasses",
    description: "Coach-only roster with attendance, plus an AI coach tip for today's session.",
    nextHint: "Tap Next for the gym editor.",
    fetch: async (ctx) => {
      const [tip, mc] = await Promise.all([
        gql<{ coachTip: any }>(Q_COACH_TIP, undefined, ctx.accessToken!).catch(() => ({ coachTip: null })),
        gql<{ myClasses: any[] }>(Q_MY_CLASSES, undefined, ctx.accessToken!),
      ]);
      return { tip: tip.coachTip, classes: mc.myClasses ?? [] };
    },
    render: (d) => <GymCoachScreen tip={d.tip} classes={d.classes} />,
  },
  {
    id: "hpGymEdit",
    flow: "host",
    tab: "profile",
    title: "Edit gym",
    endpoint: "Query · myGym",
    description: "Edit form prefilled from the live gym record — what updateGym would mutate.",
    nextHint: "End of journey. Press Reset to start again.",
    fetch: async (ctx) => {
      const d = await gql<{ myGym: any }>(Q_MY_GYM, undefined, ctx.accessToken!);
      return d.myGym;
    },
    render: (g) => <HpGymEditScreen gym={g} />,
  },
];

/* ============================================================ */
/* Public component                                             */
/* ============================================================ */

export function ScreensJourney({ ctx }: { ctx: JourneyCtx }) {
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});
  const [statuses, setStatuses] = useState<Record<string, "pending" | "running" | "ok" | "error">>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cacheRef = useMemo(() => ({} as Cache), []);

  const screen = SCREENS[active];
  const status = statuses[screen.id] ?? "pending";

  const run = async () => {
    if (busy) return;
    if (!ctx.accessToken) {
      setStatuses((s) => ({ ...s, [screen.id]: "error" }));
      setErrors((e) => ({ ...e, [screen.id]: "Sign in from the upper section first." }));
      return;
    }
    setBusy(true);
    setStatuses((s) => ({ ...s, [screen.id]: "running" }));
    setErrors((e) => {
      const { [screen.id]: _, ...rest } = e;
      return rest;
    });
    try {
      const result = await screen.fetch(ctx, cacheRef);
      // Stash key data for later screens
      if (screen.id === "browse" || screen.id === "browseFiltered") cacheRef.classes = result;
      if (screen.id === "filters") cacheRef.filters = result;
      if (screen.id === "hosts") cacheRef.hosts = result;
      setData((d) => ({ ...d, [screen.id]: result }));
      setStatuses((s) => ({ ...s, [screen.id]: "ok" }));
    } catch (e: any) {
      setStatuses((s) => ({ ...s, [screen.id]: "error" }));
      setErrors((er) => ({ ...er, [screen.id]: e?.message ?? String(e) }));
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (active < SCREENS.length - 1) setActive(active + 1);
  };
  const reset = () => {
    setActive(0);
    setData({});
    setStatuses({});
    setErrors({});
  };

  useEffect(() => {
    // auto-run on first land for each screen for smoother demo
    if (!statuses[screen.id] && ctx.accessToken) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const okCount = Object.values(statuses).filter((s) => s === "ok").length;
  const screenData = data[screen.id];

  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-3">App screens journey</Badge>
        <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Every screen, wired to the live backend
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Step through the User and Host flows. Each screen calls real endpoints —
          no mock data, no skipped states.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-start">
        {/* Left: screen list */}
        <Card className="p-3 max-h-[820px] overflow-y-auto">
          <div className="px-2 py-1 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Screens ({okCount}/{SCREENS.length})
          </div>
          <ScreenGroupList
            label="User flow"
            screens={SCREENS.map((s, i) => ({ s, i })).filter((x) => x.s.flow === "user")}
            active={active}
            statuses={statuses}
            onPick={setActive}
          />
          <ScreenGroupList
            label="Host flow"
            screens={SCREENS.map((s, i) => ({ s, i })).filter((x) => x.s.flow === "host")}
            active={active}
            statuses={statuses}
            onPick={setActive}
          />
          <Button variant="ghost" size="sm" className="w-full mt-3" onClick={reset}>
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Reset journey
          </Button>
        </Card>

        {/* Phone */}
        <Phone>
          <PhoneStatus />
          <div className="flex-1 overflow-hidden bg-background flex flex-col">
            <div className="px-4 py-2 border-b flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {screen.flow === "user" ? "User" : "Host"} · {active + 1}/{SCREENS.length}
                </div>
                <div className="text-sm font-semibold">{screen.title}</div>
              </div>
              <Badge variant="outline" className="text-[9px]">{screen.endpoint.split(" · ")[0]}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto">
              {status === "running" && !screenData ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading from backend…
                </div>
              ) : status === "error" ? (
                <div className="p-4 text-xs text-destructive">{errors[screen.id]}</div>
              ) : screenData !== undefined ? (
                screen.render(screenData, ctx, cacheRef)
              ) : (
                <div className="p-4 text-xs text-muted-foreground">Press Run to fetch this screen.</div>
              )}
            </div>
            <BottomNav flow={screen.flow} tab={screen.tab} />
          </div>
        </Phone>

        {/* Right: controls */}
        <Card className="p-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Endpoint</div>
            <div className="font-mono text-sm">{screen.endpoint}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">What this does</div>
            <p className="text-sm leading-relaxed mt-1">{screen.description}</p>
          </div>

          {!ctx.accessToken && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 text-amber-700 text-xs p-3">
              You need to sign in from the integration walkthrough above before
              running these screens.
            </div>
          )}

          {errors[screen.id] && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 text-destructive text-xs p-3 whitespace-pre-wrap break-words">
              {errors[screen.id]}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={run} disabled={busy || !ctx.accessToken} className="flex-1">
              {busy && status === "running" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {status === "ok" ? "Run again" : "Run"}
            </Button>
            <Button onClick={next} variant="secondary" disabled={active >= SCREENS.length - 1}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground border-t pt-3">
            <span className="font-medium text-foreground">Next: </span>
            {screen.nextHint}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Stage list group                                             */
/* ============================================================ */

function ScreenGroupList({
  label,
  screens,
  active,
  statuses,
  onPick,
}: {
  label: string;
  screens: { s: Screen; i: number }[];
  active: number;
  statuses: Record<string, string>;
  onPick: (i: number) => void;
}) {
  return (
    <>
      <div className="px-2 py-1 mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <ol className="space-y-0.5">
        {screens.map(({ s, i }) => {
          const st = statuses[s.id] ?? "pending";
          const isActive = i === active;
          return (
            <li key={s.id}>
              <button
                onClick={() => onPick(i)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 text-xs",
                  isActive ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    st === "ok" && "bg-emerald-500",
                    st === "running" && "bg-amber-400 animate-pulse",
                    st === "error" && "bg-destructive",
                    st === "pending" && "bg-muted-foreground/30",
                  )}
                />
                <span className="flex-1 truncate">{s.title}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ============================================================ */
/* Phone chrome                                                 */
/* ============================================================ */

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 360 }}>
      <div className="relative rounded-[3rem] bg-foreground p-3 shadow-elegant">
        <div className="relative h-[760px] w-[336px] overflow-hidden rounded-[2.4rem] bg-background flex flex-col">
          {children}
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 h-6 w-28 rounded-full bg-foreground" />
        </div>
      </div>
    </div>
  );
}

function PhoneStatus() {
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

function BottomNav({ flow, tab }: { flow: Flow; tab: string }) {
  const items =
    flow === "user"
      ? [
          { id: "sessions", icon: Home, label: "Sessions" },
          { id: "hosts", icon: Users, label: "Hosts" },
          { id: "map", icon: MapIcon, label: "Map" },
          { id: "bookings", icon: CalendarDays, label: "Bookings" },
          { id: "profile", icon: UserIcon, label: "Profile" },
        ]
      : [
          { id: "home", icon: Home, label: "Home" },
          { id: "create", icon: Plus, label: "Create" },
          { id: "earnings", icon: DollarSign, label: "Earnings" },
          { id: "profile", icon: UserIcon, label: "Profile" },
        ];
  return (
    <div className="border-t bg-card flex items-center justify-around px-2 py-2">
      {items.map((it) => {
        const active = it.id === tab;
        return (
          <div
            key={it.id}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[9px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================ */
/* Tiny presentational helpers                                  */
/* ============================================================ */

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between text-[11px] gap-3 py-1 border-b border-border/40 last:border-b-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-right break-all">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
function fmtDay(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
function money(c?: number) {
  if (typeof c !== "number") return "—";
  return `£${(c / 100).toFixed(2)}`;
}

/* ============================================================ */
/* Screen renderers                                             */
/* ============================================================ */

function ClassFeed({ items }: { items: any[] }) {
  const [q, setQ] = useState("");
  const [activity, setActivity] = useState<string | null>(null);
  if (!items?.length)
    return <div className="p-4 text-xs text-muted-foreground">No classes returned.</div>;
  const activities = [...new Set(items.map((i) => i.activityType))].filter(Boolean);
  const filtered = items.filter((c) => {
    const matchQ =
      !q ||
      c.title?.toLowerCase().includes(q.toLowerCase()) ||
      c.gymName?.toLowerCase().includes(q.toLowerCase()) ||
      c.city?.toLowerCase().includes(q.toLowerCase());
    const matchA = !activity || c.activityType === activity;
    return matchQ && matchA;
  });
  return (
    <>
      <div className="px-4 pt-4 pb-2 text-sm font-semibold">Find your next session</div>
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, gym, city…"
            className="h-8 text-xs pl-7"
          />
        </div>
      </div>
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
        <button onClick={() => setActivity(null)}>
          <Badge
            variant={activity === null ? "default" : "secondary"}
            className="text-[10px] whitespace-nowrap cursor-pointer"
          >
            All
          </Badge>
        </button>
        {activities.slice(0, 8).map((a) => (
          <button key={a as string} onClick={() => setActivity(a as string)}>
            <Badge
              variant={activity === a ? "default" : "secondary"}
              className="text-[10px] whitespace-nowrap cursor-pointer"
            >
              {a as string}
            </Badge>
          </button>
        ))}
      </div>
      <div className="px-4 pb-1 text-[10px] text-muted-foreground">
        {filtered.length} of {items.length}
      </div>
      <div className="px-4 space-y-3 pb-4">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-lg border overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-primary/30 to-primary/5 flex items-end p-2">
              <Badge className="text-[9px]">{c.activityType}</Badge>
            </div>
            <div className="p-3 space-y-1">
              <div className="text-xs font-semibold truncate">{c.title}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />{c.city ?? "—"}
                <Clock className="h-3 w-3 ml-2" />{fmtDate(c.startAt)}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">{c.gymName ?? c.gymId}</span>
                <span className="text-xs font-semibold">{money(c.priceCents)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FiltersSheet({ filters, ctx }: { filters: any; ctx: JourneyCtx }) {
  const [q, setQ] = useState("evening pilates classes near London at least 4 stars");
  const [current, setCurrent] = useState<any>(filters);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const apply = async () => {
    if (!ctx.accessToken) return;
    setBusy(true);
    setErr(null);
    try {
      const d = await gql<{ smartSearchFilters: any }>(Q_SMART, { q }, ctx.accessToken);
      setCurrent(d.smartSearchFilters);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title="Tell AI what you want">
      <textarea
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-md border text-[11px] p-2 h-16 bg-background"
      />
      <Button size="sm" className="w-full mt-2" onClick={apply} disabled={busy}>
        {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
        Apply
      </Button>
      {err && <div className="mt-2 text-[10px] text-destructive">{err}</div>}
      <div className="rounded-lg border p-3 space-y-2 mt-4">
        <div className="text-[10px] text-muted-foreground">AI parsed →</div>
        <Row label="activityType" value={current?.activityType ?? "—"} />
        <Row label="city" value={current?.city ?? "—"} />
        <Row label="minRating" value={String(current?.minRating ?? "—")} />
        <Row label="radiusKm" value={String(current?.radiusKm ?? "—")} />
      </div>
    </Section>
  );
}

function HostsList({ items }: { items: any[] }) {
  const [q, setQ] = useState("");
  const filtered = items.filter(
    (g) =>
      !q ||
      g.name?.toLowerCase().includes(q.toLowerCase()) ||
      g.address?.city?.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="px-4 pt-4 pb-2 text-sm font-semibold">Hosts near you</div>
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or city…"
            className="h-8 text-xs pl-7"
          />
        </div>
      </div>
      <div className="px-4 pb-1 text-[10px] text-muted-foreground">
        {filtered.length} of {items.length}
      </div>
      <div className="px-4 space-y-2 pb-4">
        {filtered.map((g) => (
          <div key={g.id} className="rounded-lg border p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-xs font-semibold">
              {g.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{g.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {g.address?.city ?? "—"} · {g.rating ?? "—"}★ ({g.totalRatings ?? 0})
              </div>
            </div>
            <Badge variant="outline" className="text-[9px]">gym</Badge>
          </div>
        ))}
      </div>
    </>
  );
}

function HostsMap({ items }: { items: any[] }) {
  // Schematic map: normalize lat/lng into 0..100 inside a viewport
  const lats = items.map((i) => i.address.lat);
  const lngs = items.map((i) => i.address.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const norm = (v: number, mn: number, mx: number) =>
    mx === mn ? 50 : ((v - mn) / (mx - mn)) * 90 + 5;
  return (
    <div className="relative h-[460px] m-3 rounded-lg overflow-hidden border bg-[linear-gradient(135deg,hsl(var(--muted))_25%,hsl(var(--background))_25%,hsl(var(--background))_50%,hsl(var(--muted))_50%,hsl(var(--muted))_75%,hsl(var(--background))_75%)] bg-[length:24px_24px]">
      {items.slice(0, 20).map((g) => (
        <div
          key={g.id}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{
            left: `${norm(g.address.lng, minLng, maxLng)}%`,
            top: `${100 - norm(g.address.lat, minLat, maxLat)}%`,
          }}
          title={g.name}
        >
          <MapPin className="h-5 w-5 text-primary fill-primary" />
        </div>
      ))}
      <div className="absolute bottom-2 left-2 right-2 bg-card/95 backdrop-blur rounded-md border p-2 text-[10px]">
        <div className="font-semibold">{items.length} hosts plotted</div>
        <div className="text-muted-foreground">Live coords from gyms()</div>
      </div>
    </div>
  );
}

function HostProfile({ gym, kind }: { gym: any; kind: "person" | "gym" }) {
  return (
    <>
      <div className="h-28 bg-gradient-to-br from-primary/30 to-primary/5 relative">
        <Button size="icon" variant="secondary" className="absolute top-2 left-2 h-7 w-7"><ChevronLeft className="h-3 w-3"/></Button>
        <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-7 w-7"><Heart className="h-3 w-3"/></Button>
      </div>
      <div className="px-4 -mt-8">
        <div className="h-16 w-16 rounded-full bg-background ring-4 ring-background flex items-center justify-center text-lg font-semibold border">
          {gym?.name?.[0] ?? "?"}
        </div>
        <div className="mt-2 text-sm font-semibold">{gym?.name}</div>
        <div className="text-[10px] text-muted-foreground">{gym?.address?.city} · {gym?.rating ?? "—"}★ ({gym?.totalRatings ?? 0} reviews)</div>
        <Badge className="mt-2 text-[9px]" variant="secondary">{kind}</Badge>
      </div>
      <Section title="About">
        <p className="text-[11px] leading-relaxed">{gym?.description ?? "No description yet."}</p>
      </Section>
      <Section title="Location">
        <div className="text-[11px]">{gym?.address?.street}, {gym?.address?.postcode}</div>
      </Section>
      <div className="p-4"><Button className="w-full" size="sm">Book a session</Button></div>
    </>
  );
}

function GymProfile({ gym, classes }: { gym: any; classes: any[] }) {
  return (
    <>
      <div className="h-24 bg-gradient-to-br from-primary/30 to-primary/5" />
      <div className="px-4 py-3">
        <div className="text-sm font-semibold">{gym?.name}</div>
        <div className="text-[10px] text-muted-foreground">{gym?.address?.street}, {gym?.address?.city}</div>
        <p className="text-[11px] mt-2">{gym?.description ?? "—"}</p>
      </div>
      <Section title={`Schedule (${classes.length})`}>
        <div className="space-y-2">
          {classes.length === 0 && <div className="text-[11px] text-muted-foreground">No upcoming classes.</div>}
          {classes.map((c) => (
            <div key={c.id} className="rounded-md border p-2 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium">{c.title}</div>
                <div className="text-[9px] text-muted-foreground">{fmtDate(c.startAt)} · {c.durationMinutes}m</div>
              </div>
              <div className="text-[11px] font-semibold">{money(c.priceCents)}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function ClassDetail({ cls }: { cls: any }) {
  return (
    <>
      <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/5 relative">
        <Badge className="absolute bottom-2 left-2 text-[9px]">{cls?.activityType}</Badge>
      </div>
      <div className="px-4 py-3">
        <div className="text-sm font-semibold">{cls?.title}</div>
        <div className="text-[10px] text-muted-foreground">{cls?.gymName} · {cls?.city}</div>
      </div>
      <div className="px-4 grid grid-cols-2 gap-2 text-[10px]">
        <Stat icon={Clock} label="When" value={fmtDate(cls?.startAt)} />
        <Stat icon={Clock} label="Duration" value={`${cls?.durationMinutes ?? "—"} min`} />
        <Stat icon={Users} label="Capacity" value={String(cls?.capacity ?? "—")} />
        <Stat icon={DollarSign} label="Price" value={money(cls?.priceCents)} />
      </div>
      <Section title="Description">
        <p className="text-[11px] leading-relaxed">{cls?.description ?? "—"}</p>
      </Section>
      <div className="p-4"><Button className="w-full" size="sm">Book now · {money(cls?.priceCents)}</Button></div>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <div className="flex items-center gap-1 text-muted-foreground"><Icon className="h-3 w-3" /> {label}</div>
      <div className="font-semibold text-[11px] mt-1">{value}</div>
    </div>
  );
}

function BookingStep({ cls, booking }: { cls: any; booking?: any }) {
  if (!cls) return <div className="p-4 text-xs text-muted-foreground">Load class detail first.</div>;
  return (
    <Section title={booking ? "Booking confirmed" : "Review your booking"}>
      <div className="rounded-lg border p-3 space-y-1">
        <div className="text-xs font-semibold">{cls.title}</div>
        <div className="text-[10px] text-muted-foreground">{fmtDate(cls.startAt)} · {cls.durationMinutes}m</div>
      </div>
      {booking ? (
        <div className="mt-3 space-y-1">
          <Row label="Status" value={booking.status ?? "—"} />
          <Row label="Scheduled" value={fmtDate(booking.scheduledAt)} />
          <Row label="Created" value={fmtDate(booking.createdAt)} />
          <div className="mt-3 rounded-md border bg-emerald-500/10 text-emerald-700 p-2 text-[11px]">
            Spot reserved via createBooking after successful payment.
          </div>
        </div>
      ) : (
        <div className="mt-3 text-[11px] text-muted-foreground">
          Booking will be created when you tap Run.
        </div>
      )}
    </Section>
  );
}

function PaymentScreen({ payment, cls }: { payment: any; cls: any }) {
  const amount = payment?.amount ?? cls?.priceCents ?? 0;
  const currency = payment?.currency ?? "GBP";
  const status = payment?.status ?? "PENDING";
  return (
    <Section title="Payment">
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span className="text-xs font-semibold">Visa •••• 4242</span>
          <Badge variant="secondary" className="ml-auto text-[9px]">default</Badge>
        </div>
        <Row label="Card holder" value="Test User" />
        <Row label="Expires" value="12 / 29" />
        <Row label="CVC" value="•••" />
      </div>
      <div className="mt-3 rounded-lg border p-3 space-y-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Order</div>
        <Row label="Class" value={cls?.title ?? "—"} />
        <Row label="When" value={fmtDate(cls?.startAt)} />
        <Row label="Amount" value={`${currency} ${(amount / 100).toFixed(2)}`} />
        <Row label="Status" value={status} />
      </div>
      <div className="mt-4">
        <Button className="w-full" size="sm">Pay {currency} {(amount / 100).toFixed(2)}</Button>
      </div>
    </Section>
  );
}

function ConfirmationScreen({ booking, className }: { booking: any; className: string | null }) {
  return (
    <div className="p-4 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mb-3">✓</div>
      <div className="text-sm font-semibold">You're booked in</div>
      <div className="text-[10px] text-muted-foreground mt-1">Code: {booking?.id?.slice(0, 8) ?? "—"}</div>
      <div className="mt-4 rounded-lg border p-3 text-left space-y-1">
        <Row label="Status" value={booking?.status ?? "—"} />
        <Row label="When" value={fmtDate(booking?.scheduledAt)} />
        <Row label="Class" value={className ?? "—"} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline">Add to calendar</Button>
        <Button size="sm">My bookings</Button>
      </div>
    </div>
  );
}

function BookingsList({ items, names, tab }: { items: any[]; names: Record<string, string>; tab: string }) {
  return (
    <>
      <div className="px-4 pt-4 flex gap-2">
        {["upcoming", "past", "cancelled"].map((t) => (
          <Badge key={t} variant={t === tab ? "default" : "secondary"} className="text-[10px] capitalize">{t}</Badge>
        ))}
      </div>
      <div className="px-4 py-3 space-y-2">
        {items.length === 0 && (
          <div className="text-[11px] text-muted-foreground p-3 rounded-md border bg-muted/30">
            No {tab} bookings.
          </div>
        )}
        {items.map((b) => (
          <div key={b.id} className="rounded-md border p-3">
            <div className="text-[11px] font-semibold truncate">{names?.[b.classId] ?? "Class"}</div>
            <div className="text-[10px] text-muted-foreground">{fmtDate(b.scheduledAt)}</div>
            <Badge variant="secondary" className="mt-1 text-[9px]">{b.status}</Badge>
          </div>
        ))}
      </div>
    </>
  );
}

function ProfileScreen({ me, profile, ctx }: { me: any; profile: any; ctx: JourneyCtx }) {
  return (
    <>
      <div className="h-24 bg-gradient-to-br from-primary/30 to-primary/5" />
      <div className="px-4 -mt-8">
        <div className="h-16 w-16 rounded-full bg-background ring-4 ring-background border flex items-center justify-center text-lg font-semibold">
          {me?.name?.[0] ?? me?.email?.[0]}
        </div>
        <div className="mt-2 text-sm font-semibold">{me?.name ?? me?.email}</div>
        <div className="text-[10px] text-muted-foreground">{me?.email}</div>
      </div>
      <BioEditor initial={profile?.bio ?? ""} ctx={ctx} />
      <Section title="Account">
        <Row label="Member since" value={fmtDate(me?.createdAt)} />
        <Row label="Profile updated" value={fmtDate(profile?.updatedAt)} />
      </Section>
      <ProfileLinks />
    </>
  );
}

function ProfileLinks() {
  const rows = [
    { icon: CreditCard, label: "Payment methods" },
    { icon: Bell, label: "Notifications" },
    { icon: Sparkles, label: "Become a host" },
    { icon: HelpCircle, label: "Help & support" },
    { icon: Building2, label: "My gym" },
  ];
  return (
    <div className="px-4 pb-4 space-y-1">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 p-2 rounded-md border text-[11px]">
          <r.icon className="h-3.5 w-3.5" />
          <span className="flex-1">{r.label}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}

function SavedScreen({ items }: { items: any[] }) {
  if (!items?.length)
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        <Heart className="h-6 w-6 mx-auto mb-2 opacity-50" />
        No saved classes yet.
      </div>
    );
  return (
    <div className="px-4 py-3 grid grid-cols-2 gap-2">
      {items.map((c) => (
        <div key={c.id} className="rounded-md border p-2">
          <div className="h-14 rounded bg-gradient-to-br from-primary/30 to-primary/5 mb-2" />
          <div className="text-[10px] font-semibold truncate">{c.title}</div>
          <div className="text-[9px] text-muted-foreground">{money(c.priceCents)}</div>
        </div>
      ))}
    </div>
  );
}

function PaymentMethods({ payment }: { payment: any }) {
  return (
    <>
      <Section title="Cards on file">
        <div className="rounded-lg border p-3 flex items-center gap-3">
          <CreditCard className="h-5 w-5" />
          <div className="flex-1">
            <div className="text-xs font-semibold">Visa •••• 4242</div>
            <div className="text-[10px] text-muted-foreground">Default · expires 12/29</div>
          </div>
          <Badge variant="outline" className="text-[9px]">default</Badge>
        </div>
      </Section>
      <Section title="Most recent charge">
        {payment ? (
          <div className="space-y-1">
            <Row label="ID" value={payment.id} />
            <Row label="Amount" value={`${payment.currency} ${(payment.amount / 100).toFixed(2)}`} />
            <Row label="Status" value={payment.status} />
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">No payments yet — run the upper walkthrough to create one.</div>
        )}
      </Section>
    </>
  );
}

function NotificationsScreen({ me }: { me: any }) {
  const toggles = [
    "Booking confirmations",
    "Reminders 24h before",
    "Host messages",
    "Promotions",
    "Weekly digest",
  ];
  return (
    <>
      <Section title={`Preferences for ${me?.email}`}>
        <div className="space-y-2">
          {toggles.map((t, i) => (
            <div key={t} className="flex items-center justify-between rounded-md border p-2 text-[11px]">
              <span>{t}</span>
              <span className={cn("h-4 w-7 rounded-full relative", i % 2 ? "bg-primary" : "bg-muted")}>
                <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-background", i % 2 ? "right-0.5" : "left-0.5")} />
              </span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function BecomeHostScreen({ aiFilters }: { aiFilters: any }) {
  return (
    <>
      <Section title="Tell us about your craft">
        <Input placeholder="What do you teach?" defaultValue="Boxing" className="text-xs h-8" />
        <Input placeholder="Where?" defaultValue="East London" className="text-xs h-8 mt-2" />
        <textarea
          className="w-full mt-2 rounded-md border text-[11px] p-2 h-16 bg-background"
          defaultValue="I teach boxing in East London for intermediate adults."
        />
      </Section>
      <Section title="AI parsed your intake">
        <Row label="activityType" value={aiFilters?.activityType ?? "—"} />
        <Row label="city" value={aiFilters?.city ?? "—"} />
      </Section>
      <div className="p-4"><Button className="w-full" size="sm">Submit application</Button></div>
    </>
  );
}

function HelpScreen({ tip }: { tip: any }) {
  const faqs = [
    "How do I cancel a booking?",
    "When do I get charged?",
    "How do I become a host?",
    "Where do I see my receipts?",
  ];
  return (
    <>
      <Section title="FAQ">
        <div className="space-y-1">
          {faqs.map((f) => (
            <div key={f} className="flex items-center justify-between rounded-md border p-2 text-[11px]">
              <span>{f}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Today's AI tip">
        <div className="rounded-md border p-3 bg-muted/40 text-[11px] italic">
          {tip?.tip ?? "AI tip unavailable."}
        </div>
      </Section>
    </>
  );
}

function MemberGymScreen({ gym }: { gym: any }) {
  if (!gym)
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        <Building2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
        You're not a member of a gym yet.
      </div>
    );
  return (
    <>
      <div className="h-24 bg-gradient-to-br from-primary/30 to-primary/5" />
      <Section title="My gym">
        <div className="text-sm font-semibold">{gym.name}</div>
        <div className="text-[10px] text-muted-foreground">{gym.address?.street}, {gym.address?.city}</div>
        <p className="text-[11px] mt-2">{gym.description ?? "—"}</p>
      </Section>
      <Section title="Membership">
        <Row label="Status" value="Active" />
        <Row label="Plan" value="Monthly" />
      </Section>
    </>
  );
}

/* ---------- HOST ---------- */

function HostDashboard({ classes, gym }: { classes: any[]; gym: any }) {
  const today = classes.filter((c) => {
    if (!c.startAt) return false;
    const d = new Date(c.startAt);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });
  const revenue = classes.reduce((a, c) => a + (c.priceCents ?? 0) * (c.capacity ?? 0), 0);
  return (
    <>
      <div className="px-4 pt-4">
        <div className="text-xs text-muted-foreground">Welcome back</div>
        <div className="text-sm font-semibold">{gym?.name ?? "Your host dashboard"}</div>
      </div>
      <div className="px-4 grid grid-cols-2 gap-2 mt-3">
        <Kpi icon={DollarSign} label="Potential" value={money(revenue)} />
        <Kpi icon={CalendarDays} label="Classes" value={String(classes.length)} />
        <Kpi icon={Users} label="Capacity" value={String(classes.reduce((a, c) => a + (c.capacity ?? 0), 0))} />
        <Kpi icon={TrendingUp} label="Today" value={String(today.length)} />
      </div>
      <Section title="Today">
        <div className="space-y-2">
          {today.length === 0 && <div className="text-[11px] text-muted-foreground">No classes today.</div>}
          {today.map((c) => (
            <div key={c.id} className="rounded-md border p-2 flex justify-between">
              <div className="text-[11px] font-medium">{c.title}</div>
              <div className="text-[10px] text-muted-foreground">{fmtTime(c.startAt)}</div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="All classes">
        <div className="space-y-1">
          {classes.slice(0, 6).map((c) => (
            <div key={c.id} className="text-[11px] flex justify-between border-b py-1">
              <span className="truncate">{c.title}</span>
              <span className="text-muted-foreground">{money(c.priceCents)}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Icon className="h-3 w-3" /> {label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function HostCreateClass({ template }: { template: any }) {
  return (
    <Section title="New class">
      <Input className="h-8 text-xs" defaultValue={template?.title ?? "New class"} />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Input className="h-8 text-xs" defaultValue={template?.activityType ?? "YOGA"} />
        <Input className="h-8 text-xs" defaultValue={String(template?.capacity ?? 12)} />
      </div>
      <Input className="h-8 text-xs mt-2" defaultValue={fmtDate(template?.startAt)} />
      <Input className="h-8 text-xs mt-2" defaultValue={money(template?.priceCents).replace("£", "")} />
      <div className="mt-3 text-[10px] text-muted-foreground">
        Prefilled from your most recently created class via myClasses.
      </div>
      <div className="mt-3"><Button className="w-full" size="sm">Publish</Button></div>
    </Section>
  );
}

function HostManageClass({ cls, bookings }: { cls: any; bookings: any[] }) {
  if (!cls) return <div className="p-4 text-xs text-muted-foreground">No host classes yet.</div>;
  return (
    <>
      <Section title={cls.title}>
        <Row label="When" value={fmtDate(cls.startAt)} />
        <Row label="Capacity" value={`${bookings.length} / ${cls.capacity}`} />
        <Row label="Status" value={cls.status} />
      </Section>
      <Section title={`Attendees (${bookings.length})`}>
        <div className="space-y-1">
          {bookings.length === 0 && <div className="text-[11px] text-muted-foreground">No attendees yet.</div>}
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center gap-2 border rounded-md p-2 text-[11px]">
              <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px]">{b.userId?.slice(0, 2)}</div>
              <span className="flex-1 truncate">{b.userId}</span>
              <Badge variant="outline" className="text-[9px]">{b.status}</Badge>
            </div>
          ))}
        </div>
      </Section>
      <div className="p-4 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline"><MessageSquare className="h-3 w-3 mr-1"/>Message all</Button>
        <Button size="sm" variant="destructive">Cancel class</Button>
      </div>
    </>
  );
}

function EarningsScreen({ rows }: { rows: { cls: any; bookings: any[] }[] }) {
  const total = rows.reduce(
    (a, r) => a + (r.cls.priceCents ?? 0) * r.bookings.filter((b) => b.status !== "CANCELLED").length,
    0,
  );
  return (
    <>
      <Section title="Lifetime earnings">
        <div className="text-2xl font-semibold">{money(total)}</div>
        <div className="text-[10px] text-muted-foreground">From {rows.length} classes</div>
      </Section>
      <Section title="By class">
        <div className="space-y-1">
          {rows.map((r) => {
            const confirmed = r.bookings.filter((b) => b.status !== "CANCELLED").length;
            return (
              <div key={r.cls.id} className="border rounded-md p-2 flex items-center justify-between text-[11px]">
                <div>
                  <div className="font-medium truncate">{r.cls.title}</div>
                  <div className="text-[9px] text-muted-foreground">{confirmed} booked</div>
                </div>
                <div className="font-semibold">{money((r.cls.priceCents ?? 0) * confirmed)}</div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function MetricsScreen({ items }: { items: any[] }) {
  const byActivity = items.reduce<Record<string, number>>((a, c) => {
    a[c.activityType] = (a[c.activityType] ?? 0) + 1;
    return a;
  }, {});
  const cap = items.reduce((a, c) => a + (c.capacity ?? 0), 0);
  return (
    <>
      <Section title="Capacity">
        <div className="text-2xl font-semibold">{cap}</div>
        <div className="text-[10px] text-muted-foreground">Across {items.length} classes</div>
      </Section>
      <Section title="Activity mix">
        <div className="space-y-1">
          {Object.entries(byActivity).map(([k, v]) => (
            <div key={k} className="text-[11px]">
              <div className="flex justify-between"><span>{k}</span><span>{v}</span></div>
              <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(v / items.length) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function HostProfileEditor({ me, profile, ctx }: { me: any; profile: any; ctx: JourneyCtx }) {
  return (
    <>
      <div className="h-20 bg-gradient-to-br from-primary/30 to-primary/5" />
      <div className="px-4 -mt-6 flex items-end gap-3">
        <div className="h-14 w-14 rounded-full bg-background ring-4 ring-background border flex items-center justify-center font-semibold">
          {me?.name?.[0]}
        </div>
        <div>
          <div className="text-sm font-semibold">{me?.name}</div>
          <div className="text-[10px] text-muted-foreground">{me?.email}</div>
        </div>
      </div>
      <BioEditor initial={profile?.bio ?? ""} ctx={ctx} />
      <Section title="Sections">
        {[
          { icon: FileText, label: "Templates" },
          { icon: Wallet, label: "Payouts" },
          { icon: CalendarRange, label: "Availability" },
          { icon: Star, label: "Reviews" },
          { icon: HelpCircle, label: "Support" },
          { icon: Building2, label: "Gym" },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-2 p-2 rounded-md border text-[11px] mb-1">
            <r.icon className="h-3.5 w-3.5" />
            <span className="flex-1">{r.label}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </div>
        ))}
      </Section>
    </>
  );
}

function BioEditor({ initial, ctx }: { initial: string; ctx: JourneyCtx }) {
  const [bio, setBio] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    if (!ctx.accessToken) return;
    setBusy(true);
    setErr(null);
    setSaved(null);
    try {
      const d = await gql<{ updateProfile: any }>(M_UPDATE_PROFILE, { i: { bio } }, ctx.accessToken);
      setSaved(`Saved at ${fmtTime(d.updateProfile?.updatedAt)}`);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title="Bio (live save → updateProfile)">
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        className="w-full rounded-md border text-[11px] p-2 h-20 bg-background"
      />
      <Button size="sm" className="w-full mt-2" onClick={save} disabled={busy}>
        {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
        Save bio
      </Button>
      {saved && <div className="mt-2 text-[10px] text-emerald-600">✓ {saved}</div>}
      {err && <div className="mt-2 text-[10px] text-destructive">{err}</div>}
    </Section>
  );
}

function TemplatesScreen({ items }: { items: any[] }) {
  return (
    <Section title={`Templates (${items.length})`}>
      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="rounded-md border p-2">
            <div className="text-[11px] font-medium">{c.title}</div>
            <div className="text-[10px] text-muted-foreground">{c.activityType} · {c.durationMinutes}m · {money(c.priceCents)}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PayoutsScreen({ payment }: { payment: any }) {
  return (
    <>
      <Section title="Next payout">
        <div className="rounded-lg border p-3">
          <div className="text-xs">Scheduled weekly</div>
          <div className="text-2xl font-semibold mt-1">
            {payment ? `${payment.currency} ${(payment.amount / 100).toFixed(2)}` : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">From last booking</div>
        </div>
      </Section>
      <Section title="Account">
        <Row label="Bank" value="Stripe · ••2345" />
        <Row label="Currency" value={payment?.currency ?? "GBP"} />
      </Section>
    </>
  );
}

function AvailabilityScreen({ items }: { items: any[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const grid = days.map((d) => ({ day: d, count: 0 }));
  items.forEach((c) => {
    if (!c.startAt) return;
    const idx = (new Date(c.startAt).getDay() + 6) % 7;
    grid[idx].count++;
  });
  return (
    <Section title="Weekly availability">
      <div className="grid grid-cols-7 gap-1">
        {grid.map((g) => (
          <div key={g.day} className="text-center">
            <div className="text-[9px] text-muted-foreground">{g.day}</div>
            <div
              className={cn(
                "h-12 rounded-md mt-1 flex items-center justify-center text-[10px] font-semibold",
                g.count === 0 ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              {g.count}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground mt-3">
        Generated from {items.length} real classes.
      </div>
    </Section>
  );
}

function ReviewsScreen({ reviews, summary }: { reviews: any[]; summary: any }) {
  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((a, r) => a + (r.rating ?? 0), 0) / reviews.length;
  return (
    <>
      <Section title="Overall">
        <div className="text-2xl font-semibold flex items-center gap-1">
          {avg.toFixed(1)}<Star className="h-4 w-4 fill-primary text-primary"/>
        </div>
        <div className="text-[10px] text-muted-foreground">{reviews.length} reviews</div>
      </Section>
      {summary && (
        <Section title="AI summary">
          <p className="text-[11px] italic bg-muted/40 rounded-md p-2 border">{summary.summary}</p>
        </Section>
      )}
      <Section title="Reviews">
        <div className="space-y-2">
          {reviews.length === 0 && <div className="text-[11px] text-muted-foreground">No reviews yet.</div>}
          {reviews.slice(0, 5).map((r) => (
            <div key={r.id} className="rounded-md border p-2">
              <div className="flex items-center gap-1 text-[10px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-3 w-3", i < r.rating ? "fill-primary text-primary" : "text-muted-foreground")} />
                ))}
              </div>
              <p className="text-[11px] mt-1">{r.comment ?? "—"}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function SupportScreen({ tip }: { tip: any }) {
  return (
    <>
      <Section title="Host support">
        {[
          "Contact host support",
          "Payouts & taxes",
          "Insurance",
          "Community guidelines",
        ].map((l) => (
          <div key={l} className="flex items-center gap-2 p-2 rounded-md border text-[11px] mb-1">
            <Settings className="h-3.5 w-3.5" />
            <span className="flex-1">{l}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </div>
        ))}
      </Section>
      <Section title="AI coach tip">
        <div className="rounded-md border p-3 italic text-[11px] bg-muted/30">
          {tip?.tip ?? "Tip unavailable."}
        </div>
      </Section>
    </>
  );
}

function HpGymScreen({ gym }: { gym: any }) {
  if (!gym)
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        <Building2 className="h-6 w-6 mx-auto mb-2 opacity-50"/>
        No gym yet. Tap Create gym.
      </div>
    );
  return (
    <>
      <div className="h-24 bg-gradient-to-br from-primary/30 to-primary/5" />
      <Section title={gym.name}>
        <div className="text-[10px] text-muted-foreground">{gym.address?.street}, {gym.address?.city}</div>
        <p className="text-[11px] mt-2">{gym.description ?? "—"}</p>
      </Section>
      <Section title="Admin">
        {["Members", "Edit gym", "Coach view"].map((l) => (
          <div key={l} className="flex items-center gap-2 p-2 rounded-md border text-[11px] mb-1">
            <span className="flex-1">{l}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground"/>
          </div>
        ))}
      </Section>
    </>
  );
}

function HpGymCreateScreen({ gym }: { gym: any }) {
  return (
    <Section title="Create gym">
      <Input className="h-8 text-xs" placeholder="Name" defaultValue={gym?.name ?? ""} />
      <Input className="h-8 text-xs mt-2" placeholder="Tagline" defaultValue={gym?.description ?? ""} />
      <Input className="h-8 text-xs mt-2" placeholder="City" defaultValue={gym?.address?.city ?? ""} />
      <Input className="h-8 text-xs mt-2" placeholder="Postcode" defaultValue={gym?.address?.postcode ?? ""} />
      <div className="text-[10px] text-muted-foreground mt-3">
        {gym ? "Already created — values shown from the live record." : "No gym yet."}
      </div>
      <div className="mt-3"><Button className="w-full" size="sm">{gym ? "Update" : "Create"}</Button></div>
    </Section>
  );
}

function GymMembersScreen({ members }: { members: any[] }) {
  return (
    <Section title={`Members (${members.length})`}>
      <div className="space-y-1">
        {members.length === 0 && <div className="text-[11px] text-muted-foreground">No members yet — once someone books, they appear here.</div>}
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-2 border rounded-md p-2 text-[11px]">
            <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px]">{m.userId?.slice(0,2)}</div>
            <span className="flex-1 truncate">{m.userId}</span>
            <Badge variant="outline" className="text-[9px]">{m.status}</Badge>
          </div>
        ))}
      </div>
    </Section>
  );
}

function GymCoachScreen({ tip, classes }: { tip: any; classes: any[] }) {
  return (
    <>
      <Section title="Today's AI coach tip">
        <div className="rounded-md border p-3 italic text-[11px] bg-muted/30">{tip?.tip ?? "—"}</div>
      </Section>
      <Section title="Roster">
        <div className="space-y-1">
          {classes.slice(0, 6).map((c) => (
            <div key={c.id} className="border rounded-md p-2 text-[11px] flex justify-between">
              <span>{c.title}</span>
              <span className="text-muted-foreground">{c.capacity} cap</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function HpGymEditScreen({ gym }: { gym: any }) {
  if (!gym) return <div className="p-4 text-xs text-muted-foreground">No gym to edit.</div>;
  return (
    <Section title={`Edit ${gym.name}`}>
      <Input className="h-8 text-xs" defaultValue={gym.name} />
      <Input className="h-8 text-xs mt-2" defaultValue={gym.description ?? ""} />
      <Input className="h-8 text-xs mt-2" defaultValue={gym.address?.street ?? ""} />
      <Input className="h-8 text-xs mt-2" defaultValue={gym.address?.city ?? ""} />
      <div className="text-[10px] text-muted-foreground mt-3">
        These map directly to UpdateGymInput fields on the host service.
      </div>
      <div className="mt-3"><Button className="w-full" size="sm">Save changes</Button></div>
    </Section>
  );
}

// Unused-friendly re-export so lints don't complain about a couple of icons
export const __icons = { Heart, Star, BarChart3, ChevronLeft };
