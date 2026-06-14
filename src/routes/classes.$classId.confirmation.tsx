import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { Stepper } from "./classes.$classId.book";

export const Route = createFileRoute("/classes/$classId/confirmation")({
  head: () => ({ meta: [{ title: "Booked — Pulstract" }] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { classId } = Route.useParams();
  const { data: cls } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!cls) return <AppShell title="Confirmation"><div className="p-8">Loading…</div></AppShell>;

  const when = cls.start_at ? new Date(cls.start_at) : null;
  const code = "DRY-" + cls.id.slice(0, 5).toUpperCase();

  return (
    <AppShell title="Booking confirmed">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Stepper step={3} />

        <div className="text-center mt-10 mb-8">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary" strokeWidth={2.2} />
          </div>
          <h1 className="font-display text-3xl font-semibold">You're booked!</h1>
          <p className="text-muted-foreground mt-2">A confirmation was sent to your email.</p>
        </div>

        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-hero">
            {cls.image_url && <img src={cls.image_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Booking {code}</p>
            <h2 className="font-semibold text-lg mt-1">{cls.title}</h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
              {when && (
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {when.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
              )}
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {cls.location}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-6">
            <p className="font-semibold mb-3">What's next</p>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-primary">•</span> Add this to your calendar</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Message your host with any questions</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Show up 10 minutes early</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button asChild className="flex-1 bg-gradient-hero shadow-elegant">
            <Link to="/bookings">View my bookings</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/">Back to browse</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
