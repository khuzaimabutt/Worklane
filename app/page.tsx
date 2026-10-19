import Link from "next/link";
import {
  Globe,
  Smartphone,
  Palette,
  Bot,
  TrendingUp,
  Briefcase,
  ShieldCheck,
  Clock,
  ArrowRight,
  Search as SearchIcon,
  MessageSquare,
  PackageCheck,
  FlaskConical,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GigCard, GigCardSkeleton, type GigCardData } from "@/components/gig/gig-card";
import { SellerCard } from "@/components/seller/seller-card";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { createClient } from "@/lib/supabase/server";
import { CategoryCard, type CategoryCardData } from "@/components/home/category-card";
import { Reveal } from "@/components/home/reveal";
import { CountUp } from "@/components/home/count-up";
import { OrderSteps } from "@/components/home/order-steps";

export const revalidate = 3600;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Smartphone, Palette, Bot, TrendingUp, Briefcase,
};

type FeaturedGig = GigCardData;

type TopSeller = {
  username: string;
  full_name: string;
  avatar_url: string | null;
  seller_level: "new_seller" | "level_one" | "level_two" | "top_rated";
  rating: number;
  total_orders: number;
  tagline: string | null;
};

const LEADING_VERBS = /^(build|create|design|develop|write|make|code|do|set up|setup|deliver|provide|integrate|convert|turn|fix|launch|be|craft|add|automate|optimize|optimise)\s+/i;
const LEADING_ARTICLES = /^(a|an|the)\s+/i;

/** "I will build a Flutter cross-platform mobile app" becomes "Flutter cross-platform mobile app". Words are only removed, never added. */
function shortenTitle(title: string): string {
  let t = title.trim().replace(/^i\s+will\s+/i, "").replace(LEADING_VERBS, "");
  let prev = "";
  while (prev !== t) {
    prev = t;
    t = t.replace(LEADING_ARTICLES, "");
  }
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

async function loadHomeData() {
  try {
    const sb = createClient();
    const [{ data: parentCategories }, { count: activeGigs }, { count: verifiedSellers }] = await Promise.all([
      sb.from("categories").select("*").is("parent_id", null).order("sort_order"),
      sb.from("gigs").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("users").select("id", { count: "exact", head: true }).eq("is_seller", true),
    ]);

    const [{ data: subCategories }, { data: activeRows }] = await Promise.all([
      sb.from("categories").select("id, name, parent_id, sort_order, is_active").not("parent_id", "is", null).order("sort_order"),
      sb
        .from("gigs")
        .select("id, title, category_id")
        .eq("status", "active")
        .order("total_orders", { ascending: false })
        .order("title"),
    ]);

    const { data: gigRows } = await sb
      .from("gigs")
      .select("id, slug, title, thumbnail_url, average_rating, total_reviews, seller_id")
      .eq("status", "active")
      .order("total_orders", { ascending: false })
      .limit(8);

    const { data: topSellerRows } = await sb
      .from("seller_profiles")
      .select("user_id, seller_level, average_rating, total_orders_completed, tagline")
      .order("average_rating", { ascending: false })
      .limit(4);

    const sellerIdsForGigs = Array.from(new Set((gigRows ?? []).map((g: any) => g.seller_id)));
    const sellerIdsForTop = (topSellerRows ?? []).map((s: any) => s.user_id);
    const allSellerIds = Array.from(new Set([...sellerIdsForGigs, ...sellerIdsForTop]));
    const activeGigIds = (activeRows ?? []).map((g: any) => g.id);

    const [{ data: users }, { data: profiles }, { data: packages }] = await Promise.all([
      allSellerIds.length > 0
        ? sb.from("users").select("id, username, full_name, avatar_url").in("id", allSellerIds)
        : Promise.resolve({ data: [] as any[] }),
      sellerIdsForGigs.length > 0
        ? sb.from("seller_profiles").select("user_id, seller_level").in("user_id", sellerIdsForGigs)
        : Promise.resolve({ data: [] as any[] }),
      activeGigIds.length > 0
        ? sb.from("gig_packages").select("gig_id, price").in("gig_id", activeGigIds)
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

    // Per-category numbers, all from the database: active gig count, cheapest package, example chips.
    const parentOf = new Map<string, string>();
    for (const sc of subCategories ?? []) parentOf.set((sc as any).id, (sc as any).parent_id);
    const topIdOf = (id: string) => parentOf.get(id) ?? id;
    const countByCat = new Map<string, number>();
    const minPriceByCat = new Map<string, number>();
    const titlesByCat = new Map<string, string[]>();
    for (const g of activeRows ?? []) {
      const cid = topIdOf((g as any).category_id);
      countByCat.set(cid, (countByCat.get(cid) ?? 0) + 1);
      const gp = minPriceByGig.get((g as any).id);
      if (gp != null) minPriceByCat.set(cid, Math.min(minPriceByCat.get(cid) ?? Infinity, gp));
      titlesByCat.set(cid, [...(titlesByCat.get(cid) ?? []), (g as any).title]);
    }
    const categoryCards: CategoryCardData[] = (parentCategories ?? []).map((c: any) => {
      const subs = (subCategories ?? [])
        .filter((sc: any) => sc.parent_id === c.id && sc.is_active !== false)
        .slice(0, 3)
        .map((sc: any) => sc.name as string);
      const examples = (titlesByCat.get(c.id) ?? []).map(shortenTitle).filter(Boolean).slice(0, 2);
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        count: countByCat.get(c.id) ?? 0,
        minPrice: minPriceByCat.get(c.id) ?? null,
        chips: [...subs, ...examples.filter((e) => !subs.includes(e))].slice(0, 3),
      };
    });

    const featuredGigs: FeaturedGig[] = (gigRows ?? []).map((g: any) => {
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
    });

    const topSellers: TopSeller[] = (topSellerRows ?? []).map((s: any) => {
      const u = userById.get(s.user_id) as any;
      return {
        username: u?.username ?? s.user_id,
        full_name: u?.full_name ?? "Top Seller",
        avatar_url: u?.avatar_url ?? null,
        seller_level: s.seller_level,
        rating: s.average_rating ?? 0,
        total_orders: s.total_orders_completed ?? 0,
        tagline: s.tagline ?? null,
      };
    });

    return {
      categories: parentCategories ?? [],
      categoryCards,
      activeGigs: activeGigs ?? 0,
      verifiedSellers: verifiedSellers ?? 0,
      featuredGigs,
      topSellers,
    };
  } catch {
    return { categories: [], categoryCards: [] as CategoryCardData[], activeGigs: 0, verifiedSellers: 0, featuredGigs: [], topSellers: [] };
  }
}

export default async function HomePage() {
  const data = await loadHomeData();
  const heroGigs = data.featuredGigs.filter((g) => g.thumbnail_url).slice(0, 3);

  return (
    <>
      <Navbar />
      <main id="main">
        <section className="hero-bg grain border-b border-line overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-14 sm:pt-20 sm:pb-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="eyebrow rise mb-5">
                <span className="w-6 h-px bg-brand-primary" aria-hidden />
                A marketplace for focused, scoped work
              </p>
              <h1 className="font-heading text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.5rem] text-ink mb-6 text-balance rise rise-1">
                Hire the specialist.{" "}
                <span className="italic-accent">Skip the guesswork.</span>
              </h1>
              <p className="text-ink-muted text-base sm:text-lg mb-8 max-w-xl leading-relaxed text-pretty rise rise-2">
                Fixed-scope services with packages, delivery dates and revisions agreed before you pay.
                Message the seller, accept an offer and track the order in one place.
              </p>
              <div className="max-w-xl mb-6 rise rise-3">
                <SearchAutocomplete size="lg" placeholder="Try landing page, logo or chatbot" />
              </div>
              <div className="flex flex-wrap items-center gap-2 rise rise-3">
                <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-subtle mr-1">Popular</span>
                {["Web Design", "Logo Design", "Bubble.io", "React Native", "AI Integration"].map((t) => (
                  <Link
                    key={t}
                    href={`/search?q=${encodeURIComponent(t)}`}
                    className="inline-flex items-center h-8 px-3.5 rounded-full bg-white/80 border border-line-strong text-xs font-medium text-ink-muted hover:border-ink hover:text-ink hover:bg-white transition-colors"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>

            {heroGigs.length > 0 && (
              <div className="relative hidden sm:block h-[420px] lg:h-[480px]" aria-hidden>
                {heroGigs.map((g, i) => (
                  <div
                    key={g.id}
                    className={[
                      "fan-card absolute w-[62%] rounded-2xl bg-white p-1.5 shadow-card-hover border border-line",
                      i === 0 ? "left-0 top-6 z-10" : "",
                      i === 1 ? "right-0 top-0 z-20" : "",
                      i === 2 ? "left-[18%] bottom-0 z-30" : "",
                    ].join(" ")}
                    style={
                      {
                        "--r": ["-3deg", "2deg", "1deg"][i],
                        "--fx": ["-48px", "48px", "0px"][i],
                        "--fy": ["24px", "-24px", "48px"][i],
                        "--d": `${0.15 + i * 0.14}s`,
                        "--fd": `${i * 1.3}s`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-canvas">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.thumbnail_url as string} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-2 py-2.5">
                      <span className="text-xs font-medium text-ink truncate">{g.seller.full_name}</span>
                      <span className="font-display text-base text-ink tabular-nums shrink-0">
                        from ${Math.round(g.starting_price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-line bg-white/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 lg:gap-x-10">
                <Assurance icon={<ShieldCheck className="w-5 h-5" />} label="Funds held until delivery" />
                <Assurance icon={<Clock className="w-5 h-5" />} label="Delivery date per package" />
                <div className="col-span-2 sm:col-span-1">
                  <Assurance icon={<MessageSquare className="w-5 h-5" />} label="Custom offers in chat" />
                </div>
              </div>
              <p className="inline-flex items-center gap-2 self-start lg:self-auto rounded-full border border-brand-accent/30 bg-brand-accent-50 px-3.5 py-2 text-xs sm:text-sm font-medium text-brand-accent-dark">
                <FlaskConical className="w-4 h-4 shrink-0" aria-hidden />
                Demo marketplace: test payments, sample prices
              </p>
            </div>
          </div>
        </section>

        {data.categoryCards.length > 0 && (
          <section className="py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <SectionHead
                eyebrow="Categories"
                title="Explore by discipline"
                sub={
                  <>
                    <CountUp value={data.categoryCards.length} /> categories,{" "}
                    <CountUp value={data.activeGigs} /> active services
                    {data.verifiedSellers > 0 && (
                      <>
                        {" "}from <CountUp value={data.verifiedSellers} /> sellers
                      </>
                    )}
                    . Prices shown are sample prices for this demo.
                  </>
                }
                link={{ href: "/search", label: "Browse all services" }}
              />
              <ul className="cat-row -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 sm:overflow-visible">
                {data.categoryCards.map((cat, i) => {
                  const src = data.categories.find((c: any) => c.id === cat.id) as any;
                  const Icon = ICON_MAP[src?.icon_name] || Globe;
                  return (
                    <Reveal
                      as="li"
                      key={cat.id}
                      delay={(i % 3) * 70}
                      className="w-[82%] max-w-[22rem] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink"
                    >
                      <CategoryCard cat={cat} Icon={Icon} />
                    </Reveal>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        <section className="py-16 sm:py-24 border-t border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHead eyebrow="Most ordered" title="Popular right now" link={{ href: "/search?sort=best_selling", label: "See all" }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {data.featuredGigs.length === 0
                ? Array.from({ length: 4 }).map((_, i) => <GigCardSkeleton key={i} />)
                : data.featuredGigs.map((g) => <GigCard key={g.id} gig={g} />)}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHead eyebrow="How an order moves" title="Four steps, one lane" link={{ href: "/how-it-works", label: "How it works" }} />
            <OrderSteps steps={STEPS} />
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-ink text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center">
            <div>
              <p className="eyebrow !text-[#9FD3C1] mb-4">
                <span className="w-6 h-px bg-[#9FD3C1]" aria-hidden />
                Pricing
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl !text-white mb-4 text-balance leading-tight">
                Transparent fees. No surprises at checkout.
              </h2>
              <p className="text-white/75 text-base leading-relaxed max-w-md">
                What a buyer pays and what a seller keeps on a $100 order. The same breakdown appears on every checkout summary.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FeeCard
                title="Buyer pays"
                base="on a $100 order"
                paid="$105.50"
                breakdown={[
                  { label: "Service", amount: "$100.00" },
                  { label: "Service fee (5.5%)", amount: "$5.50" },
                ]}
              />
              <FeeCard
                title="Seller receives"
                base="from the same order"
                paid="$80.00"
                breakdown={[
                  { label: "Order amount", amount: "$100.00" },
                  { label: "Commission (20%)", amount: "-$20.00" },
                ]}
              />
            </div>
          </div>
        </section>

        {data.topSellers.length > 0 && (
          <section className="py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <SectionHead eyebrow="Sellers" title="Highest rated sellers" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {data.topSellers.map((s) => (
                  <SellerCard
                    key={s.username}
                    username={s.username}
                    fullName={s.full_name}
                    avatarUrl={s.avatar_url}
                    level={s.seller_level}
                    rating={s.rating}
                    totalOrders={s.total_orders}
                    tagline={s.tagline}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-brand-primary text-white px-6 sm:px-12 py-12 sm:py-16 grid md:grid-cols-[1fr_auto] gap-8 items-end">
              <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                aria-hidden
                style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px)", backgroundSize: "96px 100%" }}
              />
              <div className="relative max-w-2xl">
                <p className="eyebrow !text-white/80 mb-4">
                  <span className="w-6 h-px bg-white/70" aria-hidden />
                  Start selling
                </p>
                <h2 className="font-heading text-3xl sm:text-5xl !text-white text-balance leading-[1.05] mb-4">
                  Package your skills. <span className="italic">Get paid on delivery.</span>
                </h2>
                <p className="text-white/80 text-base sm:text-lg max-w-xl text-pretty">
                  Publish a gig with three tiers, answer buyers in chat, send custom offers and withdraw cleared earnings. No upfront cost.
                </p>
              </div>
              <Link
                href="/become-seller"
                className="relative inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-white text-ink font-semibold text-sm hover:bg-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
              >
                Become a seller <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const STEPS = [
  { icon: <SearchIcon className="w-4 h-4" aria-hidden />, t: "Pick a package", d: "Compare Basic, Standard and Premium side by side. Scope, revisions and delivery are fixed up front." },
  { icon: <MessageSquare className="w-4 h-4" aria-hidden />, t: "Agree the details", d: "Message the seller or accept a custom offer. Share requirements once the order starts." },
  { icon: <ShieldCheck className="w-4 h-4" aria-hidden />, t: "Pay into escrow", d: "Payment is held by the platform and released only when you accept the delivery." },
  { icon: <PackageCheck className="w-4 h-4" aria-hidden />, t: "Review and approve", d: "Request a revision or approve the work. Leave a review, and add a tip if you like." },
];

function SectionHead({
  eyebrow,
  title,
  sub,
  link,
}: {
  eyebrow: string;
  title: string;
  sub?: React.ReactNode;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between mb-8 sm:mb-10 flex-wrap gap-4">
      <div>
        <p className="eyebrow mb-3">
          <span className="w-6 h-px bg-brand-primary" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="font-heading text-3xl sm:text-4xl text-ink">{title}</h2>
        {sub && <p className="mt-3 text-sm sm:text-base text-ink-muted max-w-2xl">{sub}</p>}
      </div>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-ink underline decoration-ink/30 underline-offset-[6px] hover:decoration-ink transition-colors"
        >
          {link.label}
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function Assurance({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-ink-muted">
      <span className="text-brand-primary shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function FeeCard({ title, base, paid, breakdown }: { title: string; base: string; paid: string; breakdown: { label: string; amount: string }[] }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] ring-1 ring-white/15 p-6">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-white/70 mb-4">{base}</p>
      <p className="font-display text-5xl text-white mb-6 tabular-nums">{paid}</p>
      <div className="space-y-2 text-sm pt-4 border-t border-white/15">
        {breakdown.map((b) => (
          <div key={b.label} className="flex justify-between gap-3">
            <span className="text-white/75">{b.label}</span>
            <span className="tabular-nums font-semibold text-white">{b.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
