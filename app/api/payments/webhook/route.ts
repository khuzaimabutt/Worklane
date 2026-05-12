import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ received: true });
  }
  const body = await request.text();
  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    // For demo: orders are auto-progressed in /api/orders POST. In production wire payment_intent.succeeded → activate order.
    if (process.env.NODE_ENV !== "production") {
      console.log("Stripe webhook:", event.type);
    }
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }
  return NextResponse.json({ received: true });
}
