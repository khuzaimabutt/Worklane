import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/order/order-timeline";
import { OrderActions } from "@/components/order/order-actions";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDateTime } from "@/lib/utils/format";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/login?redirect=/order/${params.id}`);

  const { data: order } = await sb.from("orders").select("*").eq("id", params.id).single();
  if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) notFound();

  const isBuyer = order.buyer_id === user.id;
  const otherId = isBuyer ? order.seller_id : order.buyer_id;
  const { data: other } = await sb.from("users").select("full_name, username, avatar_url").eq("id", otherId).single();

  const statusColor: Record<string, "info" | "warning" | "success" | "error" | "secondary"> = {
    pending_payment: "warning",
    active: "info",
    requires_requirements: "warning",
    in_progress: "info",
    delivered: "success",
    revision_requested: "warning",
    completed: "success",
    cancelled: "error",
    disputed: "error",
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="font-mono text-xs text-neutral-500">{order.order_number}</p>
            <h1 className="font-heading text-3xl mt-1">{(order.package_snapshot as { name?: string } | null)?.name ?? "Order"}</h1>
            <p className="text-sm text-neutral-600 mt-1">
              {isBuyer ? "Seller:" : "Buyer:"} <strong>{other?.full_name}</strong>
            </p>
          </div>
          <Badge variant={statusColor[order.status] || "secondary"} className="uppercase">
            {order.status.replace(/_/g, " ")}
          </Badge>
        </div>

        <OrderTimeline status={order.status} delivered={order.delivered_at} completed={order.completed_at} />

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2">
            <OrderActions order={order} isBuyer={isBuyer} />
          </div>
          <aside className="bg-white border border-neutral-200 rounded-xl p-5 h-fit space-y-2 text-sm">
            <h3 className="font-semibold mb-2">Order Details</h3>
            <Row label="Package" value={(order.package_snapshot as { name?: string } | null)?.name ?? "—"} />
            <Row label="Buyer paid" value={formatMoney(order.buyer_total_paid)} />
            {!isBuyer && <Row label="Your earnings" value={formatMoney(order.seller_earnings)} />}
            <Row label="Delivery" value={`${order.delivery_days} days`} />
            <Row label="Revisions" value={`${order.revisions_used}/${order.revisions_allowed}`} />
            <Row label="Ordered" value={formatDateTime(order.created_at)} />
            {order.delivery_due_at && <Row label="Due" value={formatDateTime(order.delivery_due_at)} />}
            <Link href="/messages" className="block text-xs text-brand-primary hover:underline pt-2">
              Open conversation →
            </Link>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
