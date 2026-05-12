"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
}

export function Sidebar({ items, title }: { items: SidebarItem[]; title?: string }) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-neutral-200 bg-white hidden lg:block">
      <nav className="p-4 space-y-1 sticky top-16">
        {title && <h3 className="text-xs font-semibold uppercase text-neutral-500 px-2 mb-2">{title}</h3>}
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-brand-primary/10 text-brand-primary font-medium"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className="bg-brand-accent text-white text-xs px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
