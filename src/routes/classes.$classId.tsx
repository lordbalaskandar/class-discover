import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, MapPin, Clock, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from "@/components/AuthModal";
import { getClassAvailability } from "@/lib/availability.functions";
import { cn } from "@/lib/utils";

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
  const [preferredDate, setPreferredDate] = useState<Date | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const fetchAvailability = useServerFn(getClassAvailability);
  const { data: availability } = useQuery({
    queryKey: ["availability", classId],
    queryFn: () => fetchAvailability({ data: { classId } }),
  });

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

  const { bookedDates, fullDates } = useMemo(() => {
    if (!availability) return { bookedDates: [] as Date[], fullDates: [] as Date[] };
    const counts = new Map<string, { date: Date; count: number }>();
    for (const b of availability.bookings) {
      if (!b.preferred_at) continue;
      const d = new Date(b.preferred_at);
      const key = d.toISOString().slice(0, 10);
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { date: d, count: 1 });
    }
    const cap = availability.capacity ?? 1;
    const booked: Date[] = [];
    const full: Date[] = [];
    for (const { date, count } of counts.values()) {
      if (count >= cap) full.push(date);
      else booked.push(date);
    }
    return { bookedDates: booked, fullDates: full };
  }, [availability]);


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

  const scheduledBookedCount = availability?.bookingType === "scheduled" ? availability.bookings.length : 0;
  const spotsLeft = cls.capacity ? Math.max(0, cls.capacity - scheduledBookedCount) : null;
  const isFull = spotsLeft === 0;

  const handleBook = () => {
    if (!userId) {
      openAuthModal();
      return;
    }
    if (cls.booking_type === "on_request" && !preferredDate) {
      toast.error("Please pick a preferred date");
      return;
    }
    navigate({ to: "/classes/$classId/book", params: { classId: cls.id } });
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
                <Badge variant={cls.listing_type === "trainer" ? "outline" : "default"}>
                  {cls.listing_type === "trainer" ? "Trainer" : "Class"}
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
                {cls.capacity && cls.listing_type === "class" && (
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{cls.capacity} spots</span>
                )}
              </div>
            </div>

            {cls.description && (
              <div>
                <h2 className="font-semibold text-lg mb-2">About</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{cls.description}</p>
              </div>
            )}

            {/* Availability section */}
            <div>
              <h2 className="font-semibold text-lg mb-3">
                {cls.booking_type === "scheduled" ? "Session date" : "Availability"}
              </h2>
              <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-background to-muted/30">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
                  <CalendarComponent
                    mode="single"
                    selected={cls.booking_type === "scheduled" ? (when ?? undefined) : preferredDate}
                    onSelect={cls.booking_type === "on_request" ? setPreferredDate : undefined}
                    disabled={
                      cls.booking_type === "scheduled"
                        ? { before: new Date(2099, 0, 1) }
                        : (date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                            fullDates.some((f) => f.toDateString() === date.toDateString())
                    }
                    modifiers={{
                      scheduled: when ? [when] : [],
                      booked: bookedDates,
                      full: fullDates,
                    }}
                    modifiersClassNames={{
                      scheduled: "!bg-primary !text-primary-foreground font-semibold",
                      booked: "!bg-amber-500/20 !text-amber-700 dark:!text-amber-300",
                      full: "!bg-destructive/15 !text-destructive line-through opacity-70",
                    }}
                    classNames={{
                      day: "group/day relative aspect-square h-9 w-9 select-none p-0 text-center",
                    }}
                    className={cn("p-2 pointer-events-auto [&_button]:rounded-full [&_[data-selected-single=true]]:rounded-full")}
                  />
                  <div className="text-sm space-y-3 flex-1">
                    {cls.booking_type === "scheduled" ? (
                      <>
                        <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-primary" /> Session date</div>
                        {cls.capacity && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">{spotsLeft ?? cls.capacity}</span> of {cls.capacity} spots left
                            {scheduledBookedCount > 0 && ` · ${scheduledBookedCount} booked`}
                          </p>
                        )}
                        {isFull && <p className="text-destructive font-medium">This session is fully booked.</p>}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-primary" /> Your selection</div>
                        <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-amber-500/40" /> Partially booked</div>
                        <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-destructive/40" /> Fully booked</div>
                        <p className="text-muted-foreground pt-1">Pick an available date — the trainer will confirm.</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>


            {profile && (
              <div>
                <h2 className="font-semibold text-lg mb-2">{cls.listing_type === "trainer" ? "Your trainer" : "Your host"}</h2>
                <Card>
                  <CardContent className="p-4">
                    <Link
                      to="/profile/$userId"
                      params={{ userId: cls.host_id }}
                      search={{ activity: "", when: "any", type: "all", kind: "all", sort: "soonest" }}
                      className="font-medium hover:underline"
                    >
                      {profile.display_name ?? "Host"}
                    </Link>
                    {profile.city && <p className="text-sm text-muted-foreground">{profile.city}</p>}
                    {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
                    <Link
                      to="/profile/$userId"
                      params={{ userId: cls.host_id }}
                      search={{ activity: "", when: "any", type: "all", kind: "all", sort: "soonest" }}
                      className="text-sm text-primary hover:underline inline-block mt-2"
                    >
                      View profile & sessions →
                    </Link>
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
                  <p className="text-sm text-muted-foreground">This is your listing. Manage it in your host dashboard.</p>
                ) : (
                  <>
                    {cls.booking_type === "on_request" && (
                      <div className="space-y-1.5">
                        <Label>Preferred date</Label>
                        <p className="text-sm text-muted-foreground">
                          {preferredDate
                            ? preferredDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
                            : "Pick a date from the calendar"}
                        </p>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="msg">Message (optional)</Label>
                      <Textarea
                        id="msg"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Anything the host should know?"
                      />
                    </div>
                    <Button
                      onClick={handleBook}
                      disabled={submitting || isFull}
                      className="w-full bg-gradient-hero hover:opacity-90"
                    >
                      {submitting
                        ? "Please wait…"
                        : !userId
                          ? "Sign in to book"
                          : isFull
                            ? "Fully booked"
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
