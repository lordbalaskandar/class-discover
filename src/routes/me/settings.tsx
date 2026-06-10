import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/me/settings")({
  head: () => ({ meta: [{ title: "Settings — Dryvon" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        <h1 className="font-display text-3xl font-semibold">Settings</h1>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold">Profile</h2>
            <div className="grid gap-2"><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
            <div className="grid gap-2"><Label>Email</Label><Input value={email} disabled /></div>
            <Button onClick={() => toast.success("Profile saved")} className="bg-gradient-hero shadow-elegant w-fit">Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold">Privacy</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Marketing emails</p>
                <p className="text-xs text-muted-foreground">Occasional updates about features and offers.</p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="font-semibold text-destructive">Danger zone</h2>
            <p className="text-sm text-muted-foreground">Permanently delete your account and all bookings.</p>
            <Button variant="destructive" className="w-fit" onClick={() => toast("Account deletion is disabled in demo")}>Delete account</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
