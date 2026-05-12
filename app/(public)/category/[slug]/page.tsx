import { notFound } from "next/navigation";
import Link from "next/link";
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

  const { data: gigs } = await sb
    .from("gigs")
    .select("id, slug, title, thumbnail_url, average_rating, total_reviews")
    .eq("category_id", category.id)
    .eq("status", "active")
    .order("total_orders", { ascending: false })
    .limit(24);

  return (
    <>
      <Navbar />
      <main>
        <div className="bg-neutral-50 border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <p className="text-xs text-neutral-500 mb-2">
              <Link href="/" className="hover:text-brand-primary">Home</Link>
              {" › "}
              <span className="text-neutral-700">{category.name}</span>
            </p>
            <h1 className="font-heading text-4xl mb-2">{category.name}</h1>
            <p className="text-neutral-600 max-w-2xl">
              {category.description ?? `Browse ${category.gig_count} services in ${category.name}.`}
            </p>
          </div>
        </div>

        {subcategories && subcategories.length > 0 && (
          <div className="border-b border-neutral-200 bg-white sticky top-16 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {subcategories.map((s) => (
                <Link
                  key={s.id}
                  href={`/category/${s.slug}`}
                  className="whitespace-nowrap text-sm px-4 py-1.5 rounded-full border border-neutral-200 hover:border-brand-primary hover:text-brand-primary transition"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {!gigs || gigs.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <GigCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gigs.map((g) => {
                const card: GigCardData = {
                  id: g.id,
                  slug: g.slug,
                  title: g.title,
                  thumbnail_url: g.thumbnail_url,
                  average_rating: g.average_rating || 0,
                  total_reviews: g.total_reviews || 0,
                  starting_price: 50,
                  seller: { username: "seller", full_name: "Seller", avatar_url: null, seller_level: "new_seller" },
                };
                return <GigCard key={g.id} gig={card} />;
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
