import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/utils/format";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info"> = {
  pending_payment: "warning",
  active: "info",
  in_progress: "info",
  requires_requirements: "warning",
  delivered: "info",
  revision_requested: "warning",
  completed: "success",
  cancelled: "error",
  disputed: "error",
};

export default async function SellerOrdersPage() {
  const sb = createClient();
  const { data: { user: au } } = await sb.auth.getUser();
  if (!au) redirect("/login");

  const { data: orders } = await sb
    .from("orders")
    .select("*")
    .eq("seller_id", au.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Seller</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Orders</h1>
          <p className="text-sm text-ink-subtle mt-1">
            {orders?.length ?? 0} total · sorted by most recent
          </p>
        </header>

        {!orders || orders.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-sm text-ink font-medium mb-1">No orders yet</p>
            <p className="text-sm text-ink-subtle">When a buyer orders one of your gigs, it will appear here.</p>
          </div>
        ) : (
          <div className="bg-white border border-line rounded-2xl divide-y divide-line overflow-hidden">
            {orders.map((o) => {
              const variant = STATUS_VARIANT[o.status] ?? "secondary";
              return (
                <Link
                  key={o.id}
                  href={`/order/${o.id}`}
                  className="block px-5 py-4 hover:bg-canvas-subtle transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-mono text-2xs text-ink-subtle">{o.order_number}</p>
                        <Badge variant={variant} className="capitalize">
                          {o.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="font-medium text-ink truncate">
                        {(o.package_snapshot as any)?.name ?? "Service"}
                      </p>
                      <p className="text-xs text-ink-subtle mt-0.5">Received {formatDate(o.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-semibold text-ink tabular-nums">
                        {formatMoney(o.seller_earnings)}
                      </p>
                      <ArrowRight className="w-4 h-4 text-ink-faint inline-block mt-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
