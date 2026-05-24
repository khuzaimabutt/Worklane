import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GigCard, type GigCardData } from "@/components/gig/gig-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
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

type GigRow = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  seller_id: string;
  category_id: string;
  starting_price: number;
  seller: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    seller_level: "new_seller" | "level_one" | "level_two" | "top_rated";
  };
};

async function searchGigs(params: SearchParams): Promise<{ gigs: GigRow[]; count: number }> {
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

    const { data: gigRows, count } = await query;
    if (!gigRows || gigRows.length === 0) return { gigs: [], count: count ?? 0 };

    const sellerIds = Array.from(new Set(gigRows.map((g: any) => g.seller_id)));
    const gigIds = gigRows.map((g: any) => g.id);

    const [{ data: users }, { data: profiles }, { data: packages }] = await Promise.all([
      sb.from("users").select("id, username, full_name, avatar_url").in("id", sellerIds),
      sb.from("seller_profiles").select("user_id, seller_level").in("user_id", sellerIds),
      sb.from("gig_packages").select("gig_id, price").in("gig_id", gigIds),
    ]);

    const userById = new Map((users ?? []).map((u: any) => [u.id, u]));
    const profileById = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const minPriceByGig = new Map<string, number>();
    for (const p of packages ?? []) {
      const cur = minPriceByGig.get((p as any).gig_id);
      const price = Number((p as any).price);
      if (cur == null || price < cur) minPriceByGig.set((p as any).gig_id, price);
    }

    const gigs: GigRow[] = gigRows.map((g: any) => {
      const u = userById.get(g.seller_id) as any;
      const p = profileById.get(g.seller_id) as any;
      return {
        ...g,
        starting_price: minPriceByGig.get(g.id) ?? 0,
        seller: {
          username: u?.username ?? "seller",
          full_name: u?.full_name ?? "Seller",
          avatar_url: u?.avatar_url ?? null,
          seller_level: p?.seller_level ?? "new_seller",
        },
      };
    });

    return { gigs, count: count ?? 0 };
  } catch {
    return { gigs: [], count: 0 };
  }
}

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "best_selling", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top rated" },
];

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { gigs } = await searchGigs(searchParams);
  const q = searchParams.q ?? "";
  const sort = searchParams.sort ?? "relevance";

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl sm:text-3xl text-ink mb-1">
            {q ? `Results for "${q}"` : "Browse all services"}
          </h1>
          <p className="text-sm text-ink-subtle">
            {gigs.length} {gigs.length === 1 ? "service" : "services"} available
          </p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <FilterSidebar />
          </aside>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-line">
              <button
                className="lg:hidden inline-flex items-center gap-2 h-9 px-3 rounded-md border border-line-strong bg-white text-sm font-medium text-ink-muted hover:bg-canvas-subtle"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <label htmlFor="sort" className="text-sm text-ink-subtle">Sort by</label>
                <select
                  id="sort"
                  defaultValue={sort}
                  className="h-9 pl-3 pr-8 bg-white border border-line-strong rounded-md text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {gigs.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="w-16 h-16" />}
                title="No results found"
                description={`We couldn't find any services matching "${q}". Try a different search or browse categories.`}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {gigs.map((g) => {
                  const card: GigCardData = {
                    id: g.id,
                    slug: g.slug,
                    title: g.title,
                    thumbnail_url: g.thumbnail_url,
                    average_rating: g.average_rating ?? 0,
                    total_reviews: g.total_reviews ?? 0,
                    starting_price: g.starting_price,
                    seller: g.seller,
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

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-t border-line first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function FilterSidebar() {
  return (
    <div className="bg-white border border-line rounded-xl p-5">
      <FilterSection title="Price range">
        <div className="flex items-center gap-2">
          <input
            placeholder="Min"
            inputMode="numeric"
            className="min-w-0 flex-1 h-9 px-3 bg-white border border-line-strong rounded-md text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
          <span className="shrink-0 text-ink-faint">–</span>
          <input
            placeholder="Max"
            inputMode="numeric"
            className="min-w-0 flex-1 h-9 px-3 bg-white border border-line-strong rounded-md text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
      </FilterSection>

      <FilterSection title="Delivery time">
        <div className="space-y-2 text-sm">
          {["Any", "Within 24 hrs", "Up to 3 days", "Up to 7 days", "Up to 14 days"].map((label) => (
            <label key={label} className="flex items-center gap-2.5 cursor-pointer text-ink-muted hover:text-ink">
              <input
                type="radio"
                name="delivery"
                className="w-4 h-4 accent-brand-primary"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Seller level">
        <div className="space-y-2 text-sm">
          {[
            { label: "New Seller", dot: "bg-ink-faint" },
            { label: "Level One", dot: "bg-brand-primary" },
            { label: "Level Two", dot: "bg-brand-primary-dark" },
            { label: "Top Rated", dot: "bg-amber-600" },
          ].map((l) => (
            <label key={l.label} className="flex items-center gap-2.5 cursor-pointer text-ink-muted hover:text-ink">
              <input
                type="checkbox"
                className="w-4 h-4 accent-brand-primary"
              />
              <span className={`inline-block w-2 h-2 rounded-full ${l.dot}`} />
              <span>{l.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Minimum rating">
        <div className="space-y-2 text-sm">
          {["Any rating", "4.5 & up", "4.0 & up", "3.5 & up"].map((label) => (
            <label key={label} className="flex items-center gap-2.5 cursor-pointer text-ink-muted hover:text-ink">
              <input
                type="radio"
                name="rating"
                className="w-4 h-4 accent-brand-primary"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <div className="pt-4 border-t border-line flex gap-2">
        <button className="flex-1 h-10 inline-flex items-center justify-center bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-brand-primary-dark transition-colors">
          Apply
        </button>
        <button className="h-10 px-4 inline-flex items-center justify-center bg-white border border-line-strong text-ink-muted rounded-md text-sm font-medium hover:bg-canvas-subtle transition-colors">
          Clear
        </button>
      </div>
    </div>
  );
}
