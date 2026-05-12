import Link from "next/link";
import {
  Globe,
  Smartphone,
  Palette,
  Bot,
  TrendingUp,
  Briefcase,
  Search,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GigCard, GigCardSkeleton, type GigCardData } from "@/components/gig/gig-card";
import { SellerCard } from "@/components/seller/seller-card";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Smartphone, Palette, Bot, TrendingUp, Briefcase,
};

async function loadHomeData() {
  try {
    const sb = createClient();
    const [{ data: parentCategories }, { count: activeGigs }, { count: verifiedSellers }] = await Promise.all([
      sb.from("categories").select("*").is("parent_id", null).order("sort_order"),
      sb.from("gigs").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("users").select("id", { count: "exact", head: true }).eq("is_seller", true),
    ]);

    const { data: featuredGigs } = await sb
      .from("gigs")
      .select("id, slug, title, thumbnail_url, average_rating, total_reviews, seller_id")
      .eq("status", "active")
      .order("total_orders", { ascending: false })
      .limit(8);

    const { data: topSellers } = await sb
      .from("seller_profiles")
      .select("user_id, seller_level, average_rating, total_orders_completed, tagline")
      .order("average_rating", { ascending: false })
      .limit(4);

    return {
      categories: parentCategories ?? [],
      activeGigs: activeGigs ?? 0,
      verifiedSellers: verifiedSellers ?? 0,
      featuredGigs: featuredGigs ?? [],
      topSellers: topSellers ?? [],
    };
  } catch {
    return { categories: [], activeGigs: 0, verifiedSellers: 0, featuredGigs: [], topSellers: [] };
  }
}

export default async function HomePage() {
  const data = await loadHomeData();

  return (
    <>
      <Navbar />
      <main>
        <section className="hero-bg border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
            <h1 className="font-heading text-5xl md:text-7xl leading-[1.05] mb-4 text-balance">
              Find the Right Freelancer.<br className="hidden md:block" /> Get It Done.
            </h1>
            <p className="text-neutral-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Browse services from verified professionals. Quality work, transparent pricing, secure payments.
            </p>
            <form action="/search" className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 mb-6">
              <input
                name="q"
                placeholder="What service are you looking for today?"
                className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <button className="btn-cta whitespace-nowrap inline-flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </button>
            </form>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-neutral-600">
              <span>Popular:</span>
              {["Web Design", "Logo Design", "Bubble.io", "React Native", "AI Integration"].map((t) => (
                <Link
                  key={t}
                  href={`/search?q=${encodeURIComponent(t)}`}
                  className="bg-white border border-neutral-200 px-3 py-1 rounded-full hover:border-brand-primary hover:text-brand-primary transition"
                >
                  {t}
                </Link>
              ))}
            </div>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-3xl mx-auto">
              <Stat number={`${data.activeGigs.toLocaleString()}+`} label="Active Gigs" />
              <Stat number={`${data.verifiedSellers.toLocaleString()}+`} label="Verified Sellers" />
              <Stat number="Escrow" label="Secure Payments" />
              <Stat number="24/7" label="Support" />
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="font-heading text-3xl md:text-4xl text-center mb-3">
              Transparent Fees. No Surprises at Checkout.
            </h2>
            <p className="text-neutral-500 text-center mb-10 max-w-2xl mx-auto">
              We believe in honest pricing — here&apos;s exactly what you pay and what sellers earn.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <FeeCard
                title="If you order $100"
                paid="$105.50"
                breakdown={[
                  { label: "Service", amount: "$100.00" },
                  { label: "Service fee (5.5%)", amount: "$5.50" },
                ]}
                accent="bg-brand-primary/5 border-brand-primary/20"
              />
              <FeeCard
                title="If a seller receives $100"
                paid="$80.00"
                breakdown={[
                  { label: "Order amount", amount: "$100.00" },
                  { label: "Commission (20%)", amount: "−$20.00" },
                ]}
                accent="bg-brand-accent/5 border-brand-accent/20"
              />
            </div>
            <p className="text-xs text-neutral-500 text-center mt-6 max-w-2xl mx-auto">
              The 20% seller commission funds platform security, payment protection, dispute resolution, and the team behind SkillBazaar.
            </p>
          </div>
        </section>

        <section className="py-16 border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-heading text-3xl md:text-4xl mb-8 text-center">Explore Services</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.categories.map((cat: any) => {
                const Icon = ICON_MAP[cat.icon_name] || Globe;
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="group bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md hover:border-brand-primary transition-all"
                  >
                    <Icon className="w-8 h-8 text-brand-primary mb-3" />
                    <h3 className="font-semibold text-neutral-900 mb-1">{cat.name}</h3>
                    <p className="text-sm text-neutral-500">{cat.gig_count} gigs</p>
                    <p className="text-sm text-brand-primary mt-2 opacity-0 group-hover:opacity-100 transition">
                      Browse {cat.name} →
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-heading text-3xl md:text-4xl mb-8 text-center">Popular This Week</h2>
            {data.featuredGigs.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <GigCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.featuredGigs.map((g: any) => {
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
        </section>

        {data.topSellers.length > 0 && (
          <section className="py-16 border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="font-heading text-3xl md:text-4xl mb-8 text-center">Our Top Sellers</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.topSellers.map((s: any) => (
                  <SellerCard
                    key={s.user_id}
                    username={s.user_id}
                    fullName="Top Seller"
                    avatarUrl={null}
                    level={s.seller_level}
                    rating={s.average_rating || 0}
                    totalOrders={s.total_orders_completed || 0}
                    tagline={s.tagline}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-brand-primary text-white py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-heading text-4xl md:text-5xl mb-4">Turn Your Skills Into Income</h2>
            <p className="text-white/85 text-lg mb-8">
              Join thousands of professionals earning on SkillBazaar — no upfront cost, no monthly fees.
            </p>
            <Link href="/become-seller" className="inline-block btn-cta">
              Start Selling Today
            </Link>
            <div className="mt-10 grid grid-cols-3 gap-6 text-sm">
              <Trust icon={<ShieldCheck />} title="Secure Escrow" />
              <Trust icon={<Clock />} title="On-time Delivery" />
              <Trust icon={<CheckCircle2 />} title="Verified Reviews" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="font-heading text-3xl text-brand-primary">{number}</p>
      <p className="text-xs text-neutral-500 mt-1">{label}</p>
    </div>
  );
}

function FeeCard({
  title,
  paid,
  breakdown,
  accent,
}: {
  title: string;
  paid: string;
  breakdown: { label: string; amount: string }[];
  accent: string;
}) {
  return (
    <div className={`rounded-xl border p-6 ${accent}`}>
      <p className="text-sm font-medium text-neutral-700 mb-2">{title}</p>
      <p className="font-heading text-5xl mb-4">{paid}</p>
      <div className="space-y-1 text-sm">
        {breakdown.map((b) => (
          <div key={b.label} className="flex justify-between">
            <span className="text-neutral-600">{b.label}</span>
            <span className="tabular-nums font-medium">{b.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trust({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white">
        {icon}
      </div>
      <span className="text-white/90">{title}</span>
    </div>
  );
}
