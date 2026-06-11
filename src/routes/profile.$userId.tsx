import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ACTIVITIES } from "@/lib/activities";
import { Building2, Calendar, CalendarHeart, Clock, MapPin, Pencil, Save, Sparkles, User as UserIcon, Users, X } from "lucide-react";
import { toast } from "sonner";

const profileSearchSchema = z.object({
  activity: fallback(z.string(), "").default(""),
  when: fallback(z.enum(["any", "upcoming", "past", "today", "this_week"]), "any").default("any"),
  type: fallback(z.enum(["all", "scheduled", "on_request"]), "all").default("all"),
  kind: fallback(z.enum(["all", "class", "trainer"]), "all").default("all"),
  sort: fallback(z.enum(["soonest", "newest"]), "soonest").default("soonest"),
});

export const Route = createFileRoute("/profile/$userId")({
  validateSearch: zodValidator(profileSearchSchema),
  head: () => ({
    meta: [
      { title: `Profile — Pulsatract` },
      { name: "description", content: `View sessions and notes for this Pulsatract member.` },
      { property: "og:title", content: `Pulsatract profile` },
    ],
  }),
  component: ProfilePage,
});

type ProfileRow = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  special_notes: string | null;
  account_type: "person" | "gym";
};

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  location: string;
  capacity: number | null;
  image_url: string | null;
};

type ClassRow = {
  id: string;
  host_id: string;
  title: string;
  activity: string;
  location: string;
  image_url: string | null;
  duration_min: number;
  booking_type: "scheduled" | "on_request";
  listing_type: "class" | "trainer";
  start_at: string | null;
  capacity: number | null;
  is_active: boolean;
};

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function ProfilePage() {
  const { userId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/profile/$userId" });
  const queryClient = useQueryClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user.id ?? null));
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, bio, avatar_url, city, special_notes, account_type")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileRow | null;
    },
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["profile-classes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, host_id, title, activity, location, image_url, duration_min, booking_type, listing_type, start_at, capacity, is_active")
        .eq("host_id", userId)
        .order("start_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as ClassRow[];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["profile-events", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("special_events")
        .select("id, title, event_date, location, capacity, image_url")
        .eq("host_id", userId)
        .eq("is_published", true)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const isOwner = currentUserId === userId;
  const visibleClasses = useMemo(
    () => classes.filter((c) => isOwner || c.is_active),
    [classes, isOwner]
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const today = startOfDay(new Date());
    const dow = today.getDay();
    const daysToSun = (7 - dow) % 7 || 7;
    const weekEnd = addDays(today, daysToSun);

    let list = visibleClasses.filter((c) => {
      if (search.kind !== "all" && c.listing_type !== search.kind) return false;
      if (search.activity && c.activity !== search.activity) return false;
      if (search.type !== "all" && c.booking_type !== search.type) return false;
      if (search.when !== "any") {
        if (c.booking_type === "scheduled") {
          if (!c.start_at) return false;
          const t = new Date(c.start_at).getTime();
          if (search.when === "upcoming" && t < now) return false;
          if (search.when === "past" && t >= now) return false;
          if (search.when === "today" && (t < today.getTime() || t >= addDays(today, 1).getTime())) return false;
          if (search.when === "this_week" && (t < today.getTime() || t >= weekEnd.getTime())) return false;
        } else if (search.when === "past") {
          return false;
        }
      }
      return true;
    });

    if (search.sort === "soonest") {
      list = [...list].sort((a, b) => {
        const at = a.start_at ? new Date(a.start_at).getTime() : Infinity;
        const bt = b.start_at ? new Date(b.start_at).getTime() : Infinity;
        return at - bt;
      });
    }
    return list;
  }, [visibleClasses, search]);

  const update = (patch: Partial<typeof search>) => {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });
  };

  const hasFilters =
    search.activity || search.when !== "any" || search.type !== "all" || search.kind !== "all";

  // Special notes editing
  const [editing, setEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  useEffect(() => {
    if (profile && !editing) setNotesDraft(profile.special_notes ?? "");
  }, [profile, editing]);

  const saveNotes = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ special_notes: text || null })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notes updated");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update notes"),
  });

  const initials = (profile?.display_name ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="border-b bg-gradient-soft">
        <div className="container mx-auto px-4 py-10">
          {profileLoading ? (
            <div className="h-28 rounded-xl bg-muted animate-pulse" />
          ) : !profile ? (
            <div className="text-center py-12">
              <h1 className="text-2xl font-display">Profile not found</h1>
              <p className="text-muted-foreground mt-2">This member doesn't exist or hasn't set up a profile yet.</p>
              <Link to="/browse" search={{ q: "", activity: "", location: "", category: "all", type: "all", when: "any", duration: "any", capacity: "any", spots: "any", media: "any", sort: "newest" }}>
                <Button variant="outline" className="mt-4">Back to browse</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {profile.account_type === "gym" ? (
                <div className="h-24 w-24 rounded-2xl shadow-elegant bg-gradient-hero flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name ?? "Gym"} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-10 w-10 text-primary-foreground" />
                  )}
                </div>
              ) : (
                <Avatar className="h-24 w-24 shadow-elegant">
                  {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? "Profile"} /> : null}
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-3xl md:text-4xl tracking-tight">
                    {profile.display_name ?? "Unnamed member"}
                  </h1>
                  {profile.account_type === "gym" ? (
                    <Badge className="bg-primary text-primary-foreground border-0 gap-1"><Building2 className="h-3 w-3" /> Gym</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><UserIcon className="h-3 w-3" /> Member</Badge>
                  )}
                </div>
                {profile.city && (
                  <p className="mt-1 text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {profile.city}
                  </p>
                )}
                {profile.bio && <p className="mt-3 max-w-2xl text-foreground/90">{profile.bio}</p>}
              </div>
            </div>
          )}
        </div>
      </section>

      {profile && profile.account_type === "gym" && events.length > 0 && (
        <section className="border-b bg-gradient-soft/40">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-4">
              <CalendarHeart className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl">Special events</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((ev) => {
                const when = new Date(ev.event_date);
                return (
                  <Link key={ev.id} to="/events/$eventId" params={{ eventId: ev.id }} className="group block">
                    <Card className="overflow-hidden shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5 py-0 gap-0 h-full">
                      <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                        {ev.image_url ? (
                          <img src={ev.image_url} alt={ev.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-hero flex items-center justify-center">
                            <CalendarHeart className="h-10 w-10 text-primary-foreground/80" />
                          </div>
                        )}
                        <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-0">Event</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold leading-tight line-clamp-2">{ev.title}</h3>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />
                            {when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </div>
                          <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{ev.location}</div>
                        </div>
                        <Button size="sm" className="w-full mt-3">View & sign up</Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {profile && (
        <section className="border-b">
          <div className="container mx-auto px-4 py-6">
            <Card className="border-primary/40 shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Special notes
                  </h2>
                  {isOwner && !editing && (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                </div>
                {editing && isOwner ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Share things people should know — injuries you specialise in, gym amenities, dress code, parking, etc."
                      rows={5}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setNotesDraft(profile.special_notes ?? ""); }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveNotes.mutate(notesDraft)} disabled={saveNotes.isPending}>
                        <Save className="h-3.5 w-3.5" /> Save
                      </Button>
                    </div>
                  </div>
                ) : profile.special_notes ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{profile.special_notes}</p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground italic">
                    {isOwner ? "Add special notes for visitors — amenities, policies, specialties." : "No special notes yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display text-2xl">Sessions</h2>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => navigate({ search: { activity: "", when: "any", type: "all", kind: "all", sort: "soonest" } })}>
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Select value={search.kind} onValueChange={(v) => update({ kind: v as typeof search.kind })}>
            <SelectTrigger><SelectValue placeholder="Listing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All listings</SelectItem>
              <SelectItem value="class">Classes</SelectItem>
              <SelectItem value="trainer">Trainer offers</SelectItem>
            </SelectContent>
          </Select>
          <Select value={search.activity || "all"} onValueChange={(v) => update({ activity: v === "all" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="Activity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activities</SelectItem>
              {ACTIVITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.when} onValueChange={(v) => update({ when: v as typeof search.when })}>
            <SelectTrigger><SelectValue placeholder="When" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Anytime</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This week</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
          <Select value={search.type} onValueChange={(v) => update({ type: v as typeof search.type })}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All booking types</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="on_request">On request</SelectItem>
            </SelectContent>
          </Select>
          <Select value={search.sort} onValueChange={(v) => update({ sort: v as typeof search.sort })}>
            <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="soonest">Soonest</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {classesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border rounded-xl bg-muted/30">
            <p className="font-medium">No sessions to show</p>
            <p className="text-sm text-muted-foreground mt-1">Try clearing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => <SessionCard key={c.id} cls={c} />)}
          </div>
        )}
      </div>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Pulsatract · Move together
      </footer>
    </div>
  );
}

function SessionCard({ cls }: { cls: ClassRow }) {
  const when = cls.start_at ? new Date(cls.start_at) : null;
  const past = when ? when.getTime() < Date.now() : false;
  return (
    <Link to="/classes/$classId" params={{ classId: cls.id }} className="group block">
      <Card className="overflow-hidden shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5 py-0 gap-0">
        <div className="aspect-[16/10] relative overflow-hidden bg-muted">
          {cls.image_url ? (
            <img src={cls.image_url} alt={cls.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-gradient-hero" />
          )}
          <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-0">{cls.activity}</Badge>
          {!cls.is_active ? (
            <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground border-0">Inactive</Badge>
          ) : past ? (
            <Badge className="absolute top-3 right-3 bg-muted text-muted-foreground border-0">Past</Badge>
          ) : cls.booking_type === "on_request" ? (
            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground border-0">On request</Badge>
          ) : null}
        </div>
        <CardContent className="p-5">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1">{cls.title}</h3>
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{cls.location}</div>
            {when && (
              <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />
                {when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />{cls.duration_min} min
              {cls.capacity ? <><span className="mx-1">·</span><Users className="h-3.5 w-3.5" />{cls.capacity} spots</> : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
