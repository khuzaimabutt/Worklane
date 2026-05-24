import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Keepalive endpoint — runs on a Vercel Cron every 3 days to prevent
 * Supabase from auto-pausing the free-tier project after 7 consecutive
 * days of inactivity.
 *
 * Does a few small reads across different tables so any read is sufficient
 * to register the project as active. Intentionally has NO auth so it works
 * even if CRON_SECRET isn't set in env vars — this is a safety net.
 *
 * Safe to hit manually for verification (returns counts but no data).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const sb = createAdminClient();
    const [{ count: users }, { count: gigs }, { count: orders }, { data: settings }] = await Promise.all([
      sb.from("users").select("id", { count: "exact", head: true }),
      sb.from("gigs").select("id", { count: "exact", head: true }),
      sb.from("orders").select("id", { count: "exact", head: true }),
      sb.from("platform_settings").select("key").limit(1),
    ]);

    return NextResponse.json({
      ok: true,
      reason: "keepalive",
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      counts: {
        users: users ?? 0,
        gigs: gigs ?? 0,
        orders: orders ?? 0,
        settings: settings?.length ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Keepalive failed",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}
