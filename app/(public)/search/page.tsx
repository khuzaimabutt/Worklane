import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GigCard, type GigCardData } from "@/components/gig/gig-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SortSelect } from "./sort-select";

export const revalidate = 0;

interface SearchParams {
  q?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  delivery_days?: string;
  level?: string | string[];
  rating?: string;
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

function toArray(v?: string | string[]): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

async function searchGigs(params: SearchParams): Promise<{ gigs: GigRow[]; count: number }> {
  try {
    const sb = createClient();
    let query = sb
      .from("gigs")
      .select("id, slug, title, thumbnail_url, average_rating, total_reviews, seller_id, category_id")
      .eq("status", "active");

    if (params.q) query = query.textSearch("search_vector", params.q.split(" ").join(" & "));
    if (params.category) query = query.eq("category_id", params.category);

    const minRating = params.rating ? parseFloat(params.rating) : 0;
    if (minRating > 0) query = query.gte("average_rating", minRating);

    const sort = params.sort ?? "relevance";
    if (sort === "newest") query = query.order("created_at", { ascending: false });
    else if (sort === "rating") query = query.order("average_rating", { ascending: false });
    else if (sort === "best_selling") query = query.order("total_orders", { ascending: false });
    else query = query.order("total_orders", { ascending: false });

    const page = parseInt(params.page ?? "1", 10);
    query = query.range((page - 1) * 24, page * 24 - 1);

    const { data: gigRows, count } = await query;
    if (!gigRows || gigRows.length === 0) return { gigs: [], count: count ?? 0 };

    const sellerIds = Array.from(new Set(gigRows.map((g: any) => g.seller_id)));
    const gigIds = gigRows.map((g: any) => g.id);

    const [{ data: users }, { data: profiles }, { data: packages }] = await Promise.all([
      sb.from("users").select("id, username, full_name, avatar_url").in("id", sellerIds),
      sb.from("seller_profiles").select("user_id, seller_level").in("user_id", sellerIds),
      sb.from("gig_packages").select("gig_id, price, delivery_days").in("gig_id", gigIds),
    ]);

    const userById = new Map((users ?? []).map((u: any) => [u.id, u]));
    const profileById = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const pkgByGig = new Map<string, Array<{ price: number; delivery_days: number }>>();
    for (const p of packages ?? []) {
      const list = pkgByGig.get((p as any).gig_id) ?? [];
      list.push({ price: Number((p as any).price), delivery_days: Number((p as any).delivery_days) });
      pkgByGig.set((p as any).gig_id, list);
    }

    const minPrice = params.min_price ? parseFloat(params.min_price) : null;
    const maxPrice = params.max_price ? parseFloat(params.max_price) : null;
    const maxDelivery = params.delivery_days ? parseInt(params.delivery_days, 10) : null;
    const levels = toArray(params.level);

    const mapped: GigRow[] = gigRows.map((g: any) => {
      const u = userById.get(g.seller_id) as any;
      const p = profileById.get(g.seller_id) as any;
      const pkgs = pkgByGig.get(g.id) ?? [];
      const startingPrice = pkgs.length > 0 ? Math.min(...pkgs.map((x) => x.price)) : 0;
      return {
        ...g,
        starting_price: startingPrice,
        seller: {
          username: u?.username ?? "seller",
          full_name: u?.full_name ?? "Seller",
          avatar_url: u?.avatar_url ?? null,
          seller_level: p?.seller_level ?? "new_seller",
        },
      };
    });

    const filtered = mapped.filter((g) => {
      if (minPrice != null && g.starting_price < minPrice) return false;
      if (maxPrice != null && g.starting_price > maxPrice) return false;
      if (maxDelivery != null) {
        const pkgs = pkgByGig.get(g.id) ?? [];
        if (pkgs.length === 0) return false;
        const minDelivery = Math.min(...pkgs.map((x) => x.delivery_days));
        if (minDelivery > maxDelivery) return false;
      }
      if (levels.length > 0 && !levels.includes(g.seller.seller_level)) return false;
      return true;
    });

    return { gigs: filtered, count: count ?? 0 };
  } catch {
    return { gigs: [], count: 0 };
  }
}

const DELIVERY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "Within 24 hrs" },
  { value: "3", label: "Up to 3 days" },
  { value: "7", label: "Up to 7 days" },
  { value: "14", label: "Up to 14 days" },
];

const LEVEL_OPTIONS = [
  { value: "new_seller", label: "New Seller", dot: "bg-ink-faint" },
  { value: "level_one", label: "Level One", dot: "bg-brand-primary" },
  { value: "level_two", label: "Level Two", dot: "bg-brand-primary-dark" },
  { value: "top_rated", label: "Top Rated", dot: "bg-amber-600" },
];

const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "4.5", label: "4.5 & up" },
  { value: "4.0", label: "4.0 & up" },
  { value: "3.5", label: "3.5 & up" },
];

function countActiveFilters(p: SearchParams) {
  let n = 0;
  if (p.min_price) n++;
  if (p.max_price) n++;
  if (p.delivery_days) n++;
  if (p.rating) n++;
  n += toArray(p.level).length;
  return n;
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { gigs } = await searchGigs(searchParams);
  const q = searchParams.q ?? "";
  const sort = searchParams.sort ?? "relevance";
  const activeCount = countActiveFilters(searchParams);
  const selectedLevels = toArray(searchParams.level);

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
            {activeCount > 0 && (
              <>
                {" · "}
                <Link href={`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`} className="text-brand-primary-dark hover:underline">
                  Clear all filters
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <FilterSidebar searchParams={searchParams} selectedLevels={selectedLevels} />
          </aside>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-line">
              <button
                type="button"
                className="lg:hidden inline-flex items-center gap-2 h-9 px-3 rounded-md border border-line-strong bg-white text-sm font-medium text-ink-muted hover:bg-canvas-subtle"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters{activeCount > 0 && ` (${activeCount})`}
              </button>
              <div className="ml-auto">
                <SortSelect defaultValue={sort} />
              </div>
            </div>

            {activeCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-ink-subtle uppercase tracking-wider font-semibold mr-1">Active</span>
                {(searchParams.min_price || searchParams.max_price) && (
                  <ActiveChip
                    label={`${searchParams.min_price ? `$${searchParams.min_price}` : "Any"} – ${searchParams.max_price ? `$${searchParams.max_price}` : "Any"}`}
                    removeUrl={buildRemoveUrl(searchParams, ["min_price", "max_price"])}
                  />
                )}
                {searchParams.delivery_days && (
                  <ActiveChip
                    label={DELIVERY_OPTIONS.find((d) => d.value === searchParams.delivery_days)?.label ?? `${searchParams.delivery_days} days`}
                    removeUrl={buildRemoveUrl(searchParams, ["delivery_days"])}
                  />
                )}
                {selectedLevels.map((lv) => (
                  <ActiveChip
                    key={lv}
                    label={LEVEL_OPTIONS.find((l) => l.value === lv)?.label ?? lv}
                    removeUrl={buildRemoveUrl(searchParams, [], { level: selectedLevels.filter((x) => x !== lv) })}
                  />
                ))}
                {searchParams.rating && (
                  <ActiveChip
                    label={RATING_OPTIONS.find((r) => r.value === searchParams.rating)?.label ?? searchParams.rating}
                    removeUrl={buildRemoveUrl(searchParams, ["rating"])}
                  />
                )}
              </div>
            )}

            {gigs.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="w-16 h-16" />}
                title="No results found"
                description={
                  activeCount > 0
                    ? "Try removing some filters, or broaden your search."
                    : `We couldn't find any services matching "${q}". Try a different search or browse categories.`
                }
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

function buildRemoveUrl(
  current: SearchParams,
  removeKeys: string[],
  overrides: Partial<Record<string, string | string[]>> = {}
): string {
  const params = new URLSearchParams();
  const entries: Array<[string, string | string[] | undefined]> = [
    ["q", current.q],
    ["category", current.category],
    ["sort", current.sort],
    ["min_price", current.min_price],
    ["max_price", current.max_price],
    ["delivery_days", current.delivery_days],
    ["rating", current.rating],
    ["level", current.level],
  ];
  for (const [k, v] of entries) {
    if (removeKeys.includes(k)) continue;
    if (k in overrides) continue;
    if (v == null || v === "") continue;
    if (Array.isArray(v)) v.forEach((vv) => params.append(k, vv));
    else params.append(k, v);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((vv) => params.append(k, vv));
    else params.append(k, v);
  }
  const qs = params.toString();
  return `/search${qs ? `?${qs}` : ""}`;
}

function ActiveChip({ label, removeUrl }: { label: string; removeUrl: string }) {
  return (
    <Link
      href={removeUrl}
      className="inline-flex items-center gap-1 h-7 pl-3 pr-2 rounded-full bg-brand-primary-50 border border-brand-primary/20 text-xs font-medium text-brand-primary-dark hover:bg-brand-primary/15 transition-colors"
    >
      <span>{label}</span>
      <X className="w-3 h-3" />
    </Link>
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

function FilterSidebar({
  searchParams,
  selectedLevels,
}: {
  searchParams: SearchParams;
  selectedLevels: string[];
}) {
  const q = searchParams.q ?? "";
  const category = searchParams.category ?? "";
  const sort = searchParams.sort ?? "";
  const selectedDelivery = searchParams.delivery_days ?? "";
  const selectedRating = searchParams.rating ?? "";

  const clearHref = q ? `/search?q=${encodeURIComponent(q)}` : "/search";

  return (
    <form method="get" action="/search" className="bg-white border border-line rounded-xl p-5">
      {q && <input type="hidden" name="q" value={q} />}
      {category && <input type="hidden" name="category" value={category} />}
      {sort && <input type="hidden" name="sort" value={sort} />}

      <FilterSection title="Price range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="min_price"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            defaultValue={searchParams.min_price ?? ""}
            className="min-w-0 flex-1 h-9 px-3 bg-white border border-line-strong rounded-md text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
          <span className="shrink-0 text-ink-faint">–</span>
          <input
            type="number"
            name="max_price"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            defaultValue={searchParams.max_price ?? ""}
            className="min-w-0 flex-1 h-9 px-3 bg-white border border-line-strong rounded-md text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
      </FilterSection>

      <FilterSection title="Delivery time">
        <div className="space-y-2 text-sm">
          {DELIVERY_OPTIONS.map((opt) => (
            <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer text-ink-muted hover:text-ink">
              <input
                type="radio"
                name="delivery_days"
                value={opt.value}
                defaultChecked={selectedDelivery === opt.value}
                className="w-4 h-4 accent-brand-primary"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Seller level">
        <div className="space-y-2 text-sm">
          {LEVEL_OPTIONS.map((l) => (
            <label key={l.value} className="flex items-center gap-2.5 cursor-pointer text-ink-muted hover:text-ink">
              <input
                type="checkbox"
                name="level"
                value={l.value}
                defaultChecked={selectedLevels.includes(l.value)}
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
          {RATING_OPTIONS.map((opt) => (
            <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer text-ink-muted hover:text-ink">
              <input
                type="radio"
                name="rating"
                value={opt.value}
                defaultChecked={selectedRating === opt.value}
                className="w-4 h-4 accent-brand-primary"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <div className="pt-4 border-t border-line flex gap-2">
        <button
          type="submit"
          className="flex-1 h-10 inline-flex items-center justify-center bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-brand-primary-dark transition-colors"
        >
          Apply
        </button>
        <Link
          href={clearHref}
          className="h-10 px-4 inline-flex items-center justify-center bg-white border border-line-strong text-ink-muted rounded-md text-sm font-medium hover:bg-canvas-subtle transition-colors"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
