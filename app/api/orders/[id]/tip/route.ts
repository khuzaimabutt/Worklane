import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateTipBreakdown } from "@/lib/utils/fee-calculator";
import { getPlatformSettings } from "@/lib/supabase/settings";
import { sendEmail } from "@/lib/email/mock-email";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, message } = await request.json();
  if (typeof amount !== "number" || amount < 1) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("buyer_id, seller_id").eq("id", params.id).single();
  if (!order || order.buyer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await getPlatformSettings();
  const breakdown = calculateTipBreakdown(amount, settings);

  await admin.from("tips").insert({
    order_id: params.id,
    buyer_id: order.buyer_id,
    seller_id: order.seller_id,
    amount: breakdown.amount,
    platform_commission: breakdown.platformCommission,
    seller_amount: breakdown.sellerAmount,
    message: message || null,
  });

  await admin.from("orders").update({
    tip_amount: breakdown.amount,
    tip_platform_cut: breakdown.platformCommission,
    seller_tip_earnings: breakdown.sellerAmount,
  }).eq("id", params.id);

  const { data: seller } = await admin.from("users").select("email, full_name").eq("id", order.seller_id).single();
  if (seller) {
    await sendEmail({
      to: seller.email,
      toName: seller.full_name,
      subject: "You received a tip!",
      template: "tip_received",
      data: {
        sellerName: seller.full_name,
        buyerName: "Buyer",
        amount: breakdown.amount.toFixed(2),
        sellerAmount: breakdown.sellerAmount.toFixed(2),
        orderNumber: params.id,
        message: message ?? "",
      },
    });
  }

  return NextResponse.json({ success: true });
}
