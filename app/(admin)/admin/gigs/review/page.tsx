import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { GigReviewActions } from "@/components/admin/gig-review-actions";
import { formatDate } from "@/lib/utils/format";

export default async function AdminGigsReviewPage() {
  const sb = createClient();
  const { data: gigs } = await sb
    .from("gigs")
    .select("*, users(full_name, username, email)")
    .eq("status", "pending_approval")
    .order("created_at");

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl mb-6">Gig Review Queue</h1>
        {!gigs || gigs.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
            <p className="text-neutral-500">No gigs pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gigs.map((g: any) => (
              <div key={g.id} className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="flex gap-4 mb-4">
                  <div className="relative w-32 h-20 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                    {g.thumbnail_url && <Image src={g.thumbnail_url} alt="" fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/gig/${g.slug}`} target="_blank" className="font-medium hover:text-brand-primary">
                      {g.title}
                    </Link>
                    <p className="text-sm text-neutral-500 mt-1">by @{g.users?.username}</p>
                    <p className="text-xs text-neutral-500 mt-1">Submitted {formatDate(g.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-700 line-clamp-3 mb-4" dangerouslySetInnerHTML={{ __html: g.description.slice(0, 300) }} />
                <GigReviewActions gigId={g.id} />
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
