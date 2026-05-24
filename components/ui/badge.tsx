import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold leading-none whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-primary-50 text-brand-primary-dark border border-brand-primary/15",
        solid: "bg-brand-primary text-white",
        secondary: "bg-canvas-subtle text-ink-muted border border-line",
        outline: "bg-white border border-line-strong text-ink-muted",
        success: "bg-green-50 text-green-700 border border-green-100",
        warning: "bg-amber-50 text-amber-800 border border-amber-100",
        error: "bg-red-50 text-red-700 border border-red-100",
        info: "bg-blue-50 text-blue-700 border border-blue-100",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
