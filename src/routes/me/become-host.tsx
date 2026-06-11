import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CalendarDays, Users, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/me/become-host")({
  head: () => ({ meta: [{ title: "Become a host — Pulsatract" }] }),
  component: BecomeHostPage,
});

const benefits = [
  { icon: DollarSign, label: "Set your own price", sub: "Keep 90% of every booking" },
  { icon: CalendarDays, label: "Flexible schedule", sub: "List sessions when you're free" },
  { icon: Users, label: "Reach new clients", sub: "Get discovered by people nearby" },
  { icon: TrendingUp, label: "Grow your brand", sub: "Reviews, followers, and metrics" },
];
const steps = [
  "Tell us about you and your craft",
  "Add your first class or service",
  "Verify your ID and payouts",
  "Go live and start hosting",
];

function BecomeHostPage() {
  return (
    <AppShell title="Become a host">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-2xl p-8 md:p-12 text-primary-foreground shadow-elegant" style={{ background: "linear-gradient(135deg,#f4b942,#e07a5f)" }}>
          <Badge className="bg-background/20 text-primary-foreground border-0 mb-3 hover:bg-background/20">Earn on Pulsatract</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Turn your craft into income</h1>
          <p className="mt-2 opacity-90 max-w-xl">Host yoga, BJJ, running clubs, PT sessions and more — entirely on your terms.</p>
          <Button asChild size="lg" className="mt-6 bg-background text-foreground hover:bg-background/90">
            <Link to="/host/new">Start hosting</Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((b) => (
            <Card key={b.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
                  <b.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{b.label}</p>
                  <p className="text-sm text-muted-foreground">{b.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">How it works</p>
          <Card>
            <CardContent className="p-6 space-y-4">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-foreground text-background text-sm font-semibold flex items-center justify-center">{i + 1}</div>
                  <p>{s}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
