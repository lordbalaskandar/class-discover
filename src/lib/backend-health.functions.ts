import { createServerFn } from "@tanstack/react-start";

const SERVICES = [
  ["gateway", "https://dev.api.gateway.pulstract.com"],
  ["ai", "https://dev.api.ai.pulstract.com"],
  ["analytics", "https://dev.api.analytics.pulstract.com"],
  ["booking", "https://dev.api.booking.pulstract.com"],
  ["discovery", "https://dev.api.discovery.pulstract.com"],
  ["gym", "https://dev.api.gym.pulstract.com"],
  ["host", "https://dev.api.host.pulstract.com"],
  ["notification", "https://dev.api.notification.pulstract.com"],
  ["payment", "https://dev.api.payment.pulstract.com"],
  ["profile", "https://dev.api.profile.pulstract.com"],
  ["review", "https://dev.api.review.pulstract.com"],
] as const;

export type HealthResult = {
  name: string;
  url: string;
  ok: boolean;
  status: number | null;
  latencyMs: number;
  body?: string;
  error?: string;
};

export const checkBackendHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<HealthResult[]> => {
    const results = await Promise.all(
      SERVICES.map(async ([name, base]) => {
        const url = `${base}/health`;
        const start = Date.now();
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 6000);
          const res = await fetch(url, { signal: ctrl.signal });
          clearTimeout(t);
          const body = await res.text();
          return {
            name,
            url,
            ok: res.ok,
            status: res.status,
            latencyMs: Date.now() - start,
            body: body.slice(0, 200),
          } satisfies HealthResult;
        } catch (e) {
          return {
            name,
            url,
            ok: false,
            status: null,
            latencyMs: Date.now() - start,
            error: e instanceof Error ? e.message : String(e),
          } satisfies HealthResult;
        }
      }),
    );
    return results;
  },
);
