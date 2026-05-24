"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/utils/format";
import type { GigPackage } from "@/types/database.types";

export function StickyMobileCTA({
  gigId,
  packages,
}: {
  gigId: string;
  packages: GigPackage[];
}) {
  if (!packages || packages.length === 0) return null;
  const lowest = packages.reduce((min, p) => (Number(p.price) < Number(min.price) ? p : min), packages[0]);
  const orderUrl = `/checkout?gig=${gigId}&pkg=${lowest.id}`;

  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-line shadow-popover">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs uppercase tracking-wider text-ink-subtle font-semibold leading-none mb-0.5">
            From
          </p>
          <p className="text-lg font-semibold text-ink tabular-nums leading-tight">
            {formatMoney(Number(lowest.price))}
          </p>
        </div>
        <Link
          href={orderUrl}
          className="inline-flex h-11 px-5 items-center rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors shrink-0"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
