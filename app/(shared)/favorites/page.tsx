import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart, Search as SearchIcon } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GigCard, type GigCardData } from "@/components/gig/gig-card";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function FavoritesPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?redirect=/favorites");

  const { data: favRows } = await sb
    .from("favorites")
    .select("gig_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const gigIds = (favRows ?? []).map((f) => f.gig_id);

  let gigs: GigCardData[] = [];
  if (gigIds.length > 0) {
    const { data: gigRows } = await sb
      .from("gigs")
      .select("id, slug, title, thumbnail_url, average_rating, total_reviews, seller_id, status")
      .in("id", gigIds);

    const liveGigs = (gigRows ?? []).filter((g: any) => g.status === "active");
    const sellerIds = Array.from(new Set(liveGigs.map((g: any) => g.seller_id)));
    const liveIds = liveGigs.map((g: any) => g.id);

    const [{ data: users }, { data: profiles }, { data: packages }] = await Promise.all([
      sellerIds.length
        ? sb.from("users").select("id, username, full_name, avatar_url").in("id", sellerIds)
        : Promise.resolve({ data: [] as any[] }),
      sellerIds.length
        ? sb.from("seller_profiles").select("user_id, seller_level").in("user_id", sellerIds)
        : Promise.resolve({ data: [] as any[] }),
      liveIds.length
        ? sb.from("gig_packages").select("gig_id, price").in("gig_id", liveIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const userById = new Map((users ?? []).map((u: any) => [u.id, u]));
    const profileById = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const minPriceByGig = new Map<string, number>();
    for (const p of packages ?? []) {
      const cur = minPriceByGig.get((p as any).gig_id);
      const price = Number((p as any).price);
      if (cur == null || price < cur) minPriceByGig.set((p as any).gig_id, price);
    }

    // Re-sort by original favorite order (most recently saved first)
    const orderIndex = new Map(gigIds.map((id, i) => [id, i]));
    gigs = liveGigs
      .map((g: any) => {
        const u = userById.get(g.seller_id) as any;
        const p = profileById.get(g.seller_id) as any;
        return {
          id: g.id,
          slug: g.slug,
          title: g.title,
          thumbnail_url: g.thumbnail_url,
          average_rating: g.average_rating ?? 0,
          total_reviews: g.total_reviews ?? 0,
          starting_price: minPriceByGig.get(g.id) ?? 0,
          seller: {
            username: u?.username ?? "seller",
            full_name: u?.full_name ?? "Seller",
            avatar_url: u?.avatar_url ?? null,
            seller_level: p?.seller_level ?? "new_seller",
          },
        };
      })
      .sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">My account</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Saved gigs</h1>
          <p className="text-sm text-ink-subtle mt-1">
            {gigs.length === 0
              ? "Tap the heart on any gig to save it for later."
              : `${gigs.length} ${gigs.length === 1 ? "gig" : "gigs"} saved`}
          </p>
        </header>

        {gigs.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <p className="text-sm text-ink font-medium mb-1">No saved gigs yet</p>
            <p className="text-sm text-ink-subtle mb-5">
              Browse services and tap the heart on any gig to save it here.
            </p>
            <Link href="/search" className="btn-primary">
              <SearchIcon className="w-4 h-4" />
              Browse services
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} initialFavorited />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
