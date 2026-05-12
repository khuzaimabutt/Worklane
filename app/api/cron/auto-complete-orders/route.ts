import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transitionOrder } from "@/lib/utils/order-workflow";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sb = createAdminClient();
  const { data: orders } = await sb
    .from("orders")
    .select("id")
    .eq("status", "delivered")
    .lt("auto_complete_at", new Date().toISOString());

  let completed = 0;
  for (const o of orders ?? []) {
    const result = await transitionOrder(o.id, "completed");
    if (!result.error) completed += 1;
  }
  return NextResponse.json({ completed });
}
