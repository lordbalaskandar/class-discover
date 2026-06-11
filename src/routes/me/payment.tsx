import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Lock, Trash2 } from "lucide-react";

export const Route = createFileRoute("/me/payment")({
  head: () => ({ meta: [{ title: "Payment methods — Pulsatract" }] }),
  component: PaymentPage,
});

function PaymentPage() {
  const [methods, setMethods] = useState([
    { id: "1", brand: "Visa", last4: "4242", exp: "08/27", default: true },
    { id: "2", brand: "Mastercard", last4: "1117", exp: "03/26", default: false },
  ]);
  const makeDefault = (id: string) => setMethods((m) => m.map((x) => ({ ...x, default: x.id === id })));
  const remove = (id: string) => setMethods((m) => m.filter((x) => x.id !== id));

  return (
    <AppShell title="Payment">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Payment methods</h1>
            <p className="text-sm text-muted-foreground mt-1">Cards you've added for one-tap class booking.</p>
          </div>
          <Button className="bg-gradient-hero shadow-elegant"><Plus className="h-4 w-4" /> Add card</Button>
        </div>

        <div className="mt-6 space-y-3">
          {methods.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-16 rounded-lg bg-gradient-hero text-primary-foreground flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{m.brand} •••• {m.last4}</p>
                  <p className="text-xs text-muted-foreground">Expires {m.exp}</p>
                </div>
                {m.default ? (
                  <Badge variant="secondary">Default</Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => makeDefault(m.id)}>Set default</Button>
                )}
                {!m.default && (
                  <Button variant="ghost" size="icon" onClick={() => remove(m.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
          <Lock className="h-3 w-3" /> Payments are processed securely. We never store full card numbers.
        </p>
      </div>
    </AppShell>
  );
}
