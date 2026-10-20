import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/utils/format";
import { SpotlightLink } from "./spotlight-link";

export interface CategoryCardData {
  id: string;
  slug: string;
  name: string;
  count: number;
  minPrice: number | null;
  chips: string[];
  thumbs: string[];
}

export function CategoryCard({
  cat,
  Icon,
  featured = false,
}: {
  cat: CategoryCardData;
  Icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
}) {
  const empty = cat.count === 0;
  const [base, float] = cat.thumbs;

  return (
    <SpotlightLink
      href={`/category/${cat.slug}`}
      className={`cat-card group relative isolate flex h-full min-h-[240px] flex-col overflow-hidden rounded-3xl text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
        empty ? "bg-brand-primary cat-empty" : "bg-ink"
      } ${featured ? "min-h-[320px] sm:min-h-[400px] lg:min-h-[520px]" : ""}`}
    >
      {base && (
        <Image
          src={base}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 80vw"
          className="cat-photo -z-10 object-cover"
        />
      )}
      {float && (
        <div className="cat-float absolute -right-3 top-[18%] -z-10 hidden h-[46%] w-[46%] overflow-hidden rounded-2xl border-2 border-white/40 shadow-2xl sm:block">
          <Image src={float} alt="" fill sizes="25vw" className="object-cover" />
        </div>
      )}
      {!empty && (
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/15" />
      )}

      <div className="flex flex-1 flex-col justify-between gap-6 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
            <Icon className="h-5 w-5" />
          </span>
          <span className="cat-arrow flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink">
            <ArrowUpRight className="h-5 w-5" aria-hidden />
          </span>
        </div>

        <div>
          <h3 className={`font-heading text-white ${featured ? "text-3xl sm:text-4xl" : "text-2xl"} leading-tight mb-2`}>
            {cat.name}
          </h3>
          <p className="text-sm text-white/80 flex items-center gap-2 flex-wrap">
            <span>{empty ? "New category" : cat.count === 1 ? "1 service" : `${cat.count} services`}</span>
            {cat.minPrice != null && (
              <>
                <span aria-hidden className="h-1 w-1 rounded-full bg-white/50" />
                <span>
                  From <span className="font-heading text-base text-white tabular-nums">{Number.isInteger(cat.minPrice) ? `$${cat.minPrice}` : formatMoney(cat.minPrice)}</span>
                </span>
              </>
            )}
          </p>
          {empty && <p className="mt-3 text-sm text-white/90">Be the first seller in {cat.name}.</p>}
          {!empty && cat.chips.length > 0 && (
            <ul className="cat-chips mt-4 flex flex-wrap gap-1.5" aria-label="Examples">
              {cat.chips.map((c) => (
                <li
                  key={c}
                  className="inline-flex max-w-full items-center rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                >
                  <span className="truncate">{c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SpotlightLink>
  );
}
