import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transitionOrder } from "@/lib/utils/order-workflow";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reason } = await request.json();
  const result = await transitionOrder(params.id, "cancelled", {
    cancellation_reason: reason,
    cancellation_requested_by: user.id,
  });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
