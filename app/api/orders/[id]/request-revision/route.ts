import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transitionOrder } from "@/lib/utils/order-workflow";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await request.json();
  const admin = createAdminClient();
  const { data: o } = await admin.from("orders").select("buyer_id, revisions_used, revisions_allowed").eq("id", params.id).single();
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (o.buyer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (o.revisions_used >= o.revisions_allowed) return NextResponse.json({ error: "No revisions remaining" }, { status: 400 });

  await admin.from("orders").update({
    revisions_used: o.revisions_used + 1,
    revision_message: message,
  }).eq("id", params.id);

  const result = await transitionOrder(params.id, "revision_requested");
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  await transitionOrder(params.id, "in_progress");
  return NextResponse.json({ success: true });
}
