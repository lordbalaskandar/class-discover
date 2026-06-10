import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin, Users, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/me/my-gym")({
  head: () => ({ meta: [{ title: "My gym — Dryvon" }] }),
  component: MyGymPage,
});

const upcoming = [
  { id: "u1", title: "Open Mat", coach: "Coach Devon", date: "Today · 7:00 PM", spots: "12 / 20" },
  { id: "u2", title: "Strength 101", coach: "Coach Maya", date: "Tomorrow · 6:30 AM", spots: "6 / 12" },
  { id: "u3", title: "BJJ Fundamentals", coach: "Coach Sam", date: "Fri · 8:00 PM", spots: "15 / 20" },
];

const perks = [
  "Unlimited group classes",
  "2 PT sessions / month",
  "Recovery room access",
  "Guest passes (2 / month)",
];

function MyGymPage() {
  return (
    <AppShell title="My gym">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Card className="overflow-hidden">
          <div className="h-40 md:h-56" style={{ background: "linear-gradient(135deg,#3a506b,#5bc0be)" }} />
          <CardContent className="p-6 -mt-12">
            <div className="flex flex-wrap items-end gap-6">
              <div className="h-20 w-20 rounded-2xl bg-background ring-4 ring-background flex items-center justify-center shadow-elegant">
                <Building2 className="h-9 w-9" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-semibold">Calder Strength Lab</h1>
                  <Badge className="bg-emerald-100 text-emerald-900 border-0 dark:bg-emerald-950 dark:text-emerald-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> 312 Valencia St, San Francisco
                </p>
              </div>
              <Button variant="outline">View location</Button>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Plan", value: "Strong" },
                { label: "Visits this month", value: "11" },
                { label: "Member since", value: "Mar 2024" },
                { label: "Next billing", value: "Jul 12" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border bg-muted/30 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                  <p className="font-display text-lg font-semibold mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-semibold">Upcoming classes</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/browse" search={{ q: "", activity: "", location: "", category: "all", type: "all", when: "any", duration: "any", capacity: "any", spots: "any", media: "any", sort: "newest" }}>
                    See all
                  </Link>
                </Button>
              </div>
              <Card>
                <CardContent className="p-0 divide-y">
                  {upcoming.map((u) => (
                    <div key={u.id} className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{u.title}</p>
                        <p className="text-xs text-muted-foreground">{u.coach} · {u.date}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {u.spots}
                      </span>
                      <Button size="sm" variant="outline">Reserve</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-3">Today at the gym</h2>
              <Card>
                <CardContent className="p-5 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Open until 10:00 PM</div>
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> 24 members checked in</div>
                </CardContent>
              </Card>
            </section>
          </div>

          <aside>
            <h2 className="font-display text-lg font-semibold mb-3">What's included</h2>
            <Card>
              <CardContent className="p-5 space-y-3">
                {perks.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {p}
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
