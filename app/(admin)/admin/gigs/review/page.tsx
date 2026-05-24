import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Package } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
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
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Admin</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Gig review queue</h1>
          <p className="text-sm text-ink-subtle mt-1">
            {gigs?.length ?? 0} gig{gigs?.length === 1 ? "" : "s"} awaiting approval
          </p>
        </header>

        {!gigs || gigs.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-sm text-ink font-medium mb-1">Queue is clear</p>
            <p className="text-sm text-ink-subtle">No gigs pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gigs.map((g: any) => (
              <div key={g.id} className="bg-white border border-line rounded-2xl overflow-hidden">
                <div className="p-5 sm:p-6 flex gap-5">
                  <div className="relative w-32 h-20 sm:w-40 sm:h-24 rounded-xl bg-canvas-subtle overflow-hidden shrink-0 border border-line">
                    {g.thumbnail_url && (
                      <Image src={g.thumbnail_url} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/gig/${g.slug}`}
                      target="_blank"
                      className="inline-flex items-start gap-1.5 font-semibold text-ink hover:text-brand-primary-dark transition-colors"
                    >
                      <span className="line-clamp-2">{g.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-ink-faint shrink-0 mt-1" />
                    </Link>
                    <p className="text-xs text-ink-subtle mt-1.5">
                      by{" "}
                      <Link
                        href={`/seller/${g.users?.username}`}
                        className="text-ink-muted hover:text-brand-primary-dark hover:underline"
                      >
                        @{g.users?.username}
                      </Link>
                      {" · "}
                      <span>{g.users?.email}</span>
                    </p>
                    <p className="text-2xs text-ink-subtle mt-0.5">Submitted {formatDate(g.created_at)}</p>
                  </div>
                </div>
                <div
                  className="px-5 sm:px-6 pb-4 text-sm text-ink-muted leading-relaxed line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: g.description.slice(0, 360) }}
                />
                <div className="px-5 sm:px-6 py-4 border-t border-line bg-canvas-subtle">
                  <GigReviewActions gigId={g.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
