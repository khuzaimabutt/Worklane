import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface PriceDisplayProps {
  subtotal: number;
  serviceFee: number;
  smallOrderFee?: number;
  total: number;
  className?: string;
}

export function PriceDisplay({ subtotal, serviceFee, smallOrderFee = 0, total, className }: PriceDisplayProps) {
  return (
    <div className={cn("text-sm space-y-1", className)}>
      <Row label="Subtotal" value={formatMoney(subtotal)} />
      <Row label="Service fee (5.5%)" value={formatMoney(serviceFee)} muted />
      {smallOrderFee > 0 && <Row label="Small-order fee" value={formatMoney(smallOrderFee)} muted />}
      <div className="border-t border-neutral-200 pt-2 mt-2">
        <Row label="Total" value={formatMoney(total)} bold />
      </div>
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={cn(muted && "text-neutral-500", bold && "font-semibold")}>{label}</span>
      <span className={cn("tabular-nums", bold && "font-semibold")}>{value}</span>
    </div>
  );
}
