import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GigCard, GigCardSkeleton, type GigCardData } from "@/components/gig/gig-card";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const sb = createClient();
  const { data: category } = await sb.from("categories").select("*").eq("slug", params.slug).single();
  if (!category) notFound();

  const { data: subcategories } = await sb
    .from("categories")
    .select("id, name, slug")
    .eq("parent_id", category.id)
    .order("sort_order");

  const { data: gigRows } = await sb
    .from("gigs")
    .select("id, slug, title, thumbnail_url, average_rating, total_reviews, seller_id")
    .eq("category_id", category.id)
    .eq("status", "active")
    .order("total_orders", { ascending: false })
    .limit(24);

  const sellerIds = Array.from(new Set((gigRows ?? []).map((g: any) => g.seller_id)));
  const gigIds = (gigRows ?? []).map((g: any) => g.id);
  const [{ data: users }, { data: profiles }, { data: packages }] = await Promise.all([
    sellerIds.length > 0
      ? sb.from("users").select("id, username, full_name, avatar_url").in("id", sellerIds)
      : Promise.resolve({ data: [] as any[] }),
    sellerIds.length > 0
      ? sb.from("seller_profiles").select("user_id, seller_level").in("user_id", sellerIds)
      : Promise.resolve({ data: [] as any[] }),
    gigIds.length > 0
      ? sb.from("gig_packages").select("gig_id, price").in("gig_id", gigIds)
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

  const gigs: GigCardData[] = (gigRows ?? []).map((g: any) => {
    const u = userById.get(g.seller_id) as any;
    const p = profileById.get(g.seller_id) as any;
    return {
      id: g.id,
      slug: g.slug,
      title: g.title,
      thumbnail_url: g.thumbnail_url,
      average_rating: g.average_rating || 0,
      total_reviews: g.total_reviews || 0,
      starting_price: minPriceByGig.get(g.id) ?? 0,
      seller: {
        username: u?.username ?? "seller",
        full_name: u?.full_name ?? "Seller",
        avatar_url: u?.avatar_url ?? null,
        seller_level: p?.seller_level ?? "new_seller",
      },
    };
  });

  return (
    <>
      <Navbar />
      <main>
        <div className="border-b border-line bg-canvas-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
            <nav aria-label="Breadcrumb" className="text-xs text-ink-subtle mb-3 flex items-center gap-1.5">
              <Link href="/" className="hover:text-ink transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 text-ink-faint" />
              <span className="text-ink-muted">{category.name}</span>
            </nav>
            <h1 className="font-heading text-3xl sm:text-4xl text-ink mb-2 text-balance">{category.name}</h1>
            <p className="text-sm sm:text-base text-ink-muted max-w-2xl leading-relaxed">
              {category.description ?? `Browse ${category.gig_count ?? gigs.length} services in ${category.name}.`}
            </p>
          </div>
        </div>

        {subcategories && subcategories.length > 0 && (
          <div className="border-b border-line bg-white sticky top-16 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {subcategories.map((s) => (
                <Link
                  key={s.id}
                  href={`/category/${s.slug}`}
                  className="whitespace-nowrap inline-flex items-center h-8 px-3 rounded-full bg-white border border-line-strong text-xs font-medium text-ink-muted hover:border-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary-50 transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <p className="text-sm text-ink-subtle mb-5">
            {gigs.length} {gigs.length === 1 ? "service" : "services"} available
          </p>
          {!gigRows || gigRows.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <GigCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {gigs.map((g) => <GigCard key={g.id} gig={g} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
