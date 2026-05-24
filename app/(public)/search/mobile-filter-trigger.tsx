"use client";

import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MobileFilterTrigger({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="lg:hidden inline-flex items-center gap-2 h-9 px-3 rounded-md border border-line-strong bg-white text-sm font-medium text-ink-muted hover:bg-canvas-subtle"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-2xs font-semibold leading-none">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="px-5 h-14 flex items-center border-b border-line">
          <h2 className="font-heading text-base text-ink">Filters</h2>
        </div>
        <div className="p-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
