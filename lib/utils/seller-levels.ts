import type { SellerLevel } from "@/types/database.types";
import type { PlatformSettings } from "./fee-calculator";

export interface LevelRequirement {
  orders: number;
  earnings: number;
  days: number;
  rating: number;
}

export const LEVEL_LABELS: Record<SellerLevel, string> = {
  new_seller: "New Seller",
  level_one: "Level One",
  level_two: "Level Two",
  top_rated: "Top Rated",
};

export const LEVEL_COLORS: Record<SellerLevel, string> = {
  new_seller: "#6B7280",
  level_one: "#3B82F6",
  level_two: "#8B5CF6",
  top_rated: "#F59E0B",
};

export function getLevelRequirements(settings: PlatformSettings): Record<SellerLevel, LevelRequirement> {
  return {
    new_seller: { orders: 0, earnings: 0, days: 0, rating: 0 },
    level_one: {
      orders: parseInt(settings.level_one_min_orders, 10),
      earnings: parseFloat(settings.level_one_min_earnings),
      days: parseInt(settings.level_one_min_days, 10),
      rating: 4.5,
    },
    level_two: {
      orders: parseInt(settings.level_two_min_orders, 10),
      earnings: parseFloat(settings.level_two_min_earnings),
      days: parseInt(settings.level_two_min_days, 10),
      rating: 4.6,
    },
    top_rated: {
      orders: parseInt(settings.top_rated_min_orders, 10),
      earnings: parseFloat(settings.top_rated_min_earnings),
      days: 180,
      rating: 4.7,
    },
  };
}

export function getClearingDays(level: SellerLevel, settings: PlatformSettings): number {
  switch (level) {
    case "new_seller":
      return parseInt(settings.clearing_days_new_seller, 10);
    case "level_one":
      return parseInt(settings.clearing_days_level_one, 10);
    case "level_two":
      return parseInt(settings.clearing_days_level_two, 10);
    case "top_rated":
      return parseInt(settings.clearing_days_top_rated, 10);
  }
}

export function calculateLevel(
  metrics: { orders: number; earnings: number; daysActive: number; rating: number },
  settings: PlatformSettings
): SellerLevel {
  const reqs = getLevelRequirements(settings);
  const meets = (req: LevelRequirement) =>
    metrics.orders >= req.orders &&
    metrics.earnings >= req.earnings &&
    metrics.daysActive >= req.days &&
    metrics.rating >= req.rating;

  if (meets(reqs.top_rated)) return "top_rated";
  if (meets(reqs.level_two)) return "level_two";
  if (meets(reqs.level_one)) return "level_one";
  return "new_seller";
}

export function nextLevel(current: SellerLevel): SellerLevel | null {
  const order: SellerLevel[] = ["new_seller", "level_one", "level_two", "top_rated"];
  const idx = order.indexOf(current);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
}
