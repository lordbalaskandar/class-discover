import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITIES } from "@/lib/activities";
import { PulstractAuthProvider, usePulstractAuth } from "@/lib/pulstract/auth";
import {
  useMyGym,
  useMyClasses,
  useBookingsByClass,
  useHostEarnings,
  useHostPayoutAccount,
  usePayouts,
  useNextPayout,
  useClassTemplates,
  useHostAvailability,
  useMyGymReviews,
  useAttendanceStats,
  useCreateClass,
  useCancelClass,
  useCreateTemplate,
  useDeleteTemplate,
  useCreateGym,
  useSubmitPayoutProfile,
  useCashOut,
  useRespondToReview,
} from "@/lib/pulstract/hooks";
import { toast } from "sonner";
import {
  LogOut,
  Plus,
  Calendar,
  Users,
  Wallet,
  Layers,
  MessageSquare,
  Sparkles,
  Building2,
  Loader2,
  Trash2,
  Clock,
  Banknote,
} from "lucide-react";

export const Route = createFileRoute("/host")({
  head: () => ({ meta: [{ title: "Host dashboard — Pulstract" }] }),
  component: HostRoute,
});

function HostRoute() {
  return (
    <PulstractAuthProvider scope="host">
      <HostPage />
    </PulstractAuthProvider>
  );
}

function HostPage() {
  const { session } = usePulstractAuth();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {session ? <HostShell /> : <HostAuthCard />}
    </div>
  );
}

/* ------------------------------ Auth gate ------------------------------ */

function HostAuthCard() {
  const { signIn, signUp, pendingConfirmation, confirmSignUp, resendConfirmationCode, cancelConfirmation, loading } =
    usePulstractAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email.trim());
      else await signUp(email.trim(), name.trim() || email.split("@")[0]);
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await confirmSignUp(code);
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <Card className="shadow-elegant">
        <CardContent className="p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-center">Host dashboard</h1>
          <p className="text-center text-muted-foreground mt-1 text-sm">
            Sign in to your Pulstract host account to manage your gym, classes and payouts.
          </p>

          {pendingConfirmation ? (
            <form onSubmit={submitCode} className="mt-6 space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                We've emailed a 6-digit code to{" "}
                <span className="font-medium">{pendingConfirmation.destination || pendingConfirmation.email}</span>.
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="tracking-widest text-center text-lg"
                />
              </div>
              <Button type="submit" disabled={busy || loading || code.length < 6} className="w-full bg-gradient-hero">
                {busy || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
              <div className="flex justify-between text-xs text-muted-foreground">
                <button type="button" onClick={resendConfirmationCode} className="underline">
                  Resend code
                </button>
                <button type="button" onClick={cancelConfirmation} className="underline">
                  Use a different email
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Trainer" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={busy || loading} className="w-full bg-gradient-hero">
                {busy || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create host account"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {mode === "signin" ? "New host?" : "Already have an account?"}{" "}
                <button type="button" className="underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------ Dashboard shell ------------------------------ */

function HostShell() {
  const { session, signOut } = usePulstractAuth();
  const myGymQ = useMyGym();
  const myClasses = useMyClasses();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Host dashboard</p>
          <h1 className="text-3xl font-bold mt-1">{myGymQ.data?.name ?? "Your studio"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Signed in as <span className="font-medium">{session?.email}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      {!myGymQ.isLoading && !myGymQ.data ? (
        <CreateGymSection />
      ) : (
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto">
            <TabsTrigger value="overview"><Sparkles className="h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="classes"><Calendar className="h-4 w-4" />Classes ({myClasses.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="bookings"><Users className="h-4 w-4" />Bookings</TabsTrigger>
            <TabsTrigger value="earnings"><Wallet className="h-4 w-4" />Earnings</TabsTrigger>
            <TabsTrigger value="templates"><Layers className="h-4 w-4" />Templates</TabsTrigger>
            <TabsTrigger value="availability"><Clock className="h-4 w-4" />Availability</TabsTrigger>
            <TabsTrigger value="reviews"><MessageSquare className="h-4 w-4" />Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
          <TabsContent value="classes" className="mt-6"><ClassesTab /></TabsContent>
          <TabsContent value="bookings" className="mt-6"><BookingsTab /></TabsContent>
          <TabsContent value="earnings" className="mt-6"><EarningsTab /></TabsContent>
          <TabsContent value="templates" className="mt-6"><TemplatesTab /></TabsContent>
          <TabsContent value="availability" className="mt-6"><AvailabilityTab /></TabsContent>
          <TabsContent value="reviews" className="mt-6"><ReviewsTab /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ------------------------------ Tabs ------------------------------ */

function OverviewTab() {
  const gym = useMyGym();
  const classes = useMyClasses();
  const earnings = useHostEarnings("week");
  const attendance = useAttendanceStats("week");
  const nextPayout = useNextPayout();

  const g = gym.data;
  const upcoming = useMemo(
    () => (classes.data ?? []).filter((c) => new Date(c.startAt).getTime() > Date.now()).length,
    [classes.data],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard label="This week's earnings" value={earnings.data ? formatCents(earnings.data.netCents) : "—"} sub={earnings.data ? `${earnings.data.bookingCount} bookings` : ""} />
      <StatCard label="Upcoming classes" value={upcoming.toString()} sub={`${classes.data?.length ?? 0} total`} />
      <StatCard label="Attendance" value={attendance.data ? `${attendance.data.attended}/${attendance.data.scheduled}` : "—"} sub={attendance.data ? `${attendance.data.noShows} no-shows` : ""} />
      <StatCard label="Next payout" value={nextPayout.data ? formatCents(nextPayout.data.amountCents, nextPayout.data.currency) : "—"} sub={nextPayout.data?.arrivalDate ? new Date(nextPayout.data.arrivalDate).toLocaleDateString() : "Not scheduled"} />

      <Card className="md:col-span-2 lg:col-span-4">
        <CardContent className="p-6">
          <h2 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> {g?.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{g?.description || "Add a description to attract members."}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {g?.address?.city && <Badge variant="outline">{g.address.city}</Badge>}
            {g?.capacity && <Badge variant="outline">Capacity {g.capacity}</Badge>}
            {typeof g?.rating === "number" && <Badge variant="outline">★ {g.rating.toFixed(1)}</Badge>}
            {g?.monthlyPriceCents ? <Badge variant="outline">{formatCents(g.monthlyPriceCents)}/mo</Badge> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function CreateGymSection() {
  const create = useCreateGym();
  const [form, setForm] = useState({ name: "", description: "", street: "", city: "", country: "GB", postcode: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await create.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim() || null,
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          country: form.country.trim() || "GB",
          postcode: form.postcode.trim(),
        },
      });
      toast.success("Gym created!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create gym");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold">Set up your studio</h2>
        <p className="text-sm text-muted-foreground mt-1">Before you can publish classes, create your gym profile.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Studio name</Label>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Iron Forge" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What kind of training do you offer?" />
          </div>
          <div className="space-y-1.5">
            <Label>Street</Label>
            <Input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Postcode</Label>
            <Input value={form.postcode} onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy} className="bg-gradient-hero">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create gym"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ClassesTab() {
  const classes = useMyClasses();
  const gym = useMyGym();
  const create = useCreateClass();
  const cancel = useCancelClass();
  const [form, setForm] = useState({
    title: "",
    description: "",
    activityType: "Pilates",
    startAt: "",
    durationMinutes: 60,
    capacity: 10,
    priceCents: 1500,
  });
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!gym.data?.id) return toast.error("Create a gym first");
    setBusy(true);
    try {
      await create.mutateAsync({
        gymId: gym.data.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        activityType: form.activityType,
        startAt: new Date(form.startAt).toISOString(),
        durationMinutes: form.durationMinutes,
        capacity: form.capacity,
        priceCents: form.priceCents,
      });
      toast.success("Class published!");
      setShowForm(false);
      setForm((f) => ({ ...f, title: "", startAt: "" }));
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to publish");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{classes.data?.length ?? 0} classes</p>
        <Button onClick={() => setShowForm((s) => !s)} className="bg-gradient-hero">
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New class"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Activity</Label>
                <Select value={form.activityType} onValueChange={(v) => setForm((f) => ({ ...f, activityType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTIVITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="datetime-local" required value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input type="number" min={10} value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Price (pence)</Label>
                <Input type="number" min={0} value={form.priceCents} onChange={(e) => setForm((f) => ({ ...f, priceCents: Number(e.target.value) }))} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={busy} className="bg-gradient-hero">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {classes.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (classes.data ?? []).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No classes yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {(classes.data ?? []).map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.activityType} · {new Date(c.startAt).toLocaleString()} · {c.durationMinutes} min · {c.capacity} spots · {formatCents(c.priceCents)}
                  </p>
                </div>
                <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                {c.status === "active" && (
                  <Button size="sm" variant="ghost" onClick={() => cancel.mutate(c.id, { onSuccess: () => toast.success("Class cancelled") })}>
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsTab() {
  const classes = useMyClasses();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && classes.data?.[0]?.id) setSelectedId(classes.data[0].id);
  }, [classes.data, selectedId]);
  const bookings = useBookingsByClass(selectedId);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-2">
        <p className="text-xs uppercase text-muted-foreground tracking-wide">Your classes</p>
        {(classes.data ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`w-full text-left rounded-lg border p-3 text-sm transition ${selectedId === c.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
          >
            <p className="font-medium truncate">{c.title}</p>
            <p className="text-xs text-muted-foreground">{new Date(c.startAt).toLocaleString()}</p>
          </button>
        ))}
        {!classes.data?.length && <p className="text-sm text-muted-foreground">No classes.</p>}
      </aside>
      <main>
        {!selectedId ? (
          <p className="text-sm text-muted-foreground">Select a class to see bookings.</p>
        ) : bookings.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (bookings.data ?? []).length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No bookings for this class yet.</CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {(bookings.data ?? []).map((b: any) => (
              <Card key={b.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{b.attendeeName ?? "Attendee"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(b.scheduledAt).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline">{b.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EarningsTab() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("week");
  const earnings = useHostEarnings(period);
  const payouts = usePayouts();
  const account = useHostPayoutAccount();
  const submitProfile = useSubmitPayoutProfile();
  const cashOut = useCashOut();

  const submitDemo = async () => {
    try {
      await submitProfile.mutateAsync({
        bankToken: "tok_demo",
        firstName: "Demo",
        lastName: "Host",
        email: "demo@pulstract.com",
        dob: "1990-01-01",
        addressLine1: "1 Studio Way",
        city: "London",
        postalCode: "E1 6AN",
        country: "GB",
        tosIp: "127.0.0.1",
      });
      toast.success("Payout profile submitted");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide">Earnings ({period})</p>
              <p className="text-3xl font-bold mt-1">{earnings.data ? formatCents(earnings.data.netCents) : "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Gross {earnings.data ? formatCents(earnings.data.grossCents) : "—"} · Fees{" "}
                {earnings.data ? formatCents(earnings.data.platformFeeCents) : "—"} · {earnings.data?.bookingCount ?? 0} bookings
              </p>
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as "day" | "week" | "month" | "year")}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {earnings.data?.series && earnings.data.series.length > 0 && (
            <div className="mt-6 flex items-end gap-1 h-24">
              {earnings.data.series.map((s) => {
                const max = Math.max(...earnings.data!.series.map((x) => x.grossCents), 1);
                return (
                  <div key={s.date} className="flex-1 bg-primary/70 rounded-t" style={{ height: `${(s.grossCents / max) * 100}%` }} title={`${s.date}: ${formatCents(s.grossCents)}`} />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h2 className="font-semibold flex items-center gap-2"><Banknote className="h-4 w-4" /> Payout account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Status: <Badge variant="outline">{account.data?.status ?? "unknown"}</Badge> ·{" "}
                Available {account.data ? formatCents(account.data.availableCents, account.data.currency) : "—"} · Pending{" "}
                {account.data ? formatCents(account.data.pendingCents, account.data.currency) : "—"}
              </p>
              {account.data?.bankLast4 && (
                <p className="text-xs text-muted-foreground mt-1">Bank •••• {account.data.bankLast4}</p>
              )}
            </div>
            <div className="flex gap-2">
              {!account.data?.payoutsEnabled && (
                <Button size="sm" variant="outline" onClick={submitDemo}>Submit demo profile</Button>
              )}
              {account.data?.payoutsEnabled && (account.data?.availableCents ?? 0) > 0 && (
                <Button size="sm" onClick={() => cashOut.mutate(undefined, { onSuccess: () => toast.success("Cash-out requested") })}>
                  Cash out
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-semibold mb-3">Payout history</h3>
        {payouts.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (payouts.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No payouts yet.</p>
        ) : (
          <div className="grid gap-2">
            {(payouts.data ?? []).map((p) => (
              <Card key={p.id}>
                <CardContent className="p-3 flex items-center gap-3 text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{formatCents(p.amountCents, p.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                      {p.arrivalDate && ` · arrives ${new Date(p.arrivalDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Badge variant="outline">{p.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplatesTab() {
  const templates = useClassTemplates();
  const gym = useMyGym();
  const create = useCreateTemplate();
  const del = useDeleteTemplate();
  const [form, setForm] = useState({ title: "", activityType: "Pilates", durationMinutes: 60, capacity: 10, priceCents: 1500, description: "" });
  const [showForm, setShowForm] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!gym.data?.id) return toast.error("Create a gym first");
    try {
      await create.mutateAsync({
        gymId: gym.data.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        activityType: form.activityType,
        durationMinutes: form.durationMinutes,
        capacity: form.capacity,
        priceCents: form.priceCents,
      });
      toast.success("Template saved");
      setShowForm(false);
      setForm((f) => ({ ...f, title: "" }));
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <p className="text-sm text-muted-foreground">Reusable class templates.</p>
        <Button onClick={() => setShowForm((s) => !s)} size="sm" className="bg-gradient-hero">
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New template"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <Input required placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              <Select value={form.activityType} onValueChange={(v) => setForm((f) => ({ ...f, activityType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="Duration (min)" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))} />
              <Input type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
              <Input type="number" placeholder="Price (pence)" value={form.priceCents} onChange={(e) => setForm((f) => ({ ...f, priceCents: Number(e.target.value) }))} />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="sm:col-span-2" />
              <Button type="submit" className="sm:col-span-2 bg-gradient-hero">Save template</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {(templates.data ?? []).length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No templates yet.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {(templates.data ?? []).map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.activityType} · {t.durationMinutes} min · {t.capacity} spots · {formatCents(t.priceCents)}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id, { onSuccess: () => toast.success("Template deleted") })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AvailabilityTab() {
  const a = useHostAvailability();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">Weekly availability</h3>
            <p className="text-xs text-muted-foreground">Timezone: {a.data?.timezone ?? "—"}</p>
          </div>
        </div>
        <div className="space-y-2">
          {days.map((d, idx) => {
            const slots = (a.data?.weekly ?? []).filter((w) => w.weekday === idx);
            return (
              <div key={d} className="flex items-center gap-3 text-sm">
                <div className="w-12 font-medium">{d}</div>
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {slots.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Closed</span>
                  ) : (
                    slots.map((s, i) => (
                      <Badge key={i} variant="outline">
                        {mm(s.startMinutes)}–{mm(s.endMinutes)}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {(a.data?.blackouts?.length ?? 0) > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Blackouts</p>
            <div className="flex flex-wrap gap-2">
              {a.data!.blackouts.map((b, i) => (
                <Badge key={i} variant="secondary">{b.date}{b.reason ? ` · ${b.reason}` : ""}</Badge>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-6">
          To edit weekly slots or blackouts, use the mobile preview at <a href="/mobile" className="underline">/mobile</a>.
        </p>
      </CardContent>
    </Card>
  );
}

function mm(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

function ReviewsTab() {
  const reviews = useMyGymReviews();
  const respond = useRespondToReview();
  const [replies, setReplies] = useState<Record<string, string>>({});

  return (
    <div>
      {reviews.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (reviews.data ?? []).length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No reviews yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(reviews.data ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.userName ?? "Member"}</p>
                  <Badge variant="outline">★ {r.rating}</Badge>
                </div>
                {r.comment && <p className="text-sm mt-2">{r.comment}</p>}
                {r.response ? (
                  <div className="mt-3 border-l-2 border-primary/50 pl-3 bg-muted/30 rounded p-2">
                    <p className="text-xs uppercase text-muted-foreground">Your response</p>
                    <p className="text-sm">{r.response}</p>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Write a public response…"
                      value={replies[r.id] ?? ""}
                      onChange={(e) => setReplies((p) => ({ ...p, [r.id]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      disabled={!replies[r.id]?.trim()}
                      onClick={() =>
                        respond.mutate({ id: r.id, response: replies[r.id] }, {
                          onSuccess: () => { toast.success("Response posted"); setReplies((p) => ({ ...p, [r.id]: "" })); },
                        })
                      }
                    >
                      Reply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatCents(cents: number, currency = "GBP") {
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `;
  return `${symbol}${(cents / 100).toFixed(2)}`;
}
