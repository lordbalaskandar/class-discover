import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MapPin, Calendar as CalendarIcon, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CLASSES, loadSavedIds, persistSavedIds } from "@/features/app/mock-data";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved classes — Dryvon" },
      { name: "description", content: "Your saved Dryvon classes, all in one place." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  useEffect(() => { setSavedIds(loadSavedIds()); }, []);
  const toggle = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      persistSavedIds(next);
      return next;
    });
  };
  const saved = CLASSES.filter((c) => savedIds.has(c.id));
  const filtered = q
    ? saved.filter((c) =>
        [c.title, c.host, c.activity, c.location].some((s) => s.toLowerCase().includes(q.toLowerCase())),
      )
    : saved;

  return (
    <AppShell title="Saved">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Saved classes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {saved.length} saved {saved.length === 1 ? "class" : "classes"} · synced to this device
            </p>
          </div>
          {saved.length > 0 && (
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saved" className="pl-9" />
            </div>
          )}
        </div>

        {saved.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-16 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Heart className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No saved classes yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Tap the heart on any class to save it here for later.
              </p>
              <Button asChild className="mt-5 bg-gradient-hero shadow-elegant">
                <Link to="/browse" search={{ q: "", activity: "", location: "", category: "all", type: "all", when: "any", duration: "any", capacity: "any", spots: "any", media: "any", sort: "newest" }}>
                  Browse classes
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <Card key={c.id} className="overflow-hidden py-0 gap-0 group hover:shadow-elegant transition-shadow">
                <Link to="/classes/$classId" params={{ classId: c.id }} className="block">
                  <div className="aspect-[16/10] relative" style={{ background: c.image }}>
                    <button
                      onClick={(e) => { e.preventDefault(); toggle(c.id); }}
                      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/95 backdrop-blur flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                      aria-label="Unsave"
                    >
                      <Heart className="h-4 w-4 fill-primary text-primary" />
                    </button>
                    <Badge className="absolute top-3 left-3 bg-background/95 text-foreground border-0">{c.activity}</Badge>
                  </div>
                </Link>
                <CardContent className="p-5">
                  <Link to="/classes/$classId" params={{ classId: c.id }} className="block">
                    <h3 className="font-semibold leading-tight">{c.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.host}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" />{c.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{c.duration}</span>
                      <span className="font-semibold">${c.price}</span>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
