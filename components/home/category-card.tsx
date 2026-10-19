import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/utils/format";

export interface CategoryCardData {
  id: string;
  slug: string;
  name: string;
  count: number;
  minPrice: number | null;
  chips: string[];
}

export function CategoryCard({
  cat,
  Icon,
}: {
  cat: CategoryCardData;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={`/category/${cat.slug}`}
      className="cat-card group relative flex h-full min-h-[44px] flex-col rounded-2xl border border-line bg-white p-5 sm:p-6 hover:border-brand-primary focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary transition-colors duration-200 group-hover:bg-brand-primary group-hover:text-white group-focus-visible:bg-brand-primary group-focus-visible:text-white">
          <Icon className="h-5 w-5" />
        </span>
        <ArrowUpRight
          className="cat-arrow h-6 w-6 text-ink-faint group-hover:text-brand-primary group-focus-visible:text-brand-primary"
          aria-hidden
        />
      </div>
      <h3 className="font-display text-xl text-ink truncate mb-1">{cat.name}</h3>
      <p className="text-sm text-ink-subtle mb-4 flex items-center gap-2 flex-wrap">
        <span>{cat.count === 0 ? "New" : cat.count === 1 ? "1 service" : `${cat.count} services`}</span>
        {cat.minPrice != null && (
          <>
            <span aria-hidden className="h-1 w-1 rounded-full bg-line-strong" />
            <span>
              From <span className="font-display text-base text-ink tabular-nums">{Number.isInteger(cat.minPrice) ? `$${cat.minPrice}` : formatMoney(cat.minPrice)}</span>
            </span>
          </>
        )}
      </p>
      {cat.chips.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-1.5" aria-label="Examples">
          {cat.chips.map((c) => (
            <li
              key={c}
              className="inline-flex max-w-full items-center rounded-full border border-line-strong bg-canvas-subtle px-2.5 py-1 text-xs font-medium text-ink-muted"
            >
              <span className="truncate">{c}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
