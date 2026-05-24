import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus, Eye, MousePointerClick, ShoppingBag, Package } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info"> = {
  active: "success",
  pending_approval: "warning",
  paused: "secondary",
  draft: "secondary",
  rejected: "error",
};

export default async function SellerGigsPage() {
  const sb = createClient();
  const { data: { user: au } } = await sb.auth.getUser();
  if (!au) redirect("/login");

  const { data: gigs } = await sb
    .from("gigs")
    .select("id, slug, title, status, thumbnail_url, total_orders, impressions, clicks, average_rating")
    .eq("seller_id", au.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Seller</p>
            <h1 className="font-heading text-2xl sm:text-3xl text-ink">Your gigs</h1>
            <p className="text-sm text-ink-subtle mt-1">{gigs?.length ?? 0} total</p>
          </div>
          <Link
            href="/seller/gigs/create"
            className="inline-flex h-10 px-4 items-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create gig
          </Link>
        </header>

        {!gigs || gigs.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-sm text-ink font-medium mb-1">No gigs yet</p>
            <p className="text-sm text-ink-subtle mb-5">Publish your first gig to start receiving orders.</p>
            <Link href="/seller/gigs/create" className="btn-primary">Create your first gig</Link>
          </div>
        ) : (
          <div className="bg-white border border-line rounded-2xl divide-y divide-line overflow-hidden">
            {gigs.map((g) => (
              <div key={g.id} className="px-5 py-4 flex items-center gap-4 hover:bg-canvas-subtle transition-colors">
                <div className="w-20 h-12 rounded-lg bg-canvas-subtle overflow-hidden relative shrink-0 border border-line">
                  {g.thumbnail_url && (
                    <Image src={g.thumbnail_url} alt="" fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/gig/${g.slug}`}
                    className="font-medium text-ink truncate block hover:text-brand-primary-dark transition-colors"
                  >
                    {g.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-ink-subtle mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {(g.impressions ?? 0).toLocaleString()} impressions
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MousePointerClick className="w-3 h-3" />
                      {(g.clicks ?? 0).toLocaleString()} clicks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      {(g.total_orders ?? 0).toLocaleString()} orders
                    </span>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[g.status] || "secondary"} className="capitalize shrink-0">
                  {g.status.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
