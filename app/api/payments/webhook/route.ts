import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { transitionOrder } from "@/lib/utils/order-workflow";

/**
 * Stripe webhook handler.
 *
 * Verifies the Stripe signature, then routes a small set of event types:
 *  - payment_intent.succeeded  → transition order pending_payment → active → requires_requirements
 *  - payment_intent.payment_failed → cancel the pending order
 *  - charge.refunded          → cancel an active order if a refund was issued out-of-band
 *
 * If STRIPE_WEBHOOK_SECRET isn't set, returns 200 with a no-op so demo
 * environments without webhook plumbing don't error.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || secret.includes("placeholder")) {
    return NextResponse.json({ received: true, demoMode: true });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Webhook signature verification failed", detail: err?.message },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.order_id;
        if (!orderId) {
          console.warn("payment_intent.succeeded missing order_id metadata", intent.id);
          break;
        }
        const { data: order } = await admin
          .from("orders")
          .select("id, status")
          .eq("id", orderId)
          .single();
        if (!order) {
          console.warn("payment_intent.succeeded for unknown order", orderId);
          break;
        }
        if (order.status === "pending_payment") {
          await transitionOrder(orderId, "active");
          await transitionOrder(orderId, "requires_requirements");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.order_id;
        if (!orderId) break;
        const { data: order } = await admin
          .from("orders")
          .select("id, status")
          .eq("id", orderId)
          .single();
        if (order?.status === "pending_payment") {
          await transitionOrder(orderId, "cancelled");
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (!intentId) break;
        const { data: order } = await admin
          .from("orders")
          .select("id, status")
          .eq("stripe_payment_intent_id", intentId)
          .single();
        if (order && order.status !== "cancelled" && order.status !== "completed") {
          await transitionOrder(order.id, "cancelled");
        }
        break;
      }

      default:
        // Other events are ignored intentionally.
        break;
    }
  } catch (err: any) {
    // Don't 500 to Stripe — that triggers retries. Log and acknowledge.
    console.error("Webhook handler error for", event.type, err);
    return NextResponse.json({ received: true, handled: false, error: err?.message });
  }

  return NextResponse.json({ received: true });
}
