import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ArrowLeft, Building2, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$eventId")({
  head: () => ({
    meta: [
      { title: "Event — Pulsatract" },
      { name: "description", content: "Sign up for special events at gyms near you." },
    ],
  }),
  component: EventPage,
});

type EventRow = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string | null;
  capacity: number | null;
  is_published: boolean;
};

type HostRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  account_type: "person" | "gym";
};

function EventPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("special_events")
        .select("id, host_id, title, description, event_date, location, image_url, capacity, is_published")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      return data as EventRow | null;
    },
  });

  const { data: host } = useQuery({
    queryKey: ["event-host", event?.host_id],
    enabled: !!event?.host_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, account_type")
        .eq("id", event!.host_id)
        .maybeSingle();
      if (error) throw error;
      return data as HostRow | null;
    },
  });

  const { data: signups = [] } = useQuery({
    queryKey: ["event-signups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_signups")
        .select("id, user_id")
        .eq("event_id", eventId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mine = userId ? signups.find((s) => s.user_id === userId) : null;
  const count = signups.length;
  const full = event?.capacity ? count >= event.capacity : false;

  const signUp = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in to sign up.");
      const { error } = await supabase.from("event_signups").insert({ event_id: eventId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You're signed up!");
      qc.invalidateQueries({ queryKey: ["event-signups", eventId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to sign up"),
  });

  const cancel = useMutation({
    mutationFn: async () => {
      if (!mine) return;
      const { error } = await supabase.from("event_signups").delete().eq("id", mine.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Signup cancelled");
      qc.invalidateQueries({ queryKey: ["event-signups", eventId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to cancel"),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })} className="mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>

        {isLoading ? (
          <div className="h-96 rounded-xl bg-muted animate-pulse" />
        ) : !event ? (
          <div className="text-center py-20">
            <h1 className="font-display text-2xl">Event not found</h1>
            <p className="text-muted-foreground mt-2">It may have been removed or unpublished.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted shadow-card">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-hero" />
                )}
              </div>
              <div>
                <Badge className="mb-3 bg-accent text-accent-foreground border-0">Special event</Badge>
                <h1 className="font-display text-3xl md:text-4xl tracking-tight">{event.title}</h1>
                <p className="mt-4 whitespace-pre-wrap text-foreground/90 leading-relaxed">{event.description}</p>
              </div>
            </div>

            <aside className="space-y-4">
              <Card className="shadow-card">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Date & time</div>
                      <div className="font-medium">
                        {new Date(event.event_date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.event_date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Location</div>
                      <div className="font-medium">{event.location}</div>
                    </div>
                  </div>
                  {event.capacity && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Spots</div>
                        <div className="font-medium">{count} / {event.capacity} signed up</div>
                      </div>
                    </div>
                  )}

                  {mine ? (
                    <Button variant="outline" className="w-full" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
                      <Check className="h-4 w-4" /> You're going · Cancel
                    </Button>
                  ) : !userId ? (
                    <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
                      Sign in to sign up
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => signUp.mutate()} disabled={signUp.isPending || full}>
                      {full ? "Event full" : "Sign up"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {host && (
                <Link to="/profile/$userId" params={{ userId: host.id }}>
                  <Card className="shadow-card hover:shadow-elegant transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      {host.avatar_url ? (
                        <img src={host.avatar_url} alt={host.display_name ?? "Host"} className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Hosted by</div>
                        <div className="font-medium truncate flex items-center gap-1.5">
                          {host.display_name ?? "Host"}
                          {host.account_type === "gym" && (
                            <Badge variant="secondary" className="text-[10px] py-0">Gym</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </aside>
          </div>
        )}
      </div>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Pulsatract · Move together
      </footer>
    </div>
  );
}
