import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GigCard, GigCardSkeleton, type GigCardData } from "@/components/gig/gig-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Search as SearchIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

interface SearchParams {
  q?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  delivery_days?: string;
  level?: string;
  sort?: string;
  page?: string;
}

async function searchGigs(params: SearchParams) {
  try {
    const sb = createClient();
    let query = sb
      .from("gigs")
      .select("id, slug, title, thumbnail_url, average_rating, total_reviews, seller_id, category_id")
      .eq("status", "active");

    if (params.q) query = query.textSearch("search_vector", params.q.split(" ").join(" & "));
    if (params.category) query = query.eq("category_id", params.category);

    const sort = params.sort ?? "relevance";
    if (sort === "newest") query = query.order("created_at", { ascending: false });
    else if (sort === "rating") query = query.order("average_rating", { ascending: false });
    else if (sort === "best_selling") query = query.order("total_orders", { ascending: false });
    else query = query.order("total_orders", { ascending: false });

    const page = parseInt(params.page ?? "1", 10);
    query = query.range((page - 1) * 12, page * 12 - 1);

    const { data, count } = await query;
    return { gigs: data ?? [], count: count ?? 0 };
  } catch {
    return { gigs: [], count: 0 };
  }
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { gigs } = await searchGigs(searchParams);
  const q = searchParams.q ?? "";

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl mb-1">
            {q ? `Results for "${q}"` : "Browse all services"}
          </h1>
          <p className="text-sm text-neutral-500">{gigs.length} services found</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <FilterSidebar />
          </aside>

          <div className="lg:col-span-3">
            {gigs.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="w-16 h-16" />}
                title="No results found"
                description={`We couldn't find any gigs matching "${q}". Try a different search or browse categories.`}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gigs.map((g: any) => {
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
        </div>
      </main>
      <Footer />
    </>
  );
}

function FilterSidebar() {
  return (
    <div className="space-y-6 bg-white border border-neutral-200 rounded-xl p-5">
      <div>
        <h3 className="font-semibold text-sm mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input placeholder="Min" className="flex-1 px-3 py-1.5 border border-neutral-300 rounded text-sm" />
          <span>—</span>
          <input placeholder="Max" className="flex-1 px-3 py-1.5 border border-neutral-300 rounded text-sm" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">Delivery Time</h3>
        <div className="space-y-1.5 text-sm">
          {["Any", "Within 24 hrs", "Up to 3 days", "Up to 7 days", "Up to 14 days"].map((label) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="delivery" className="text-brand-primary" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">Seller Level</h3>
        <div className="space-y-1.5 text-sm">
          {[
            { label: "New Seller", color: "#6B7280" },
            { label: "Level One", color: "#3B82F6" },
            { label: "Level Two", color: "#8B5CF6" },
            { label: "Top Rated", color: "#F59E0B" },
          ].map((l) => (
            <label key={l.label} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="text-brand-primary" />
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span>{l.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-3">Minimum Rating</h3>
        <div className="space-y-1.5 text-sm">
          {["Any rating", "4.5 & up", "4.0 & up", "3.5 & up"].map((label) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="rating" className="text-brand-primary" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <button className="w-full btn-primary text-sm">Apply Filters</button>
    </div>
  );
}
