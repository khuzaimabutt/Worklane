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
  ArrowUpRight,
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

async function loadHomeData() {
  try {
    const sb = createClient();
    const [{ data: parentCategories }, { count: activeGigs }, { count: verifiedSellers }] = await Promise.all([
      sb.from("categories").select("*").is("parent_id", null).order("sort_order"),
      sb.from("gigs").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("users").select("id", { count: "exact", head: true }).eq("is_seller", true),
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
    const gigIds = (gigRows ?? []).map((g: any) => g.id);

    const [{ data: users }, { data: profiles }, { data: packages }] = await Promise.all([
      allSellerIds.length > 0
        ? sb.from("users").select("id, username, full_name, avatar_url").in("id", allSellerIds)
        : Promise.resolve({ data: [] as any[] }),
      sellerIdsForGigs.length > 0
        ? sb.from("seller_profiles").select("user_id, seller_level").in("user_id", sellerIdsForGigs)
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
      activeGigs: activeGigs ?? 0,
      verifiedSellers: verifiedSellers ?? 0,
      featuredGigs,
      topSellers,
    };
  } catch {
    return { categories: [], activeGigs: 0, verifiedSellers: 0, featuredGigs: [], topSellers: [] };
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
              <div className="relative hidden sm:block h-[420px] lg:h-[480px] rise rise-2" aria-hidden>
                {heroGigs.map((g, i) => (
                  <div
                    key={g.id}
                    className={[
                      "absolute w-[62%] rounded-2xl bg-white p-1.5 shadow-card-hover border border-line",
                      i === 0 ? "left-0 top-6 -rotate-3 z-10" : "",
                      i === 1 ? "right-0 top-0 rotate-2 z-20" : "",
                      i === 2 ? "left-[18%] bottom-0 rotate-1 z-30" : "",
                    ].join(" ")}
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
              <Assurance icon={<ShieldCheck className="w-4 h-4" />} label="Funds held until delivery" />
              <Assurance icon={<Clock className="w-4 h-4" />} label="Delivery date per package" />
              <Assurance icon={<MessageSquare className="w-4 h-4" />} label="Custom offers in chat" />
              <Assurance icon={<FlaskConical className="w-4 h-4" />} label="Demo: Stripe test mode" />
            </div>
          </div>
        </section>

        {data.categories.length > 0 && (
          <section className="py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <SectionHead eyebrow="Categories" title="Explore by discipline" link={{ href: "/search", label: "Browse all services" }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded-2xl overflow-hidden">
                {data.categories.map((cat: any, i: number) => {
                  const Icon = ICON_MAP[cat.icon_name] || Globe;
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="group relative bg-white p-6 sm:p-7 flex items-start gap-5 transition-colors hover:bg-canvas-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
                    >
                      <span className="font-display text-sm text-ink-subtle tabular-nums pt-1 w-6">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="w-10 h-10 mb-4 rounded-full bg-brand-primary-50 text-brand-primary flex items-center justify-center transition-colors group-hover:bg-brand-primary group-hover:text-white">
                          <Icon className="w-[18px] h-[18px]" />
                        </div>
                        <h3 className="font-display text-xl text-ink mb-1">{cat.name}</h3>
                        <p className="text-sm text-ink-subtle">{cat.gig_count ?? 0} services</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-ink-faint transition-all group-hover:text-ink group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 sm:py-24 bg-white border-y border-line">
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
            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {STEPS.map((step, i) => (
                <li key={step.t} className="relative rounded-2xl border border-line bg-white p-6">
                  <div className="flex items-center justify-between mb-8">
                    <span className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center">
                      <step.icon className="w-4 h-4" aria-hidden />
                    </span>
                    <span className="font-display text-3xl text-line-strong tabular-nums" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-ink mb-2">{step.t}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{step.d}</p>
                </li>
              ))}
            </ol>
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
  { icon: SearchIcon, t: "Pick a package", d: "Compare Basic, Standard and Premium side by side. Scope, revisions and delivery are fixed up front." },
  { icon: MessageSquare, t: "Agree the details", d: "Message the seller or accept a custom offer. Share requirements once the order starts." },
  { icon: ShieldCheck, t: "Pay into escrow", d: "Payment is held by the platform and released only when you accept the delivery." },
  { icon: PackageCheck, t: "Review and approve", d: "Request a revision or approve the work. Leave a review, and add a tip if you like." },
];

function SectionHead({ eyebrow, title, link }: { eyebrow: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex items-end justify-between mb-8 sm:mb-10 flex-wrap gap-4">
      <div>
        <p className="eyebrow mb-3">
          <span className="w-6 h-px bg-brand-primary" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="font-heading text-3xl sm:text-4xl text-ink">{title}</h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink border-b border-ink/30 pb-0.5 hover:border-ink transition-colors"
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
      <span className="text-xs sm:text-sm font-medium">{label}</span>
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
