import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Minus, Plus, ArrowLeft } from "lucide-react";
import { useAuthModal } from "@/components/AuthModal";
import { mockPriceForClass, SERVICE_FEE } from "@/lib/pricing";

export const Route = createFileRoute("/classes/$classId/book")({
  head: () => ({ meta: [{ title: "Book session — Pulstract" }] }),
  component: BookPage,
});

const BOOK_KEY = "pulstract.book.draft";
type Draft = { classId: string; spots: number; note: string; preferredAt?: string };

export function saveDraft(d: Draft) {
  if (typeof window !== "undefined") window.localStorage.setItem(BOOK_KEY, JSON.stringify(d));
}
export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try { const r = window.localStorage.getItem(BOOK_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function clearDraft() {
  if (typeof window !== "undefined") window.localStorage.removeItem(BOOK_KEY);
}

function BookPage() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const { open: openAuthModal } = useAuthModal();
  const [userId, setUserId] = useState<string | null>(null);
  const [spots, setSpots] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: cls, isLoading } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <AppShell title="Book"><div className="p-8"><div className="h-96 bg-muted rounded animate-pulse" /></div></AppShell>;
  if (!cls) return <AppShell title="Book"><div className="p-8">Class not found.</div></AppShell>;

  const price = mockPriceForClass(cls.id);
  const subtotal = price * spots;
  const total = subtotal + SERVICE_FEE;
  const when = cls.start_at ? new Date(cls.start_at) : null;

  const handleContinue = () => {
    if (!userId) { openAuthModal(); return; }
    saveDraft({ classId: cls.id, spots, note });
    navigate({ to: "/classes/$classId/pay", params: { classId: cls.id } });
  };

  return (
    <AppShell title="Book your spot">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/classes/$classId" params={{ classId: cls.id }} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to class
        </Link>

        <Stepper step={1} />

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-5">
                <div>
                  <h1 className="font-display text-2xl font-semibold">Review your booking</h1>
                  <p className="text-sm text-muted-foreground mt-1">Adjust spots and add a note for the host.</p>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Spots</Label>
                  <div className="mt-2 flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{spots} {spots === 1 ? "spot" : "spots"}</p>
                      {cls.capacity && <p className="text-xs text-muted-foreground">{cls.capacity} max capacity</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" onClick={() => setSpots(Math.max(1, spots - 1))} disabled={spots <= 1}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-semibold">{spots}</span>
                      <Button variant="outline" size="icon" onClick={() => setSpots(Math.min(cls.capacity ?? 8, spots + 1))}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="note" className="text-xs uppercase tracking-widest text-muted-foreground">Note to host (optional)</Label>
                  <Textarea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="First time at this studio…" className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6 shadow-elegant">
              <CardContent className="p-6 space-y-4">
                <div className="aspect-[16/10] rounded-lg overflow-hidden bg-muted">
                  {cls.image_url ? (
                    <img src={cls.image_url} alt={cls.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-hero" />
                  )}
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">{cls.activity}</Badge>
                  <h3 className="font-semibold">{cls.title}</h3>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {when && <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{when.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>}
                  <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{cls.duration_min} min</p>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{cls.location}</p>
                </div>
                <div className="border-t pt-3 space-y-1.5 text-sm">
                  <Row label={`${spots} × $${price}`} value={`$${subtotal.toFixed(2)}`} />
                  <Row label="Service fee" value={`$${SERVICE_FEE.toFixed(2)}`} />
                  <div className="border-t pt-2 mt-2"><Row label="Total" value={`$${total.toFixed(2)}`} bold /></div>
                </div>
                <Button onClick={handleContinue} className="w-full bg-gradient-hero shadow-elegant">
                  Continue to payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold text-base" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Review", "Payment", "Confirmation"];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={s} className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${active ? "bg-foreground text-background" : done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{n}</div>
            <span className={`text-sm ${active ? "font-semibold" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <div className="h-px w-12 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
