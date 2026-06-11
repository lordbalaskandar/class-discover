import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { mockPriceForClass, SERVICE_FEE } from "@/lib/pricing";
import { loadDraft, clearDraft, Stepper } from "./classes.$classId.book";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/classes/$classId/pay")({
  head: () => ({ meta: [{ title: "Payment — Pulsatract" }] }),
  component: PayPage,
});

function PayPage() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [method, setMethod] = useState<"card" | "apple" | "google">("card");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12 / 28");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("Jordan Lee");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: cls } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!cls) return <AppShell title="Payment"><div className="p-8">Loading…</div></AppShell>;

  const draft = loadDraft();
  const spots = draft && draft.classId === classId ? draft.spots : 1;
  const note = draft && draft.classId === classId ? draft.note : "";
  const price = mockPriceForClass(cls.id);
  const total = price * spots + SERVICE_FEE;

  const handlePay = async () => {
    if (!userId) { toast.error("Please sign in"); return; }
    setProcessing(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 1200));
    const status = cls.booking_type === "scheduled" ? "confirmed" : "requested";
    const { error } = await supabase.from("bookings").insert({
      class_id: cls.id,
      customer_id: userId,
      status,
      message: note || null,
    });
    setProcessing(false);
    if (error) { toast.error(error.message); return; }
    clearDraft();
    toast.success("Payment successful");
    navigate({ to: "/classes/$classId/confirmation", params: { classId: cls.id } });
  };

  return (
    <AppShell title="Payment">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/classes/$classId/book" params={{ classId: cls.id }} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to review
        </Link>

        <Stepper step={2} />

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-5">
                <div>
                  <h1 className="font-display text-2xl font-semibold">Payment method</h1>
                  <p className="text-sm text-muted-foreground mt-1">Demo only — no real charge.</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(["apple", "google", "card"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={cn(
                        "py-3 rounded-lg border text-sm font-semibold transition-all",
                        method === m ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted",
                      )}
                    >
                      {m === "apple" ? " Pay" : m === "google" ? "G Pay" : "Card"}
                    </button>
                  ))}
                </div>

                {method === "card" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl p-5 bg-gradient-to-br from-foreground to-foreground/70 text-background shadow-elegant">
                      <div className="flex items-center justify-between">
                        <CreditCard className="h-6 w-6 opacity-80" />
                        <span className="text-xs uppercase tracking-widest opacity-80">Visa</span>
                      </div>
                      <p className="font-mono text-xl tracking-widest mt-6">{card || "•••• •••• •••• ••••"}</p>
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <div><p className="opacity-70 text-[10px] uppercase">Name</p><p>{name || "—"}</p></div>
                        <div><p className="opacity-70 text-[10px] uppercase">Exp</p><p>{exp || "—"}</p></div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <Label htmlFor="cn">Card number</Label>
                        <Input id="cn" value={card} onChange={(e) => setCard(e.target.value)} className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="ex">Expiry</Label>
                          <Input id="ex" value={exp} onChange={(e) => setExp(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="cv">CVC</Label>
                          <Input id="cv" value={cvc} onChange={(e) => setCvc(e.target.value)} className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="nm">Cardholder name</Label>
                        <Input id="nm" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
                      </div>
                    </div>
                  </div>
                )}

                {method !== "card" && (
                  <Card className="p-8 text-center bg-muted/40">
                    <p className="text-sm text-muted-foreground">Click "Pay" to confirm with {method === "apple" ? "Apple Pay" : "Google Pay"}.</p>
                  </Card>
                )}

                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3" /> Encrypted · Demo only, no real charge
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6 shadow-elegant">
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Total due</p>
                  <p className="font-display text-3xl font-semibold mt-1">${total.toFixed(2)}</p>
                </div>
                <div className="border-t pt-3 text-sm">
                  <p className="font-medium">{cls.title}</p>
                  <p className="text-muted-foreground">{spots} {spots === 1 ? "spot" : "spots"}</p>
                </div>
                <div className="border-t pt-3 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>{spots} × ${price}</span><span>${(price * spots).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Service fee</span><span>${SERVICE_FEE.toFixed(2)}</span></div>
                </div>
                <Button onClick={handlePay} disabled={processing} className="w-full bg-gradient-hero shadow-elegant">
                  {processing ? "Processing…" : `Pay $${total.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
