import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateOrderPricing } from "@/lib/utils/fee-calculator";
import { getPlatformSettings } from "@/lib/supabase/settings";
import { transitionOrder } from "@/lib/utils/order-workflow";

export async function POST(request: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { gig_id, package_id, selected_extras = [] } = body as { gig_id: string; package_id: string; selected_extras: Array<{ id: string; title: string; price: number }> };

  const admin = createAdminClient();
  const [{ data: gig }, { data: pkg }] = await Promise.all([
    admin.from("gigs").select("*").eq("id", gig_id).single(),
    admin.from("gig_packages").select("*").eq("id", package_id).single(),
  ]);
  if (!gig || !pkg) return NextResponse.json({ error: "Gig or package not found" }, { status: 404 });

  const settings = await getPlatformSettings();
  const extrasTotal = selected_extras.reduce((s, e) => s + Number(e.price), 0);
  const pricing = calculateOrderPricing(Number(pkg.price), extrasTotal, settings);

  const orderNumber = `SB-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
  const deliveryDue = new Date();
  deliveryDue.setDate(deliveryDue.getDate() + pkg.delivery_days);

  const { data: order, error } = await admin.from("orders").insert({
    order_number: orderNumber,
    buyer_id: user.id,
    seller_id: gig.seller_id,
    gig_id: gig.id,
    package_id: pkg.id,
    package_snapshot: pkg as never,
    selected_extras: selected_extras as never,
    gig_base_price: Number(pkg.price),
    extras_price: extrasTotal,
    order_subtotal: pricing.orderSubtotal,
    buyer_service_fee: pricing.buyerServiceFee,
    buyer_total_paid: pricing.buyerTotalPaid,
    platform_commission: pricing.platformCommission,
    seller_earnings: pricing.sellerEarnings,
    delivery_days: pkg.delivery_days,
    revisions_allowed: pkg.revisions,
    delivery_due_at: deliveryDue.toISOString(),
    status: "pending_payment",
  }).select().single();

  if (error || !order) return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });

  // For demo: simulate successful Stripe payment immediately. In production this happens via webhook.
  await transitionOrder(order.id, "active");
  await transitionOrder(order.id, "requires_requirements");

  return NextResponse.json({ order });
}
