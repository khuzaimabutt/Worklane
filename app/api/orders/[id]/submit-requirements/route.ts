import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transitionOrder } from "@/lib/utils/order-workflow";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requirements } = await request.json();
  const admin = createAdminClient();
  await admin.from("orders").update({
    requirements_submitted: true,
    buyer_requirements: requirements,
  }).eq("id", params.id).eq("buyer_id", user.id);

  const result = await transitionOrder(params.id, "in_progress");
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
