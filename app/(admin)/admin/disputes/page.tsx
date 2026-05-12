import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminDisputesPage() {
  const sb = createClient();
  const { data } = await sb.from("disputes").select("*, orders(order_number, buyer_id, seller_id, buyer_total_paid)").order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl mb-6">Disputes</h1>
        {!data || data.length === 0 ? (
          <p className="text-neutral-500">No open disputes.</p>
        ) : (
          <div className="space-y-3">
            {data.map((d: any) => (
              <div key={d.id} className="bg-white border border-neutral-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/order/${d.order_id}`} className="font-mono text-xs text-brand-primary hover:underline">
                      {d.orders?.order_number}
                    </Link>
                    <p className="text-sm font-medium mt-1 capitalize">{d.reason.replace(/_/g, " ")}</p>
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{d.description}</p>
                  </div>
                  <Badge variant="warning" className="capitalize">{d.status.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-xs text-neutral-500 mt-2">Opened {formatDate(d.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
