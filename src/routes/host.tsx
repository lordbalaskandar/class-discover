import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Users, Calendar, BarChart3, Building2, UserCog, GraduationCap, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from "@/components/AuthModal";

export const Route = createFileRoute("/host")({
  head: () => ({ meta: [{ title: "Host dashboard — Pulsatract" }] }),
  component: HostPage,
});

function HostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { open: openAuthModal } = useAuthModal();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const { data: isHost } = useQuery({
    queryKey: ["isHost", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .eq("role", "host")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["host-classes", userId],
    enabled: !!userId && !!isHost,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("host_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: incoming = [] } = useQuery({
    queryKey: ["host-bookings", userId],
    enabled: !!userId && !!isHost,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, message, preferred_at, created_at, customer_id, classes!inner(id, title, host_id)")
        .eq("classes.host_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const customerIds = Array.from(new Set((data ?? []).map((b: any) => b.customer_id)));
      const names: Record<string, string> = {};
      if (customerIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", customerIds);
        (profs ?? []).forEach((p) => { names[p.id] = p.display_name ?? "Customer"; });
      }
      return (data ?? []).map((b: any) => ({ ...b, customer_name: names[b.customer_id] ?? "Customer" }));
    },
  });

  const becomeHost = async () => {
    if (!userId) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "host" });
    if (error) return toast.error(error.message);
    toast.success("You're now a host! 🎉");
    queryClient.invalidateQueries({ queryKey: ["isHost"] });
  };

  const updateBooking = async (id: string, status: "confirmed" | "declined") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status}`);
    queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
  };

  if (userId === undefined) return <div className="min-h-screen"><SiteHeader /></div>;

  if (userId === null) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <h1 className="text-2xl font-bold">Sign in required</h1>
          <p className="text-muted-foreground mt-2">Please sign in to access the host dashboard.</p>
          <Button onClick={openAuthModal} className="mt-6 bg-gradient-hero hover:opacity-90 shadow-elegant">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (!isHost) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="shadow-elegant">
            <CardContent className="p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold mt-4">Become a host</h1>
              <p className="text-muted-foreground mt-2">Share your craft with the community. List pilates sessions, boxing classes, pickleball meetups — whatever you teach.</p>
              <Button onClick={becomeHost} size="lg" className="mt-6 bg-gradient-hero hover:opacity-90 shadow-elegant">
                Start hosting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Host dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your classes and bookings.</p>
          </div>
          <Button asChild className="bg-gradient-hero hover:opacity-90 shadow-elegant">
            <Link to="/host/new"><Plus className="h-4 w-4 mr-1" /> New class</Link>
          </Button>
        </div>

        <div className="mt-8">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Host tools</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: BarChart3, label: "Analytics & retention", sub: "Engagement, churn, LTV", screen: "metrics" },
              { icon: Building2, label: "My gym", sub: "Overview & quick actions", screen: "hpGym" },
              { icon: Plus, label: "Create a gym", sub: "Set up your studio", screen: "hpGymCreate" },
              { icon: UserCog, label: "Gym members", sub: "Roster & invites", screen: "hpGymMembers" },
              { icon: GraduationCap, label: "Coach view", sub: "Your schedule & students", screen: "hpGymCoach" },
              { icon: Pencil, label: "Edit gym", sub: "Details, perks, hours", screen: "hpGymEdit" },
            ].map((t) => (
              <Link
                key={t.screen}
                to="/mobile"
                search={{ flow: "host", screen: t.screen }}
                className="rounded-xl border bg-card p-4 hover:bg-muted transition-colors flex items-start gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <t.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>


        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <section>
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><Calendar className="h-4 w-4" /> Your classes ({classes.length})</h2>
            {classes.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No classes yet. Create your first one!</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {classes.map((c: any) => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <Link to="/classes/$classId" params={{ classId: c.id }} className="font-medium hover:underline truncate block">{c.title}</Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.activity} · {c.location}</p>
                      </div>
                      <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Hidden"}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Incoming bookings ({incoming.length})</h2>
            {incoming.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No bookings yet.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {incoming.map((b: any) => (
                  <Card key={b.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{b.classes?.title}</p>
                          <p className="text-xs text-muted-foreground">{b.customer_name} · <span className="capitalize">{b.status}</span></p>
                        </div>
                      </div>
                      {b.message && <p className="text-sm mt-2 bg-muted rounded-md p-2">{b.message}</p>}
                      {b.preferred_at && <p className="text-xs text-muted-foreground mt-1">Preferred: {new Date(b.preferred_at).toLocaleString()}</p>}
                      {b.status === "requested" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => updateBooking(b.id, "confirmed")}>Confirm</Button>
                          <Button size="sm" variant="outline" onClick={() => updateBooking(b.id, "declined")}>Decline</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
