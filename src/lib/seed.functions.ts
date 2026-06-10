import { createServerFn } from "@tanstack/react-start";

type SeedResult = {
  member: { email: string; password: string; id: string };
  host: { email: string; password: string; id: string };
  classes: number;
};

const MEMBER_EMAIL = "member@dryvon.test";
const HOST_EMAIL = "host@dryvon.test";
const PASSWORD = "Test1234!";

export const seedTestAccounts = createServerFn({ method: "POST" }).handler(
  async (): Promise<SeedResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    async function ensureUser(email: string, displayName: string) {
      // Try to find existing user
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listErr) throw listErr;
      const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        // ensure password matches
        await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: PASSWORD });
        return existing.id;
      }
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: displayName },
      });
      if (error) throw error;
      return data.user!.id;
    }

    const memberId = await ensureUser(MEMBER_EMAIL, "Sam Member");
    const hostId = await ensureUser(HOST_EMAIL, "Riley Host");

    // Ensure profiles
    await supabaseAdmin.from("profiles").upsert([
      { id: memberId, display_name: "Sam Member" },
      { id: hostId, display_name: "Riley Host" },
    ]);

    // Grant host role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: hostId, role: "host" }, { onConflict: "user_id,role" });

    // Clean prior sample classes from this host so seeding is idempotent
    await supabaseAdmin.from("classes").delete().eq("host_id", hostId);

    const sampleClasses = [
      {
        host_id: hostId,
        title: "Sunrise Power Yoga",
        activity: "Yoga",
        description: "Energizing vinyasa flow to start the day.",
        location: "Iron Forge Gym, SF",
        price_cents: 2500,
        duration_minutes: 60,
        capacity: 12,
        is_active: true,
      },
      {
        host_id: hostId,
        title: "Strength 101",
        activity: "Strength",
        description: "Barbell fundamentals for new lifters.",
        location: "Iron Forge Gym, SF",
        price_cents: 3500,
        duration_minutes: 75,
        capacity: 8,
        is_active: true,
      },
      {
        host_id: hostId,
        title: "Boxing Conditioning",
        activity: "Boxing",
        description: "Pad work, footwork, and conditioning circuits.",
        location: "Iron Forge Gym, SF",
        price_cents: 3000,
        duration_minutes: 60,
        capacity: 10,
        is_active: true,
      },
    ];

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("classes")
      .insert(sampleClasses)
      .select("id");
    if (insErr) throw insErr;

    // Create a sample booking from member to first class
    if (inserted && inserted.length > 0) {
      await supabaseAdmin.from("bookings").insert({
        class_id: inserted[0].id,
        customer_id: memberId,
        status: "confirmed",
        message: "Looking forward to it!",
      });
    }

    return {
      member: { email: MEMBER_EMAIL, password: PASSWORD, id: memberId },
      host: { email: HOST_EMAIL, password: PASSWORD, id: hostId },
      classes: inserted?.length ?? 0,
    };
  },
);
