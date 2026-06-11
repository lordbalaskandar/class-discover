import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIVITIES } from "@/lib/activities";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/host/new")({
  head: () => ({ meta: [{ title: "Create a class — Pulsatract" }] }),
  component: NewClassPage,
});

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  activity: z.string().min(1),
  location: z.string().trim().min(2).max(160),
  description: z.string().max(2000).optional(),
  image_url: z.string().url().or(z.literal("")).optional(),
  duration_min: z.number().min(10).max(480),
  booking_type: z.enum(["scheduled", "on_request"]),
  start_at: z.string().optional(),
  capacity: z.number().min(1).max(500).optional(),
});

function NewClassPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState({
    title: "",
    activity: "Pilates",
    location: "",
    description: "",
    image_url: "",
    duration_min: 60,
    booking_type: "scheduled" as "scheduled" | "on_request",
    start_at: "",
    capacity: 10,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth", replace: true });
      else setUserId(data.user.id);
    });
  }, [navigate]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    setSaving(true);
    const { error } = await supabase.from("classes").insert({
      host_id: userId,
      title: form.title.trim(),
      activity: form.activity,
      location: form.location.trim(),
      description: form.description?.trim() || "",
      image_url: form.image_url?.trim() || null,
      duration_min: form.duration_min,
      booking_type: form.booking_type,
      start_at: form.booking_type === "scheduled" && form.start_at ? new Date(form.start_at).toISOString() : null,
      capacity: form.booking_type === "scheduled" ? form.capacity : null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Class published!");
    navigate({ to: "/host" });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/host" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold">New class</h1>
        <p className="text-muted-foreground mt-1">Fill in the details — you can edit anytime.</p>

        <Card className="mt-6 shadow-card">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Sunrise Reformer Pilates" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Activity</Label>
                  <Select value={form.activity} onValueChange={(v) => update("activity", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIVITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc">Location</Label>
                  <Input id="loc" required value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Brooklyn, NY" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What should students expect?" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="img">Image URL (optional)</Label>
                <Input id="img" type="url" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://…" />
              </div>

              <div className="space-y-1.5">
                <Label>Booking type</Label>
                <RadioGroup value={form.booking_type} onValueChange={(v) => update("booking_type", v as any)} className="grid sm:grid-cols-2 gap-2">
                  <Label className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${form.booking_type === "scheduled" ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value="scheduled" /> Scheduled class
                  </Label>
                  <Label className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${form.booking_type === "on_request" ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value="on_request" /> On-request session
                  </Label>
                </RadioGroup>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dur">Duration (min)</Label>
                  <Input id="dur" type="number" min={10} value={form.duration_min} onChange={(e) => update("duration_min", Number(e.target.value))} />
                </div>
                {form.booking_type === "scheduled" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="start">Date & time</Label>
                      <Input id="start" type="datetime-local" value={form.start_at} onChange={(e) => update("start_at", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cap">Capacity</Label>
                      <Input id="cap" type="number" min={1} value={form.capacity} onChange={(e) => update("capacity", Number(e.target.value))} />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="submit" disabled={saving} className="bg-gradient-hero hover:opacity-90 shadow-elegant">
                  {saving ? "Publishing…" : "Publish class"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => navigate({ to: "/host" })}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
