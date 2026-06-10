import { createFileRoute } from "@tanstack/react-router";
import { seedTestAccounts } from "@/lib/seed.functions";

export const Route = createFileRoute("/api/public/seed")({
  server: {
    handlers: {
      POST: async () => {
        const result = await seedTestAccounts();
        return Response.json(result);
      },
      GET: async () => {
        const result = await seedTestAccounts();
        return Response.json(result);
      },
    },
  },
});
