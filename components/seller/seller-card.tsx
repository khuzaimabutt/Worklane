import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SellerLevelBadge } from "./seller-level-badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { initials } from "@/lib/utils/format";
import type { SellerLevel } from "@/types/database.types";

interface Props {
  username: string;
  fullName: string;
  avatarUrl: string | null;
  level: SellerLevel;
  rating: number;
  totalOrders: number;
  tagline?: string | null;
}

export function SellerCard({ username, fullName, avatarUrl, level, rating, totalOrders, tagline }: Props) {
  return (
    <Link
      href={`/seller/${username}`}
      className="block bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md hover:border-neutral-300 transition-all text-center"
    >
      <Avatar className="w-20 h-20 mx-auto mb-3">
        {avatarUrl && <AvatarImage src={avatarUrl} />}
        <AvatarFallback className="text-xl">{initials(fullName)}</AvatarFallback>
      </Avatar>
      <h3 className="font-semibold text-neutral-900 mb-1">{fullName}</h3>
      <SellerLevelBadge level={level} className="inline-block mb-2" />
      {tagline && <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{tagline}</p>}
      <div className="flex items-center justify-center gap-2 text-xs">
        <RatingStars value={rating} size={12} />
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-neutral-500">· {totalOrders} orders</span>
      </div>
    </Link>
  );
}
