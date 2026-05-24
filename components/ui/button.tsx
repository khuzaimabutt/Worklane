import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-primary text-white hover:bg-brand-primary-dark",
        cta: "bg-brand-accent text-white hover:bg-brand-accent-dark font-semibold focus-visible:ring-brand-accent",
        secondary: "bg-white border border-line-strong text-ink hover:bg-canvas-subtle hover:border-ink-faint",
        ghost: "text-ink-muted hover:bg-ink/5 hover:text-ink",
        link: "text-brand-primary hover:text-brand-primary-dark underline-offset-4 hover:underline h-auto px-0",
        danger: "bg-error text-white hover:bg-red-600 focus-visible:ring-error",
        outline: "border border-line-strong bg-white text-ink hover:bg-canvas-subtle",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5 text-base",
        xl: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
