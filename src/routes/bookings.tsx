import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from "@/components/AuthModal";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — Pulsatract" },
      { name: "description", content: "Upcoming and past class bookings on Pulsatract." },
    ],
  }),
  component: BookingsPage,
});

type Tab = "upcoming" | "past" | "cancelled";

function BookingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { open: openAuthModal } = useAuthModal();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("upcoming");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, message, preferred_at, created_at, classes(id, title, activity, location, image_url, start_at, booking_type)")
        .eq("customer_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled");
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
  };

  const counts = useMemo(() => {
    const now = Date.now();
    let upcoming = 0, past = 0, cancelled = 0;
    for (const b of bookings as any[]) {
      if (b.status === "cancelled" || b.status === "declined") { cancelled++; continue; }
      const t = b.classes?.start_at ? new Date(b.classes.start_at).getTime() : (b.preferred_at ? new Date(b.preferred_at).getTime() : 0);
      if (t && t < now) past++; else upcoming++;
    }
    return { upcoming, past, cancelled };
  }, [bookings]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return (bookings as any[]).filter((b) => {
      const isCancelled = b.status === "cancelled" || b.status === "declined";
      if (tab === "cancelled") return isCancelled;
      if (isCancelled) return false;
      const t = b.classes?.start_at ? new Date(b.classes.start_at).getTime() : (b.preferred_at ? new Date(b.preferred_at).getTime() : 0);
      const isPast = t && t < now;
      return tab === "past" ? isPast : !isPast;
    });
  }, [bookings, tab]);

  if (userId === null) {
    return (
      <AppShell title="Bookings">
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-semibold">Sign in required</h1>
          <p className="text-muted-foreground mt-2">Please sign in to view your bookings.</p>
          <Button onClick={openAuthModal} className="mt-6 bg-gradient-hero shadow-elegant">Sign in</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Bookings">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">My bookings</h1>
            <p className="text-sm text-muted-foreground mt-1">Classes you've reserved or requested.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/browse" search={{ q: "", activity: "", location: "", category: "all", type: "all", when: "any", duration: "any", capacity: "any", spots: "any", media: "any", sort: "newest" }}>Browse classes</Link>
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming {counts.upcoming > 0 && <Badge variant="secondary" className="ml-2">{counts.upcoming}</Badge>}</TabsTrigger>
            <TabsTrigger value="past">Past {counts.past > 0 && <Badge variant="secondary" className="ml-2">{counts.past}</Badge>}</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled {counts.cancelled > 0 && <Badge variant="secondary" className="ml-2">{counts.cancelled}</Badge>}</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No {tab} bookings.</p>
              <Button asChild className="mt-4 bg-gradient-hero shadow-elegant">
                <Link to="/browse" search={{ q: "", activity: "", location: "", category: "all", type: "all", when: "any", duration: "any", capacity: "any", spots: "any", media: "any", sort: "newest" }}>Find a class</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((b: any) => {
              const c = b.classes;
              const when = c?.start_at ? new Date(c.start_at) : (b.preferred_at ? new Date(b.preferred_at) : null);
              const canCancel = tab === "upcoming";
              return (
                <Card key={b.id} className="hover:shadow-elegant transition-shadow">
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className="h-20 w-28 rounded-lg bg-muted overflow-hidden shrink-0">
                      {c?.image_url ? (
                        <img src={c.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-hero flex items-center justify-center text-primary-foreground">
                          <ImageIcon className="h-5 w-5 opacity-70" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to="/classes/$classId" params={{ classId: c?.id ?? "" }} className="font-semibold hover:underline truncate">{c?.title}</Link>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {c?.activity && <Badge variant="outline" className="text-[10px]">{c.activity}</Badge>}
                        {c?.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>}
                        {when && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{when.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                      </div>
                    </div>
                    {canCancel && (
                      <Button variant="outline" size="sm" onClick={() => cancel(b.id)}>Cancel</Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    requested: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
    cancelled: "bg-muted text-muted-foreground",
    declined: "bg-destructive/10 text-destructive",
  };
  return <Badge className={`${map[status] ?? ""} border-0 capitalize`}>{status}</Badge>;
}
