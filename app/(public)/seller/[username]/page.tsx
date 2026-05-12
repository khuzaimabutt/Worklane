import { notFound } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SellerLevelBadge } from "@/components/seller/seller-level-badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GigCard, type GigCardData } from "@/components/gig/gig-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { initials, isOnline, countryFlag, formatDate } from "@/lib/utils/format";

export const revalidate = 120;

export default async function SellerProfilePage({ params }: { params: { username: string } }) {
  const sb = createClient();
  const { data: user } = await sb.from("users").select("*").eq("username", params.username).single();
  if (!user || !user.is_seller) notFound();

  const [{ data: profile }, { data: gigs }, { data: reviews }] = await Promise.all([
    sb.from("seller_profiles").select("*").eq("user_id", user.id).single(),
    sb.from("gigs").select("id, slug, title, thumbnail_url, average_rating, total_reviews").eq("seller_id", user.id).eq("status", "active"),
    sb.from("reviews").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);

  if (!profile) notFound();

  return (
    <>
      <Navbar />
      <main>
        <div className="h-40 bg-gradient-to-r from-brand-primary to-brand-primary-dark" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 pb-12">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="w-24 h-24 border-4 border-white -mt-12 shadow-lg">
                {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback className="text-2xl">{initials(user.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="font-heading text-3xl">{user.full_name}</h1>
                <div className="flex items-center gap-2 mt-1 mb-3 flex-wrap text-sm text-neutral-600">
                  <span>@{user.username}</span>
                  <SellerLevelBadge level={profile.seller_level} />
                  {isOnline(user.last_seen) && (
                    <span className="inline-flex items-center gap-1 text-success text-xs">
                      <span className="w-2 h-2 rounded-full bg-success" /> Online
                    </span>
                  )}
                  <span>· {countryFlag(user.country)} {user.country}</span>
                  <span>· Member since {new Date(user.created_at).getFullYear()}</span>
                </div>
                {profile.tagline && <p className="text-neutral-700 mb-3">{profile.tagline}</p>}
                <div className="flex items-center gap-1 text-sm">
                  <RatingStars value={profile.average_rating} size={14} />
                  <span className="font-medium">{profile.average_rating.toFixed(1)}</span>
                  <span className="text-neutral-500">({profile.total_reviews_received} reviews)</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="cta" className="whitespace-nowrap">
                  <MessageCircle className="w-4 h-4" />
                  Contact {user.full_name.split(" ")[0]}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100">
              <Stat label="Average Rating" value={profile.average_rating.toFixed(2)} />
              <Stat label="Orders Completed" value={profile.total_orders_completed.toString()} />
              <Stat label="On-Time" value={`${profile.on_time_delivery_rate}%`} />
              <Stat label="Response Rate" value={`${profile.response_rate ?? "—"}%`} />
            </div>
          </div>

          <Tabs defaultValue="gigs">
            <TabsList>
              <TabsTrigger value="gigs">Gigs ({gigs?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="gigs">
              {!gigs || gigs.length === 0 ? (
                <p className="text-neutral-500 py-8 text-center">No active gigs.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gigs.map((g) => {
                    const card: GigCardData = {
                      id: g.id,
                      slug: g.slug,
                      title: g.title,
                      thumbnail_url: g.thumbnail_url,
                      average_rating: g.average_rating || 0,
                      total_reviews: g.total_reviews || 0,
                      starting_price: 50,
                      seller: {
                        username: user.username,
                        full_name: user.full_name,
                        avatar_url: user.avatar_url,
                        seller_level: profile.seller_level,
                      },
                    };
                    return <GigCard key={g.id} gig={card} />;
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="portfolio">
              {profile.portfolio_items && (profile.portfolio_items as any[]).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(profile.portfolio_items as any[]).map((p, i) => (
                    <div key={i} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                      <div className="aspect-video bg-neutral-100">
                        {p.image_url && (<img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />)}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm">{p.title}</p>
                        <p className="text-xs text-neutral-500 line-clamp-2">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 py-8 text-center">No portfolio items yet.</p>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-4">
                {(reviews ?? []).map((r) => (
                  <div key={r.id} className="bg-white border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RatingStars value={r.overall_rating} size={14} />
                      <span className="text-xs text-neutral-500">{formatDate(r.created_at)}</span>
                    </div>
                    <p className="text-sm">{r.review_text}</p>
                  </div>
                ))}
                {(reviews ?? []).length === 0 && <p className="text-neutral-500 text-center py-8">No reviews yet.</p>}
              </div>
            </TabsContent>

            <TabsContent value="about">
              <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
                {profile.description && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-sm text-neutral-700">{profile.description}</p>
                  </div>
                )}
                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((s: string) => (
                        <span key={s} className="px-3 py-1 bg-neutral-100 rounded-full text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-heading text-2xl">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
