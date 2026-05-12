import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, RotateCcw, Lock, Heart, Share2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SellerLevelBadge } from "@/components/seller/seller-level-badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { Badge } from "@/components/ui/badge";
import { OrderCard } from "@/components/gig/order-card";
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-xs text-neutral-500 mb-4">
          <Link href="/" className="hover:text-brand-primary">Home</Link>
          {category && <> {" › "} <Link href={`/category/${category.slug}`} className="hover:text-brand-primary">{category.name}</Link></>}
          {" › "}<span className="text-neutral-700">{gig.title.slice(0, 50)}...</span>
        </p>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <h1 className="font-heading text-3xl md:text-4xl">{gig.title}</h1>

            <div className="flex items-center gap-3">
              <Link href={`/seller/${seller.username}`} className="flex items-center gap-3 hover:underline">
                <Avatar className="w-10 h-10">
                  {seller.avatar_url && <AvatarImage src={seller.avatar_url} />}
                  <AvatarFallback>{initials(seller.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {seller.full_name}
                    {isOnline(seller.last_seen) && <span className="w-2 h-2 rounded-full bg-success" />}
                  </p>
                  <p className="text-xs text-neutral-500">@{seller.username}</p>
                </div>
              </Link>
              <SellerLevelBadge level={profile.seller_level} />
              <div className="flex items-center gap-1 text-sm">
                <RatingStars value={gig.average_rating || 0} size={14} />
                <span className="font-medium">{(gig.average_rating || 0).toFixed(1)}</span>
                <span className="text-neutral-500">({gig.total_reviews || 0})</span>
              </div>
            </div>

            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-neutral-100">
              {gig.thumbnail_url ? (
                <Image src={gig.thumbnail_url} alt={gig.title} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-300 font-heading text-6xl">
                  SkillBazaar
                </div>
              )}
            </div>

            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: gig.description }} />

            {gig.tags && gig.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {gig.tags.map((t: string) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            )}

            {extras && extras.length > 0 && (
              <div className="border-t border-neutral-200 pt-6">
                <h2 className="font-heading text-2xl mb-4">Enhance Your Order</h2>
                <div className="space-y-2">
                  {extras.map((ex: any) => (
                    <label key={ex.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg cursor-pointer hover:border-brand-primary transition">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="text-brand-primary" />
                        <div>
                          <p className="text-sm font-medium">{ex.title}</p>
                          {ex.description && <p className="text-xs text-neutral-500">{ex.description}</p>}
                        </div>
                      </div>
                      <span className="text-sm font-medium">+{formatMoney(ex.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {gig.faq && Array.isArray(gig.faq) && gig.faq.length > 0 && (
              <div className="border-t border-neutral-200 pt-6">
                <h2 className="font-heading text-2xl mb-4">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {(gig.faq as Array<{ question: string; answer: string }>).map((f, i) => (
                    <details key={i} className="border border-neutral-200 rounded-lg p-4">
                      <summary className="font-medium cursor-pointer">{f.question}</summary>
                      <p className="mt-2 text-sm text-neutral-700">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-neutral-200 pt-6">
              <h2 className="font-heading text-2xl mb-4">About the Seller</h2>
              <div className="bg-neutral-50 rounded-xl p-6 flex gap-4">
                <Avatar className="w-16 h-16">
                  {seller.avatar_url && <AvatarImage src={seller.avatar_url} />}
                  <AvatarFallback>{initials(seller.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{seller.full_name}</h3>
                    <SellerLevelBadge level={profile.seller_level} />
                  </div>
                  <p className="text-xs text-neutral-500 mb-2">@{seller.username}</p>
                  {profile.tagline && <p className="text-sm mb-3">{profile.tagline}</p>}
                  <div className="grid grid-cols-2 gap-y-1 text-xs text-neutral-600">
                    <span>Member since {new Date(seller.created_at).getFullYear()}</span>
                    <span>{profile.response_time_hours ?? "—"} hr avg response</span>
                    <span>{profile.total_orders_completed} orders</span>
                    <span>{profile.on_time_delivery_rate}% on-time</span>
                  </div>
                  <Link
                    href={`/seller/${seller.username}`}
                    className="mt-3 inline-block text-sm text-brand-primary hover:underline"
                  >
                    View Full Profile →
                  </Link>
                </div>
              </div>
            </div>

            <ReviewsSection
              reviews={reviews ?? []}
              averageRating={gig.average_rating || 0}
              totalReviews={gig.total_reviews || 0}
            />
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3">
              <OrderCard packages={packages as any} extras={extras as any} gigId={gig.id} />
              <div className="bg-white border border-neutral-200 rounded-xl p-4 grid grid-cols-3 gap-2 text-center text-xs text-neutral-600">
                <div>
                  <Clock className="w-5 h-5 mx-auto mb-1 text-brand-primary" />
                  On-Time Delivery
                </div>
                <div>
                  <RotateCcw className="w-5 h-5 mx-auto mb-1 text-brand-primary" />
                  Revision Policy
                </div>
                <div>
                  <Lock className="w-5 h-5 mx-auto mb-1 text-brand-primary" />
                  Escrow Payment
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-2 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50">
                  <Heart className="w-4 h-4" /> Save
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-2 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
