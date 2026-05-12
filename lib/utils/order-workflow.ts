import type { OrderStatus, Order } from "@/types/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "./notifications";
import { sendEmail } from "@/lib/email/mock-email";
import { getPlatformSettings } from "@/lib/supabase/settings";
import { getClearingDays } from "./seller-levels";

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["active", "cancelled"],
  active: ["requires_requirements", "in_progress", "cancelled"],
  requires_requirements: ["in_progress", "cancelled"],
  in_progress: ["delivered", "cancelled"],
  delivered: ["completed", "revision_requested", "disputed"],
  revision_requested: ["in_progress"],
  completed: [],
  cancelled: [],
  disputed: ["completed", "cancelled"],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

export async function transitionOrder(
  orderId: string,
  newStatus: OrderStatus,
  meta: Partial<Order> = {}
): Promise<{ order: Order; error?: undefined } | { order?: undefined; error: string }> {
  const sb = createAdminClient();
  const { data: existing, error: fetchErr } = await sb.from("orders").select("*").eq("id", orderId).single();
  if (fetchErr || !existing) return { error: fetchErr?.message ?? "Order not found" };

  if (!canTransition(existing.status, newStatus)) {
    return { error: `Invalid transition ${existing.status} → ${newStatus}` };
  }

  const settings = await getPlatformSettings();
  const now = new Date().toISOString();
  const updates: Partial<Order> = { status: newStatus, ...meta };

  if (newStatus === "delivered") {
    const autoComplete = new Date();
    autoComplete.setDate(autoComplete.getDate() + parseInt(settings.auto_complete_days, 10));
    updates.delivered_at = now;
    updates.auto_complete_at = autoComplete.toISOString();
  }

  if (newStatus === "completed") {
    updates.completed_at = now;
    updates.auto_complete_at = null;

    const { data: sellerProfile } = await sb.from("seller_profiles").select("seller_level").eq("user_id", existing.seller_id).single();
    const level = sellerProfile?.seller_level ?? "new_seller";
    const clearDays = getClearingDays(level, settings);
    const clearedAt = new Date();
    clearedAt.setDate(clearedAt.getDate() + clearDays);
    updates.funds_cleared = false;
    updates.funds_cleared_at = clearedAt.toISOString();

    await sb.from("seller_profiles").update({
      total_orders_completed: (sellerProfile as any)?.total_orders_completed
        ? (sellerProfile as any).total_orders_completed + 1
        : 1,
      balance_pending_clearance: ((sellerProfile as any)?.balance_pending_clearance ?? 0) + existing.seller_earnings,
    }).eq("user_id", existing.seller_id);

    await sb.from("gigs").update({
      total_orders: ((existing as any).total_orders ?? 0) + 1,
    }).eq("id", existing.gig_id);
  }

  if (newStatus === "cancelled") {
    updates.cancelled_at = now;
  }

  const { data: updated, error: updErr } = await sb
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select("*")
    .single();

  if (updErr || !updated) return { error: updErr?.message ?? "Update failed" };

  await sideEffects(updated, newStatus);
  return { order: updated };
}

async function sideEffects(order: Order, status: OrderStatus) {
  const sb = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const orderUrl = `${appUrl}/order/${order.id}`;

  const [buyerRes, sellerRes] = await Promise.all([
    sb.from("users").select("id, full_name, email").eq("id", order.buyer_id).single(),
    sb.from("users").select("id, full_name, email").eq("id", order.seller_id).single(),
  ]);
  const buyer = buyerRes.data;
  const seller = sellerRes.data;
  if (!buyer || !seller) return;

  switch (status) {
    case "active":
    case "requires_requirements": {
      await createNotification(sb, {
        userId: order.seller_id,
        type: "new_order",
        title: "New Order Received",
        body: `${buyer.full_name} placed an order: ${order.order_number}`,
        actionUrl: `/order/${order.id}`,
      });
      await sendEmail({
        to: buyer.email,
        toName: buyer.full_name,
        subject: `Order Confirmed — ${order.order_number}`,
        template: "order_placed_buyer",
        data: {
          buyerName: buyer.full_name,
          orderNumber: order.order_number,
          gigTitle: (order.package_snapshot as any)?.name ?? "Service",
          sellerName: seller.full_name,
          totalPaid: order.buyer_total_paid.toFixed(2),
          dueDate: order.delivery_due_at?.split("T")[0] ?? "—",
          orderUrl,
        },
      });
      await sendEmail({
        to: seller.email,
        toName: seller.full_name,
        subject: `New Order — ${order.order_number}`,
        template: "new_order_seller",
        data: {
          sellerName: seller.full_name,
          orderNumber: order.order_number,
          gigTitle: (order.package_snapshot as any)?.name ?? "Service",
          buyerName: buyer.full_name,
          sellerEarnings: order.seller_earnings.toFixed(2),
          dueDate: order.delivery_due_at?.split("T")[0] ?? "—",
          orderUrl,
        },
      });
      break;
    }
    case "delivered": {
      await createNotification(sb, {
        userId: order.buyer_id,
        type: "order_delivered",
        title: "Order Delivered",
        body: `${seller.full_name} has delivered ${order.order_number}. Review or request revision.`,
        actionUrl: `/order/${order.id}`,
      });
      await sendEmail({
        to: buyer.email,
        toName: buyer.full_name,
        subject: `Delivery from ${seller.full_name}`,
        template: "order_delivered",
        data: { buyerName: buyer.full_name, sellerName: seller.full_name, orderNumber: order.order_number, orderUrl },
      });
      break;
    }
    case "completed": {
      await createNotification(sb, {
        userId: order.seller_id,
        type: "order_completed",
        title: "Order Completed",
        body: `${order.order_number} is complete. $${order.seller_earnings} is clearing.`,
        actionUrl: `/seller/earnings`,
      });
      await sendEmail({
        to: buyer.email,
        toName: buyer.full_name,
        subject: `Order Complete — ${order.order_number}`,
        template: "order_completed",
        data: {
          buyerName: buyer.full_name,
          orderNumber: order.order_number,
          reviewUrl: `${orderUrl}/review`,
        },
      });
      break;
    }
    case "cancelled": {
      await createNotification(sb, {
        userId: order.buyer_id,
        type: "order_cancelled",
        title: "Order Cancelled",
        body: `${order.order_number} was cancelled.`,
        actionUrl: `/order/${order.id}`,
      });
      await createNotification(sb, {
        userId: order.seller_id,
        type: "order_cancelled",
        title: "Order Cancelled",
        body: `${order.order_number} was cancelled.`,
        actionUrl: `/order/${order.id}`,
      });
      break;
    }
    case "revision_requested": {
      await createNotification(sb, {
        userId: order.seller_id,
        type: "revision_requested",
        title: "Revision Requested",
        body: `Revision requested on ${order.order_number}`,
        actionUrl: `/order/${order.id}`,
      });
      break;
    }
  }
}

export async function generateOrderNumber(): Promise<string> {
  const sb = createAdminClient();
  const { data } = await sb.rpc("nextval" as never, { sequence_name: "order_number_seq" } as never).single();
  const n = typeof data === "number" ? data : Math.floor(Math.random() * 100000) + 1;
  const year = new Date().getFullYear();
  return `SB-${year}-${String(n).padStart(5, "0")}`;
}
