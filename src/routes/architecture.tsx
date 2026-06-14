import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/architecture")({
  component: ArchitecturePage,
  head: () => ({
    meta: [
      { title: "Backend Architecture — Pulstract" },
      {
        name: "description",
        content:
          "Pulstract serverless backend architecture: services, database, GraphQL ops, flows, infra and costs.",
      },
    ],
  }),
});

function ArchitecturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <iframe
          src="/architecture.html"
          title="Pulstract Backend Architecture"
          className="w-full"
          style={{ height: "calc(100vh - 4rem)", border: 0 }}
        />
      </main>
    </div>
  );
}
