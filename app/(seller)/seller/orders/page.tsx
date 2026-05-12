import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/utils/format";

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
        <h1 className="font-heading text-3xl mb-6">Orders</h1>
        {!orders || orders.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
            <p className="text-neutral-500">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Link key={o.id} href={`/order/${o.id}`} className="block bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-neutral-500">{o.order_number}</p>
                    <p className="font-medium truncate">{(o.package_snapshot as any)?.name}</p>
                    <p className="text-xs text-neutral-500">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="info" className="capitalize">{o.status.replace(/_/g, " ")}</Badge>
                    <p className="text-sm font-semibold mt-1">{formatMoney(o.seller_earnings)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
