import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Clock, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from "@/components/AuthModal";

export const Route = createFileRoute("/classes/$classId")({
  component: ClassDetailPage,
  errorComponent: ({ error }) => <div className="p-8">Failed to load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Class not found.</div>,
});

function ClassDetailPage() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const { open: openAuthModal } = useAuthModal();
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [preferredAt, setPreferredAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const { data: cls, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .maybeSingle();
      if (error) throw error;
      if (!cls) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, avatar_url, city")
        .eq("id", cls.host_id)
        .maybeSingle();
      return { cls, profile };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container mx-auto px-4 py-10">
          <div className="h-96 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }
  if (!data?.cls) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Class not found.</p>
          <Button asChild className="mt-4"><Link to="/">Back to browse</Link></Button>
        </div>
      </div>
    );
  }

  const { cls, profile } = data;
  const when = cls.start_at ? new Date(cls.start_at) : null;
  const isOwner = userId === cls.host_id;

  const handleBook = async () => {
    if (!userId) {
      openAuthModal();
      return;
    }
    setSubmitting(true);
    const status = cls.booking_type === "scheduled" ? "confirmed" : "requested";
    const { error } = await supabase.from("bookings").insert({
      class_id: cls.id,
      customer_id: userId,
      status,
      message: message || null,
      preferred_at: cls.booking_type === "on_request" && preferredAt ? new Date(preferredAt).toISOString() : null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(cls.booking_type === "scheduled" ? "Spot reserved!" : "Request sent to host");
    navigate({ to: "/bookings" });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted shadow-card">
              {cls.image_url ? (
                <img src={cls.image_url} alt={cls.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-5xl font-bold">
                  {cls.activity}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{cls.activity}</Badge>
                <Badge variant={cls.booking_type === "scheduled" ? "default" : "outline"}>
                  {cls.booking_type === "scheduled" ? "Scheduled" : "On request"}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mt-3">{cls.title}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{cls.location}</span>
                {when && (
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />
                    {when.toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{cls.duration_min} min</span>
                {cls.capacity && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{cls.capacity} spots</span>}
              </div>
            </div>

            {cls.description && (
              <div>
                <h2 className="font-semibold text-lg mb-2">About this class</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{cls.description}</p>
              </div>
            )}

            {profile && (
              <div>
                <h2 className="font-semibold text-lg mb-2">Your host</h2>
                <Card>
                  <CardContent className="p-4">
                    <p className="font-medium">{profile.display_name ?? "Host"}</p>
                    {profile.city && <p className="text-sm text-muted-foreground">{profile.city}</p>}
                    {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 shadow-elegant">
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {cls.booking_type === "scheduled" ? "Reserve your spot" : "Request a session"}
                  </p>
                  <p className="text-2xl font-bold mt-1">Free</p>
                </div>

                {isOwner ? (
                  <p className="text-sm text-muted-foreground">This is your class. Manage it in your host dashboard.</p>
                ) : (
                  <>
                    {cls.booking_type === "on_request" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="pref">Preferred time (optional)</Label>
                        <Input
                          id="pref"
                          type="datetime-local"
                          value={preferredAt}
                          onChange={(e) => setPreferredAt(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="msg">Message to host (optional)</Label>
                      <Textarea
                        id="msg"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Anything the host should know?"
                      />
                    </div>
                    <Button onClick={handleBook} disabled={submitting} className="w-full bg-gradient-hero hover:opacity-90">
                      {submitting
                        ? "Please wait…"
                        : !userId
                          ? "Sign in to book"
                          : cls.booking_type === "scheduled"
                            ? "Reserve spot"
                            : "Send request"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
