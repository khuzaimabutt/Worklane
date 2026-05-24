import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { calculateOrderPricing } from "@/lib/utils/fee-calculator";
import { getPlatformSettings } from "@/lib/supabase/settings";
import { generateOrderNumber } from "@/lib/utils/order-workflow";

/**
 * Creates a Stripe PaymentIntent for a checkout and a corresponding order
 * row in pending_payment state. The order is transitioned to "active" by
 * the webhook handler when Stripe confirms payment_intent.succeeded.
 *
 * Falls back with a clear error if real Stripe keys aren't configured.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || secret.includes("placeholder")) {
    return NextResponse.json(
      { error: "Stripe is not configured. Falling back to demo flow.", demoMode: true },
      { status: 503 }
    );
  }

  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { gig_id, package_id, selected_extras = [] } = body as {
    gig_id: string;
    package_id: string;
    selected_extras: Array<{ id: string; title: string; price: number }>;
  };

  if (!gig_id || !package_id) {
    return NextResponse.json({ error: "gig_id and package_id are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: gig }, { data: pkg }] = await Promise.all([
    admin.from("gigs").select("*").eq("id", gig_id).single(),
    admin.from("gig_packages").select("*").eq("id", package_id).single(),
  ]);
  if (!gig || !pkg) return NextResponse.json({ error: "Gig or package not found" }, { status: 404 });

  const settings = await getPlatformSettings();
  const extrasTotal = selected_extras.reduce((s, e) => s + Number(e.price), 0);
  const pricing = calculateOrderPricing(Number(pkg.price), extrasTotal, settings);

  const orderNumber = await generateOrderNumber();
  const deliveryDue = new Date();
  deliveryDue.setDate(deliveryDue.getDate() + pkg.delivery_days);

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
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
    })
    .select()
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: orderErr?.message || "Failed to create order" }, { status: 500 });
  }

  let paymentIntentId: string | null = null;
  let clientSecret: string | null = null;

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(pricing.buyerTotalPaid * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        buyer_id: user.id,
        seller_id: gig.seller_id,
        gig_id: gig.id,
      },
    });
    paymentIntentId = intent.id;
    clientSecret = intent.client_secret;

    await admin
      .from("orders")
      .update({ stripe_payment_intent_id: paymentIntentId })
      .eq("id", order.id);
  } catch (err: any) {
    // Roll back the pending order if Stripe rejected the request
    await admin.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: err?.message || "Failed to create payment intent" },
      { status: 500 }
    );
  }

  return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, clientSecret });
}
