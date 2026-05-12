import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sb = createAdminClient();
  const { data: orders } = await sb
    .from("orders")
    .select("id, seller_id, seller_earnings")
    .eq("status", "completed")
    .eq("funds_cleared", false)
    .lt("funds_cleared_at", new Date().toISOString());

  let cleared = 0;
  for (const o of orders ?? []) {
    await sb.from("orders").update({ funds_cleared: true }).eq("id", o.id);
    const { data: profile } = await sb.from("seller_profiles").select("balance_available, balance_pending_clearance").eq("user_id", o.seller_id).single();
    if (profile) {
      await sb.from("seller_profiles").update({
        balance_available: Number(profile.balance_available) + Number(o.seller_earnings),
        balance_pending_clearance: Math.max(0, Number(profile.balance_pending_clearance) - Number(o.seller_earnings)),
        total_earnings_lifetime: Number(profile.balance_available) + Number(o.seller_earnings),
      }).eq("user_id", o.seller_id);
    }
    cleared += 1;
  }
  return NextResponse.json({ cleared });
}
