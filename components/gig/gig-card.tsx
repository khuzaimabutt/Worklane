"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
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

export function GigCard({ gig, className }: { gig: GigCardData; className?: string }) {
  const [fav, setFav] = useState(false);

  return (
    <Link
      href={`/gig/${gig.slug}`}
      className={cn(
        "block bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all",
        className
      )}
    >
      <div className="relative aspect-[16/9] bg-neutral-100">
        {gig.thumbnail_url ? (
          <Image src={gig.thumbnail_url} alt={gig.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-300 font-heading text-3xl">
            SkillBazaar
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            setFav(!fav);
          }}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur p-1.5 rounded-full hover:bg-white transition"
          aria-label="Save to favorites"
        >
          <Heart className={cn("w-4 h-4", fav ? "fill-error text-error" : "text-neutral-700")} />
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6">
            {gig.seller.avatar_url && <AvatarImage src={gig.seller.avatar_url} />}
            <AvatarFallback className="text-[10px]">{initials(gig.seller.full_name)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-neutral-700 truncate flex-1">{gig.seller.full_name}</span>
          {gig.seller.seller_level !== "new_seller" && (
            <SellerLevelBadge level={gig.seller.seller_level} className="text-[9px]" />
          )}
        </div>

        <p className="text-sm text-neutral-900 line-clamp-2 mb-2 min-h-[2.5rem]">{gig.title}</p>

        <div className="flex items-center gap-1 mb-2">
          <RatingStars value={gig.average_rating} size={12} />
          <span className="text-xs font-medium text-neutral-900 ml-1">{gig.average_rating.toFixed(1)}</span>
          <span className="text-xs text-neutral-500">({gig.total_reviews})</span>
        </div>

        <div className="flex items-baseline justify-between border-t border-neutral-100 pt-2">
          <span className="text-xs text-neutral-500">Starting at</span>
          <span className="text-sm font-semibold">{formatMoney(gig.starting_price)}</span>
        </div>
      </div>
    </Link>
  );
}

export function GigCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="aspect-[16/9] bg-neutral-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-neutral-100 animate-pulse rounded" />
        <div className="h-4 bg-neutral-100 animate-pulse rounded w-3/4" />
        <div className="h-3 bg-neutral-100 animate-pulse rounded w-1/2" />
      </div>
    </div>
  );
}
