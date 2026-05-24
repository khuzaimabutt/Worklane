import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/order/order-timeline";
import { OrderActions } from "@/components/order/order-actions";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDateTime, initials } from "@/lib/utils/format";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info"> = {
  pending_payment: "warning",
  active: "info",
  requires_requirements: "warning",
  in_progress: "info",
  delivered: "info",
  revision_requested: "warning",
  completed: "success",
  cancelled: "error",
  disputed: "error",
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/login?redirect=/order/${params.id}`);

  const { data: order } = await sb.from("orders").select("*").eq("id", params.id).single();
  if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) notFound();

  const isBuyer = order.buyer_id === user.id;
  const otherId = isBuyer ? order.seller_id : order.buyer_id;
  const { data: other } = await sb
    .from("users")
    .select("full_name, username, avatar_url")
    .eq("id", otherId)
    .single();

  const packageName = (order.package_snapshot as { name?: string } | null)?.name ?? "Order";

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href={isBuyer ? "/dashboard" : "/seller/orders"}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {isBuyer ? "Back to dashboard" : "Back to orders"}
        </Link>

        <header className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div className="min-w-0">
            <p className="font-mono text-2xs text-ink-subtle mb-1">{order.order_number}</p>
            <h1 className="font-heading text-2xl sm:text-3xl text-ink mb-3 text-balance">{packageName}</h1>
            {other && (
              <div className="flex items-center gap-2.5">
                <Avatar className="w-7 h-7 border border-line">
                  {other.avatar_url && <AvatarImage src={other.avatar_url} />}
                  <AvatarFallback className="text-2xs bg-canvas-subtle text-ink-muted">
                    {initials(other.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-ink-muted">
                  {isBuyer ? "Seller " : "Buyer "}
                  <Link href={`/seller/${other.username}`} className="font-semibold text-ink hover:underline">
                    {other.full_name}
                  </Link>
                </span>
              </div>
            )}
          </div>
          <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"} className="capitalize shrink-0">
            {order.status.replace(/_/g, " ")}
          </Badge>
        </header>

        <OrderTimeline status={order.status} delivered={order.delivered_at} completed={order.completed_at} />

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <OrderActions order={order} isBuyer={isBuyer} />
          </div>
          <aside className="bg-white border border-line rounded-2xl h-fit overflow-hidden">
            <div className="px-5 py-4 border-b border-line bg-canvas-subtle">
              <h3 className="font-heading text-base text-ink">Order details</h3>
            </div>
            <dl className="px-5 py-4 space-y-2.5 text-sm">
              <Row label="Package" value={packageName} />
              <Row label="Buyer paid" value={formatMoney(order.buyer_total_paid)} mono />
              {!isBuyer && <Row label="Your earnings" value={formatMoney(order.seller_earnings)} mono accent />}
              <Row label="Delivery" value={`${order.delivery_days} days`} />
              <Row label="Revisions" value={`${order.revisions_used}/${order.revisions_allowed}`} />
              <Row label="Ordered" value={formatDateTime(order.created_at)} />
              {order.delivery_due_at && <Row label="Due" value={formatDateTime(order.delivery_due_at)} />}
            </dl>
            <div className="px-5 py-3 border-t border-line bg-canvas-subtle">
              <Link
                href="/messages"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary-dark hover:underline"
              >
                <MessageCircle className="w-4 h-4" />
                Open conversation
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className={`${mono ? "tabular-nums" : ""} ${accent ? "text-brand-primary-dark" : "text-ink"} font-semibold text-right`}>
        {value}
      </dd>
    </div>
  );
}
