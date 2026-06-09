import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from "@/components/AuthModal";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "My bookings — Dryvon" }] }),
  component: BookingsPage,
});

function BookingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { open: openAuthModal } = useAuthModal();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const { data: bookings = [] } = useQuery({
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

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold">My bookings</h1>
        <p className="text-muted-foreground mt-1">Classes you've reserved or requested.</p>

        <div className="mt-6 space-y-3">
          {bookings.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No bookings yet.</p>
              <Button asChild className="mt-4 bg-gradient-hero"><Link to="/">Browse classes</Link></Button>
            </CardContent></Card>
          ) : (
            bookings.map((b: any) => {
              const c = b.classes;
              const when = c?.start_at ? new Date(c.start_at) : (b.preferred_at ? new Date(b.preferred_at) : null);
              return (
                <Card key={b.id}>
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {c?.image_url ? (
                        <img src={c.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">{c?.activity}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to="/classes/$classId" params={{ classId: c?.id ?? "" }} className="font-semibold hover:underline truncate">{c?.title}</Link>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {c?.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>}
                        {when && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{when.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                      </div>
                    </div>
                    {b.status !== "cancelled" && b.status !== "declined" && (
                      <Button variant="outline" size="sm" onClick={() => cancel(b.id)}>Cancel</Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-accent text-accent-foreground",
    requested: "bg-secondary text-secondary-foreground",
    cancelled: "bg-muted text-muted-foreground",
    declined: "bg-destructive text-destructive-foreground",
  };
  return <Badge className={`${map[status] ?? ""} border-0 capitalize`}>{status}</Badge>;
}
