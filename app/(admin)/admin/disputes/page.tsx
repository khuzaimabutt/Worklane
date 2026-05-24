import Link from "next/link";
import { AlertOctagon, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info"> = {
  open: "warning",
  in_review: "info",
  resolved_buyer: "success",
  resolved_seller: "success",
  cancelled: "secondary",
};

export default async function AdminDisputesPage() {
  const sb = createClient();
  const { data } = await sb
    .from("disputes")
    .select("*, orders(order_number, buyer_id, seller_id, buyer_total_paid)")
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Admin</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Disputes</h1>
          <p className="text-sm text-ink-subtle mt-1">{data?.length ?? 0} total · most recent first</p>
        </header>

        {!data || data.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <p className="text-sm text-ink font-medium mb-1">No disputes</p>
            <p className="text-sm text-ink-subtle">Disputes opened by buyers or sellers will appear here.</p>
          </div>
        ) : (
          <div className="bg-white border border-line rounded-2xl divide-y divide-line overflow-hidden">
            {data.map((d: any) => (
              <Link
                key={d.id}
                href={`/order/${d.order_id}`}
                className="block px-5 py-4 hover:bg-canvas-subtle transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-2xs text-ink-subtle">{d.orders?.order_number}</span>
                      <Badge variant={STATUS_VARIANT[d.status] ?? "secondary"} className="capitalize">
                        {d.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-ink capitalize mb-0.5">
                      {d.reason.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">{d.description}</p>
                    <p className="text-2xs text-ink-subtle mt-2">Opened {formatDate(d.created_at)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-faint mt-1 shrink-0" />
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
