import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: offer } = await admin.from("custom_offers").select("*").eq("id", params.id).single();
  if (!offer || offer.buyer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (offer.status !== "pending") return NextResponse.json({ error: "Offer not pending" }, { status: 400 });

  await admin.from("custom_offers").update({ status: "declined" }).eq("id", params.id);
  return NextResponse.json({ success: true });
}
