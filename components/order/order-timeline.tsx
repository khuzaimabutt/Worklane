import { Check, Circle } from "lucide-react";
import type { OrderStatus } from "@/types/database.types";
import { cn } from "@/lib/utils/cn";

const STEPS: { key: OrderStatus | "ordered"; label: string }[] = [
  { key: "ordered", label: "Order Placed" },
  { key: "requires_requirements", label: "Requirements" },
  { key: "in_progress", label: "In Progress" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  pending_payment: 0,
  active: 1,
  requires_requirements: 1,
  in_progress: 2,
  delivered: 3,
  revision_requested: 2,
  completed: 4,
  cancelled: -1,
  disputed: 3,
};

export function OrderTimeline({
  status,
  delivered,
  completed,
}: {
  status: OrderStatus;
  delivered: string | null;
  completed: string | null;
}) {
  const current = STATUS_INDEX[status];
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={step.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    done && "bg-success text-white",
                    active && "bg-brand-primary text-white animate-pulse-soft",
                    !done && !active && "bg-neutral-100 text-neutral-400"
                  )}
                >
                  {done ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                </div>
                <p className={cn("text-xs mt-2", active ? "font-semibold" : "text-neutral-500")}>
                  {step.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5", done ? "bg-success" : "bg-neutral-200")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
