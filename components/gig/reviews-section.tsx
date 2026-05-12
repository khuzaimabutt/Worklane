"use client";
import { useState } from "react";
import { RatingStars } from "@/components/ui/rating-stars";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fromNow, initials } from "@/lib/utils/format";
import type { Review } from "@/types/database.types";

export function ReviewsSection({
  reviews,
  averageRating,
  totalReviews,
}: {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}) {
  const [visible, setVisible] = useState(5);

  const ratingBuckets = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.overall_rating === star).length;
    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
    return { star, count, pct };
  });

  return (
    <div className="border-t border-neutral-200 pt-6">
      <h2 className="font-heading text-2xl mb-4">Reviews</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="font-heading text-5xl">{averageRating.toFixed(1)}</p>
            <div>
              <RatingStars value={averageRating} size={18} />
              <p className="text-xs text-neutral-500">{totalReviews} reviews</p>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          {ratingBuckets.map((b) => (
            <div key={b.star} className="flex items-center gap-2 text-xs">
              <span className="w-6">{b.star}★</span>
              <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-warning" style={{ width: `${b.pct}%` }} />
              </div>
              <span className="w-8 text-right text-neutral-500">{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-neutral-500 text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.slice(0, visible).map((r) => (
            <div key={r.id} className="border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">Buyer</p>
                  <p className="text-xs text-neutral-500">{fromNow(r.created_at)}</p>
                </div>
                <RatingStars value={r.overall_rating} size={12} />
              </div>
              <p className="text-sm text-neutral-700">{r.review_text}</p>
              {r.seller_response && (
                <div className="mt-3 pl-4 border-l-2 border-neutral-200">
                  <p className="text-xs font-medium text-neutral-500 mb-1">Seller&apos;s response</p>
                  <p className="text-sm text-neutral-700">{r.seller_response}</p>
                </div>
              )}
            </div>
          ))}
          {visible < reviews.length && (
            <button
              onClick={() => setVisible(reviews.length)}
              className="text-sm text-brand-primary hover:underline"
            >
              Show all {reviews.length} reviews
            </button>
          )}
        </div>
      )}
    </div>
  );
}
