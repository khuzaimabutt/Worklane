import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("buyer_id, seller_id, gig_id, status").eq("id", body.order_id).single();
  if (!order || order.buyer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "completed") return NextResponse.json({ error: "Order must be completed" }, { status: 400 });

  const { error } = await admin.from("reviews").insert({
    order_id: body.order_id,
    gig_id: order.gig_id,
    buyer_id: order.buyer_id,
    seller_id: order.seller_id,
    overall_rating: body.overall_rating,
    communication_rating: body.communication_rating,
    service_as_described_rating: body.service_as_described_rating,
    would_recommend: body.would_recommend,
    review_text: body.review_text,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Update gig rating aggregates
  const { data: gigReviews } = await admin.from("reviews").select("overall_rating").eq("gig_id", order.gig_id);
  if (gigReviews && gigReviews.length > 0) {
    const avg = gigReviews.reduce((s, r) => s + r.overall_rating, 0) / gigReviews.length;
    await admin.from("gigs").update({
      average_rating: Math.round(avg * 100) / 100,
      total_reviews: gigReviews.length,
    }).eq("id", order.gig_id);
  }

  return NextResponse.json({ success: true });
}
