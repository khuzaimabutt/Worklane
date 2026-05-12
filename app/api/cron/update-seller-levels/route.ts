import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateLevel } from "@/lib/utils/seller-levels";
import { getPlatformSettings } from "@/lib/supabase/settings";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sb = createAdminClient();
  const settings = await getPlatformSettings();
  const { data: profiles } = await sb.from("seller_profiles").select("*");

  let changed = 0;
  for (const p of profiles ?? []) {
    const daysActive = Math.floor((Date.now() - new Date(p.joined_as_seller_at).getTime()) / 86400000);
    const newLevel = calculateLevel(
      {
        orders: p.total_orders_completed,
        earnings: Number(p.total_earnings_lifetime),
        daysActive,
        rating: Number(p.average_rating),
      },
      settings
    );
    if (newLevel !== p.seller_level) {
      await sb.from("seller_profiles").update({ seller_level: newLevel }).eq("user_id", p.user_id);
      await sb.from("seller_level_history").insert({
        seller_id: p.user_id,
        previous_level: p.seller_level,
        new_level: newLevel,
        reason: "Automatic level review",
      });
      changed += 1;
    }
  }
  return NextResponse.json({ changed });
}
