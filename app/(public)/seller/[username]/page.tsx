import { notFound } from "next/navigation";
import { MessageCircle, Clock, MapPin, Calendar, CheckCircle2, Globe } from "lucide-react";
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

  const memberSince = new Date(user.created_at).getFullYear();
  const isVerified = (profile as any).is_verified ?? false;

  return (
    <>
      <Navbar />
      <main className="bg-canvas min-h-screen">
        <div className="relative h-48 sm:h-56 bg-gradient-to-br from-brand-primary via-brand-primary-dark to-[#064E50] overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 pb-12">
          <div className="bg-white border border-line rounded-2xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-white -mt-20 sm:-mt-24 shadow-card-hover shrink-0 bg-canvas-subtle">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="text-3xl bg-canvas-subtle text-ink-muted">
                    {initials(user.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 sm:pt-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="font-heading text-2xl sm:text-3xl text-ink truncate">{user.full_name}</h1>
                    {isVerified && (
                      <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" aria-label="Verified" />
                    )}
                    <SellerLevelBadge level={profile.seller_level} />
                  </div>

                  <p className="text-sm text-ink-subtle mb-3">@{user.username}</p>

                  {profile.tagline && (
                    <p className="text-base text-ink leading-relaxed mb-4 text-balance">{profile.tagline}</p>
                  )}

                  <div className="flex items-center gap-1.5 mb-4">
                    <RatingStars value={profile.average_rating} size={16} />
                    <span className="text-sm font-semibold text-ink ml-1">{profile.average_rating.toFixed(1)}</span>
                    <span className="text-sm text-ink-subtle">({profile.total_reviews_received} reviews)</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isOnline(user.last_seen) && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-green-50 text-green-700 border border-green-100 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        Online now
                      </span>
                    )}
                    {user.country && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-canvas-subtle text-ink-muted border border-line text-xs font-medium">
                        <MapPin className="w-3 h-3" />
                        {countryFlag(user.country)} {user.country}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-canvas-subtle text-ink-muted border border-line text-xs font-medium">
                      <Calendar className="w-3 h-3" />
                      Member since {memberSince}
                    </span>
                    {profile.response_rate != null && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-canvas-subtle text-ink-muted border border-line text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Responds in ~1 hr
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                  <Button variant="default" size="lg" className="w-full sm:w-auto whitespace-nowrap">
                    <MessageCircle className="w-4 h-4" />
                    Contact {user.full_name.split(" ")[0]}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-line">
              <Stat label="Rating" value={profile.average_rating.toFixed(2)} />
              <Stat label="Orders completed" value={profile.total_orders_completed.toString()} />
              <Stat label="On-time delivery" value={`${profile.on_time_delivery_rate}%`} />
              <Stat label="Response rate" value={`${profile.response_rate ?? "—"}%`} />
            </div>
          </div>

          <Tabs defaultValue="gigs" className="mt-8">
            <TabsList className="mb-6">
              <TabsTrigger value="gigs">Gigs ({gigs?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({profile.total_reviews_received})</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="gigs">
              {!gigs || gigs.length === 0 ? (
                <div className="bg-white border border-line rounded-xl py-16 text-center">
                  <p className="text-sm text-ink-subtle">No active gigs yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {(profile.portfolio_items as any[]).map((p, i) => (
                    <div key={i} className="bg-white border border-line rounded-xl overflow-hidden">
                      <div className="aspect-[5/3] bg-canvas-subtle">
                        {p.image_url && (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-sm text-ink truncate">{p.title}</p>
                        <p className="text-xs text-ink-subtle line-clamp-2 mt-0.5">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-line rounded-xl py-16 text-center">
                  <p className="text-sm text-ink-subtle">No portfolio items yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-3">
                {(reviews ?? []).map((r) => (
                  <div key={r.id} className="bg-white border border-line rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <RatingStars value={r.overall_rating} size={14} />
                      <span className="text-xs text-ink-subtle">·</span>
                      <span className="text-xs text-ink-subtle">{formatDate(r.created_at)}</span>
                    </div>
                    <p className="text-sm text-ink leading-relaxed">{r.review_text}</p>
                  </div>
                ))}
                {(reviews ?? []).length === 0 && (
                  <div className="bg-white border border-line rounded-xl py-16 text-center">
                    <p className="text-sm text-ink-subtle">No reviews yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="about">
              <div className="bg-white border border-line rounded-xl p-6 sm:p-8 space-y-6">
                {profile.description && (
                  <div>
                    <h3 className="font-heading text-base text-ink mb-2">About</h3>
                    <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{profile.description}</p>
                  </div>
                )}
                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <h3 className="font-heading text-base text-ink mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((s: string) => (
                        <span
                          key={s}
                          className="px-3 h-7 inline-flex items-center bg-canvas-subtle border border-line text-xs font-medium text-ink-muted rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.languages && (profile.languages as any[]).length > 0 && (
                  <div>
                    <h3 className="font-heading text-base text-ink mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-ink-subtle" />
                      Languages
                    </h3>
                    <div className="space-y-1.5">
                      {(profile.languages as any[]).map((l: any, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-ink">{l.name ?? l}</span>
                          {l.level && <span className="text-xs text-ink-subtle">{l.level}</span>}
                        </div>
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
    <div className="text-center px-4 py-5 border-r border-line last:border-r-0 [&:nth-child(2)]:border-r-0 md:[&:nth-child(2)]:border-r">
      <p className="font-heading text-xl sm:text-2xl text-ink tabular-nums">{value}</p>
      <p className="text-2xs uppercase tracking-wider text-ink-subtle mt-1 font-medium">{label}</p>
    </div>
  );
}
