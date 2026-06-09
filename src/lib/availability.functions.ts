import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getClassAvailability = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ classId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cls, error: clsErr } = await supabaseAdmin
      .from("classes")
      .select("id, capacity, booking_type, start_at, duration_min")
      .eq("id", data.classId)
      .maybeSingle();
    if (clsErr) throw clsErr;
    if (!cls) return { bookings: [], capacity: null, bookingType: "scheduled" as const, startAt: null };

    const { data: bookings, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("preferred_at, status, created_at")
      .eq("class_id", data.classId)
      .in("status", ["requested", "confirmed"] as never);
    if (bErr) throw bErr;

    return {
      capacity: cls.capacity,
      bookingType: cls.booking_type as "scheduled" | "on_request",
      startAt: cls.start_at,
      durationMin: cls.duration_min,
      bookings: (bookings ?? []).map((b) => ({
        preferred_at: b.preferred_at,
        status: b.status,
      })),
    };
  });
