import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { report_type, reason, description, reported_gig_id, reported_user_id, reported_review_id } = body;

  if (!report_type || !reason || !description) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await sb.from("reports").insert({
    reporter_id: user.id,
    report_type,
    reason,
    description,
    reported_gig_id: reported_gig_id ?? null,
    reported_user_id: reported_user_id ?? null,
    reported_review_id: reported_review_id ?? null,
  });

  if (error) return NextResponse.json({ error: "Failed to submit report" }, { status: 400 });
  return NextResponse.json({ success: true });
}
