import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare, Bell, Sparkles, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/me/help")({
  head: () => ({ meta: [{ title: "Help & support — Pulstract" }] }),
  component: HelpPage,
});

const faqs = [
  { q: "How do refunds work?", a: "Cancel up to 24 hours before the class for a full refund. Inside 24 hours we offer credit toward another class." },
  { q: "What if my host cancels?", a: "You'll be refunded in full automatically and notified by push and email." },
  { q: "Can I message a host before booking?", a: "Yes — tap a host's profile and use the Message button to ask a question." },
  { q: "Is my payment information secure?", a: "Payments are processed by our PCI-compliant provider. We never store full card numbers." },
];

const links = [
  { icon: MessageSquare, label: "Chat with support", sub: "Replies in ~5 min" },
  { icon: Bell, label: "Report an issue", sub: "Booking, payment or host" },
  { icon: Sparkles, label: "Suggest a feature", sub: "Help shape Pulstract" },
];

function HelpPage() {
  return (
    <AppShell title="Help">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="font-display text-3xl font-semibold">Help & support</h1>
        <p className="text-sm text-muted-foreground mt-1">We're here whenever you need a hand.</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {links.map((l) => (
            <Card key={l.label} className="hover:shadow-elegant transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <l.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{l.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Frequently asked</p>
          <Card>
            <CardContent className="p-2">
              <Accordion type="single" collapsible>
                {faqs.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger className="px-3">{f.q}</AccordionTrigger>
                    <AccordionContent className="px-3 text-sm text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground text-center mt-6">Pulstract · v1.0.0</p>
        </div>
      </div>
    </AppShell>
  );
}
