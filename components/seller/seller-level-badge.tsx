import { LEVEL_LABELS } from "@/lib/utils/seller-levels";
import type { SellerLevel } from "@/types/database.types";
import { cn } from "@/lib/utils/cn";

interface Props {
  level: SellerLevel;
  className?: string;
}

const styles: Record<SellerLevel, string> = {
  new_seller: "bg-canvas-subtle text-ink-subtle border-line",
  level_one: "bg-brand-primary-50 text-brand-primary-dark border-brand-primary/20",
  level_two: "bg-brand-primary text-white border-brand-primary-dark",
  top_rated: "bg-amber-50 text-amber-800 border-amber-200",
};

const dots: Record<SellerLevel, string> = {
  new_seller: "bg-ink-faint",
  level_one: "bg-brand-primary",
  level_two: "bg-white",
  top_rated: "bg-amber-600",
};

export function SellerLevelBadge({ level, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold leading-none whitespace-nowrap",
        styles[level],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dots[level])} />
      {LEVEL_LABELS[level]}
    </span>
  );
}
