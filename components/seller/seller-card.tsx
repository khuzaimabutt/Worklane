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
      className="group block bg-white border border-line rounded-xl p-5 text-center transition-all hover:border-line-strong hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <Avatar className="w-20 h-20 mx-auto mb-3 border border-line">
        {avatarUrl && <AvatarImage src={avatarUrl} />}
        <AvatarFallback className="text-xl bg-canvas-subtle text-ink-muted">
          {initials(fullName)}
        </AvatarFallback>
      </Avatar>
      <h3 className="font-heading text-sm text-ink mb-1 truncate group-hover:text-brand-primary-dark transition-colors">
        {fullName}
      </h3>
      <div className="mb-2.5">
        <SellerLevelBadge level={level} />
      </div>
      {tagline && <p className="text-xs text-ink-subtle leading-relaxed line-clamp-2 mb-3 min-h-[2.5rem]">{tagline}</p>}
      <div className="flex items-center justify-center gap-1.5 text-xs pt-3 border-t border-line-subtle">
        <RatingStars value={rating} size={12} />
        <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
        <span className="text-ink-subtle">· {totalOrders} orders</span>
      </div>
    </Link>
  );
}
