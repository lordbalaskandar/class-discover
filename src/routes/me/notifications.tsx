import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/me/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Pulsatract" }] }),
  component: NotificationsPage,
});

const initial = {
  pushBookings: true,
  pushReminders: true,
  pushPromos: false,
  pushMessages: true,
  emailBookings: true,
  emailDigest: false,
  emailPromos: false,
};

function NotificationsPage() {
  const [prefs, setPrefs] = useState(initial);
  type Key = keyof typeof initial;
  const set = (k: Key, v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));

  const sections: { title: string; rows: { k: Key; label: string; sub: string }[] }[] = [
    {
      title: "Push notifications",
      rows: [
        { k: "pushBookings", label: "Booking updates", sub: "Confirmations & changes" },
        { k: "pushReminders", label: "Class reminders", sub: "1 hour before start" },
        { k: "pushMessages", label: "Messages from hosts", sub: "Replies & questions" },
        { k: "pushPromos", label: "Offers & promos", sub: "Occasional deals" },
      ],
    },
    {
      title: "Email",
      rows: [
        { k: "emailBookings", label: "Booking receipts", sub: "Always recommended" },
        { k: "emailDigest", label: "Weekly digest", sub: "New classes near you" },
        { k: "emailPromos", label: "Promotional emails", sub: "Featured hosts & events" },
      ],
    },
  ];

  return (
    <AppShell title="Notifications">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="font-display text-3xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose what you want to hear from Pulsatract.</p>

        <div className="mt-6 space-y-6">
          {sections.map((sec) => (
            <div key={sec.title}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{sec.title}</p>
              <Card>
                <CardContent className="p-0 divide-y">
                  {sec.rows.map((r) => (
                    <div key={r.k} className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{r.label}</p>
                        <p className="text-xs text-muted-foreground">{r.sub}</p>
                      </div>
                      <Switch checked={prefs[r.k]} onCheckedChange={(v) => set(r.k, v)} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
