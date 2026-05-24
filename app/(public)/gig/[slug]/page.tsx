import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock, RotateCcw, ShieldCheck, Heart, Share2, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SellerLevelBadge } from "@/components/seller/seller-level-badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { OrderCard } from "@/components/gig/order-card";
import { StickyMobileCTA } from "@/components/gig/sticky-mobile-cta";
import { ReviewsSection } from "@/components/gig/reviews-section";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, initials, isOnline } from "@/lib/utils/format";

export const revalidate = 60;

export default async function GigDetailPage({ params }: { params: { slug: string } }) {
  const sb = createClient();
  const { data: gig } = await sb.from("gigs").select("*").eq("slug", params.slug).single();
  if (!gig || gig.status !== "active") notFound();

  const [{ data: seller }, { data: profile }, { data: packages }, { data: extras }, { data: reviews }, { data: category }] =
    await Promise.all([
      sb.from("users").select("*").eq("id", gig.seller_id).single(),
      sb.from("seller_profiles").select("*").eq("user_id", gig.seller_id).single(),
      sb.from("gig_packages").select("*").eq("gig_id", gig.id).order("price"),
      sb.from("gig_extras").select("*").eq("gig_id", gig.id).eq("is_active", true).order("sort_order"),
      sb.from("reviews").select("*").eq("gig_id", gig.id).order("created_at", { ascending: false }).limit(10),
      sb.from("categories").select("name, slug").eq("id", gig.category_id).single(),
    ]);

  if (!seller || !profile || !packages || packages.length === 0) notFound();

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">
        <nav aria-label="Breadcrumb" className="text-xs text-ink-subtle mb-5 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          {category && (
            <>
              <ChevronRight className="w-3 h-3 text-ink-faint" />
              <Link href={`/category/${category.slug}`} className="hover:text-ink transition-colors">
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-ink-faint" />
          <span className="text-ink-muted truncate">{gig.title}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-8 space-y-6">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-[2rem] text-ink text-balance leading-tight mb-4">
                {gig.title}
              </h1>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={`/seller/${seller.username}`}
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0"
                >
                  <Avatar className="w-8 h-8 shrink-0 border border-line">
                    {seller.avatar_url && <AvatarImage src={seller.avatar_url} />}
                    <AvatarFallback className="text-xs bg-canvas-subtle">{initials(seller.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-ink truncate">{seller.full_name}</span>
                </Link>
                <SellerLevelBadge level={profile.seller_level} />
                {isOnline(seller.last_seen) && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Online
                  </span>
                )}
                <span className="text-ink-faint">·</span>
                <div className="flex items-center gap-1 text-sm shrink-0">
                  <RatingStars value={gig.average_rating || 0} size={14} />
                  <span className="font-semibold text-ink ml-0.5">{(gig.average_rating || 0).toFixed(1)}</span>
                  <span className="text-ink-subtle">({gig.total_reviews || 0})</span>
                </div>
              </div>
            </div>

            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-canvas-subtle border border-line">
              {gig.thumbnail_url ? (
                <Image src={gig.thumbnail_url} alt={gig.title} fill className="object-cover" priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-ink-faint text-5xl font-semibold tracking-tight">
                  SkillBazaar
                </div>
              )}
            </div>

            <section className="bg-white border border-line rounded-2xl p-6 sm:p-7">
              <h2 className="font-heading text-lg text-ink mb-4">About this gig</h2>
              <div
                className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-ink prose-p:text-ink prose-strong:text-ink prose-a:text-brand-primary-dark"
                dangerouslySetInnerHTML={{ __html: gig.description }}
              />

              {gig.tags && gig.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-5 pt-5 border-t border-line">
                  {gig.tags.map((t: string) => (
                    <span
                      key={t}
                      className="px-2.5 h-7 inline-flex items-center bg-canvas-subtle border border-line text-xs text-ink-muted rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {gig.faq && Array.isArray(gig.faq) && gig.faq.length > 0 && (
              <section className="bg-white border border-line rounded-2xl p-6 sm:p-7">
                <h2 className="font-heading text-lg text-ink mb-4">Frequently asked questions</h2>
                <div className="divide-y divide-line">
                  {(gig.faq as Array<{ question: string; answer: string }>).map((f, i) => (
                    <details key={i} className="group py-4 first:pt-0 last:pb-0">
                      <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-ink list-none">
                        <span>{f.question}</span>
                        <ChevronRight className="w-4 h-4 text-ink-subtle transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="mt-3 text-sm text-ink-muted leading-relaxed">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white border border-line rounded-2xl p-6 sm:p-7">
              <h2 className="font-heading text-lg text-ink mb-5">About the seller</h2>
              <div className="flex gap-5 items-start">
                <Avatar className="w-16 h-16 shrink-0 border border-line">
                  {seller.avatar_url && <AvatarImage src={seller.avatar_url} />}
                  <AvatarFallback className="bg-canvas-subtle">{initials(seller.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-heading text-base text-ink">{seller.full_name}</h3>
                    <SellerLevelBadge level={profile.seller_level} />
                  </div>
                  <p className="text-xs text-ink-subtle mb-3">@{seller.username}</p>
                  {profile.tagline && (
                    <p className="text-sm text-ink leading-relaxed mb-4">{profile.tagline}</p>
                  )}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs mb-4 pb-4 border-b border-line">
                    <StatRow label="Member since" value={new Date(seller.created_at).getFullYear().toString()} />
                    <StatRow label="Avg. response" value={`${profile.response_time_hours ?? "—"} hr`} />
                    <StatRow label="Orders done" value={profile.total_orders_completed.toString()} />
                    <StatRow label="On-time" value={`${profile.on_time_delivery_rate}%`} />
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/seller/${seller.username}`} className="btn-secondary">
                      View profile
                    </Link>
                    <button className="btn-ghost">
                      <MessageCircle className="w-4 h-4" />
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <ReviewsSection
              reviews={reviews ?? []}
              averageRating={gig.average_rating || 0}
              totalReviews={gig.total_reviews || 0}
            />
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">
              <OrderCard packages={packages as any} extras={extras as any} gigId={gig.id} />

              <div className="bg-white border border-line rounded-xl p-4 grid grid-cols-3 gap-2">
                <TrustBadge icon={<Clock className="w-4 h-4" />} label="On-time delivery" />
                <TrustBadge icon={<RotateCcw className="w-4 h-4" />} label="Free revisions" />
                <TrustBadge icon={<ShieldCheck className="w-4 h-4" />} label="Escrow protected" />
              </div>

              <div className="flex gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-white border border-line-strong rounded-md text-sm font-medium text-ink-muted hover:bg-canvas-subtle hover:text-ink transition-colors">
                  <Heart className="w-4 h-4" /> Save
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-white border border-line-strong rounded-md text-sm font-medium text-ink-muted hover:bg-canvas-subtle hover:text-ink transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <StickyMobileCTA gigId={gig.id} packages={packages as any} />
      <Footer />
    </>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-ink-subtle">{label}</span>
      <span className="font-semibold text-ink tabular-nums">{value}</span>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="w-9 h-9 mx-auto mb-1.5 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
        {icon}
      </div>
      <p className="text-2xs text-ink-muted leading-tight font-medium">{label}</p>
    </div>
  );
}
