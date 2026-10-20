"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SellerLevelBadge } from "@/components/seller/seller-level-badge";
import { formatMoney, initials } from "@/lib/utils/format";
import type { SellerLevel } from "@/types/database.types";
import { cn } from "@/lib/utils/cn";

export interface GigCardData {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  average_rating: number;
  total_reviews: number;
  starting_price: number;
  seller: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    seller_level: SellerLevel;
  };
}

export function GigCard({
  gig,
  className,
  initialFavorited = false,
}: {
  gig: GigCardData;
  className?: string;
  initialFavorited?: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorited);
  const [pending, setPending] = useState(false);
  const hasRating = gig.total_reviews > 0;

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    if (pending) return;
    const prev = fav;
    setFav(!prev);
    setPending(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gig_id: gig.id }),
      });
      if (res.status === 401) {
        setFav(prev);
        toast.error("Sign in to save gigs", {
          action: { label: "Sign in", onClick: () => router.push("/login?redirect=" + window.location.pathname) },
        });
        return;
      }
      if (!res.ok) {
        setFav(prev);
        toast.error("Couldn't update favorites");
        return;
      }
      const data = await res.json();
      setFav(Boolean(data.favorited));
    } catch {
      setFav(prev);
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Link
      href={`/gig/${gig.slug}`}
      className={cn(
        "group relative flex flex-col bg-white border border-line rounded-2xl overflow-hidden",
        "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-line-strong hover:shadow-card-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        className
      )}
    >
      <div className="relative aspect-[4/3] bg-canvas overflow-hidden m-1.5 mb-0 rounded-xl">
        {gig.thumbnail_url ? (
          <Image
            src={gig.thumbnail_url}
            alt=""
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-display italic text-2xl text-ink-faint">
            Worklane
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <button
          onClick={toggleFavorite}
          disabled={pending}
          className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur w-9 h-9 rounded-full flex items-center justify-center shadow-card hover:bg-white hover:scale-105 transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label={fav ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={fav}
        >
          <Heart className={cn("w-4 h-4 transition-colors", fav ? "fill-brand-accent text-brand-accent" : "text-ink")} />
        </button>
        {gig.seller.seller_level !== "new_seller" && (
          <SellerLevelBadge
            level={gig.seller.seller_level}
            className="absolute left-2.5 top-2.5 shadow-card"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4">
        <div className="gig-lift flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6 shrink-0 ring-1 ring-line">
            {gig.seller.avatar_url && <AvatarImage src={gig.seller.avatar_url} alt="" />}
            <AvatarFallback className="text-[10px] bg-brand-primary-50 text-brand-primary-dark font-semibold">
              {initials(gig.seller.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-ink-muted truncate min-w-0 flex-1">
            {gig.seller.full_name}
          </span>
          {hasRating ? (
            <span className="inline-flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 fill-ink text-ink" aria-hidden />
              <span className="text-xs font-semibold text-ink tabular-nums">{gig.average_rating.toFixed(1)}</span>
              <span className="text-xs text-ink-subtle tabular-nums">({gig.total_reviews})</span>
            </span>
          ) : (
            <span className="text-2xs font-semibold uppercase tracking-wider text-brand-primary shrink-0">New</span>
          )}
        </div>

        <p className="text-[15px] text-ink font-medium leading-snug line-clamp-2 mb-4 min-h-[2.6rem] decoration-brand-primary/40 underline-offset-2 group-hover:underline">
          {gig.title}
        </p>

        <div className="gig-lift mt-auto flex items-baseline justify-between">
          <span className="text-2xs text-ink-subtle uppercase tracking-[0.12em] font-semibold">Starting at</span>
          <span className="font-display text-xl text-ink tabular-nums">
            {formatMoney(gig.starting_price)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function GigCardSkeleton() {
  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden p-1.5" aria-hidden>
      <div className="aspect-[4/3] skeleton rounded-xl" />
      <div className="px-2.5 pt-3 pb-2.5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full skeleton" />
          <div className="h-3 flex-1 skeleton rounded" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 skeleton rounded" />
          <div className="h-3.5 skeleton rounded w-3/4" />
        </div>
        <div className="h-3 skeleton rounded w-1/3" />
        <div className="flex justify-between pt-2">
          <div className="h-3 skeleton rounded w-10" />
          <div className="h-4 skeleton rounded w-14" />
        </div>
      </div>
    </div>
  );
}
