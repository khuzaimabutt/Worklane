import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils/format";

export default async function SellerGigsPage() {
  const sb = createClient();
  const { data: { user: au } } = await sb.auth.getUser();
  if (!au) redirect("/login");

  const { data: gigs } = await sb
    .from("gigs")
    .select("id, slug, title, status, thumbnail_url, total_orders, impressions, clicks, average_rating")
    .eq("seller_id", au.id)
    .order("created_at", { ascending: false });

  const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "error" | "secondary"> = {
    active: "success",
    pending_approval: "warning",
    paused: "secondary",
    draft: "secondary",
    rejected: "error",
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-3xl">Your Gigs</h1>
          <Link href="/seller/gigs/create">
            <Button variant="cta">
              <Plus className="w-4 h-4" /> Create New Gig
            </Button>
          </Link>
        </div>

        {!gigs || gigs.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
            <p className="text-neutral-500 mb-4">You haven&apos;t created any gigs yet.</p>
            <Link href="/seller/gigs/create"><Button variant="cta">Create Your First Gig</Button></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {gigs.map((g) => (
              <div key={g.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden relative shrink-0">
                  {g.thumbnail_url && <Image src={g.thumbnail_url} alt="" fill className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/gig/${g.slug}`} className="font-medium hover:text-brand-primary truncate block">
                    {g.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                    <span>{g.impressions} impressions</span>
                    <span>{g.clicks} clicks</span>
                    <span>{g.total_orders} orders</span>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[g.status] || "secondary"} className="capitalize">
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
