import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {icon && <div className="mb-4 text-neutral-300">{icon}</div>}
      <h3 className="font-heading text-xl mb-2">{title}</h3>
      {description && <p className="text-neutral-500 mb-4 max-w-md">{description}</p>}
      {action}
    </div>
  );
}
