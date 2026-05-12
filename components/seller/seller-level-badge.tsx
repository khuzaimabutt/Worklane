import { Badge } from "@/components/ui/badge";
import { LEVEL_LABELS } from "@/lib/utils/seller-levels";
import type { SellerLevel } from "@/types/database.types";
import { cn } from "@/lib/utils/cn";

interface Props {
  level: SellerLevel;
  className?: string;
}

const styles: Record<SellerLevel, string> = {
  new_seller: "bg-neutral-500 text-white",
  level_one: "bg-blue-500 text-white",
  level_two: "bg-purple-500 text-white",
  top_rated: "bg-amber-500 text-white",
};

export function SellerLevelBadge({ level, className }: Props) {
  return (
    <Badge className={cn(styles[level], "uppercase tracking-wide text-[10px]", className)}>
      {LEVEL_LABELS[level]}
    </Badge>
  );
}
