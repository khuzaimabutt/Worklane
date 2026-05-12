import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();

  const { data, error } = await sb.from("custom_offers").insert({
    seller_id: user.id,
    buyer_id: body.buyer_id,
    conversation_id: body.conversation_id ?? null,
    title: body.title,
    description: body.description,
    price: body.price,
    delivery_days: body.delivery_days,
    revisions: body.revisions ?? 1,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ offer: data });
}
