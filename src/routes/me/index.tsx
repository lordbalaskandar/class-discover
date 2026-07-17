import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, Bell, Building2, Heart, HelpCircle, Sparkles, Calendar, ChevronRight, IdCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadSavedIds } from "@/features/app/mock-data";

export const Route = createFileRoute("/me/")({
  head: () => ({
    meta: [
      { title: "My profile — Pulstract" },
      { name: "description", content: "Manage your Pulstract profile, payments, notifications and more." },
    ],
  }),
  component: MePage,
});

function MePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setUid(data.user?.id ?? null);
    });
    setSavedCount(loadSavedIds().size);
  }, []);

  const initials = (email?.[0] ?? "?").toUpperCase();
  const stats = [
    { label: "Booked", value: "12" },
    { label: "Hosts", value: "7" },
    { label: "Reviews", value: "9" },
  ];

  const rows = [
    { label: "My bookings", sub: "View upcoming & past classes", icon: Calendar, to: "/bookings" as const },
    { label: "My gym", sub: "Calder Strength Lab · Active", icon: Building2, to: "/me/my-gym" as const },
    { label: "Payment methods", sub: "Visa •••• 4242", icon: CreditCard, to: "/me/payment" as const },
    { label: "Saved classes", sub: savedCount === 0 ? "No saved classes yet" : `${savedCount} saved`, icon: Heart, to: "/saved" as const },
    { label: "Notifications", sub: "Push & email", icon: Bell, to: "/me/notifications" as const },
    
    { label: "Help & support", sub: "FAQ, contact us", icon: HelpCircle, to: "/me/help" as const },
  ];

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header card */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-hero" />
          <CardContent className="p-6 pt-0 -mt-12">
            <div className="flex flex-wrap items-end gap-6">
              <div className="h-24 w-24 rounded-full ring-4 ring-background bg-gradient-hero text-primary-foreground flex items-center justify-center font-display text-3xl font-semibold shadow-elegant">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight truncate">
                  {email ?? "Sign in to personalize"}
                </h1>
                <Badge variant="secondary" className="mt-2"><Sparkles className="h-3 w-3 mr-1" />Member since 2024</Badge>
              </div>
              {uid && (
                <Button variant="outline" onClick={() => navigate({ to: "/profile/$userId", params: { userId: uid }, search: { activity: "", when: "any", type: "all", kind: "all", sort: "soonest" } })}>
                  <IdCard className="h-4 w-4" /> Public profile
                </Button>
              )}
            </div>
            <div className="mt-6 grid grid-cols-3 max-w-sm divide-x rounded-lg border bg-muted/30">
              {stats.map((s) => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <p className="font-display text-xl font-semibold">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sections grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((r) => (
            <Link key={r.label} to={r.to}>
              <Card className="hover:shadow-elegant hover:-translate-y-0.5 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
