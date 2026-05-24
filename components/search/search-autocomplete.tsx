"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Tag, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Suggestion = {
  categories: Array<{ id: string; slug: string; name: string; gig_count: number | null }>;
  gigs: Array<{ id: string; slug: string; title: string; thumbnail_url: string | null; average_rating: number | null }>;
};

interface Props {
  placeholder?: string;
  size?: "md" | "lg";
  className?: string;
  initialQuery?: string;
}

export function SearchAutocomplete({
  placeholder = "What service are you looking for?",
  size = "md",
  className,
  initialQuery = "",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [data, setData] = useState<Suggestion>({ categories: [], gigs: [] });
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        setData({ categories: [], gigs: [] });
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const json = (await res.json()) as Suggestion;
          setData(json);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items: Array<{ kind: "category" | "gig"; href: string; label: string; meta?: string; thumb?: string | null; rating?: number | null }> = [
    ...data.categories.map((c) => ({
      kind: "category" as const,
      href: `/category/${c.slug}`,
      label: c.name,
      meta: c.gig_count ? `${c.gig_count} gigs` : undefined,
    })),
    ...data.gigs.map((g) => ({
      kind: "gig" as const,
      href: `/gig/${g.slug}`,
      label: g.title,
      thumb: g.thumbnail_url,
      rating: g.average_rating,
    })),
  ];

  function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (active >= 0 && items[active]) {
      router.push(items[active].href);
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    const q = query.trim();
    if (q.length === 0) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && (loading || items.length > 0 || query.trim().length >= 2);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <form onSubmit={submit} className="relative">
        <Search
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none",
            size === "lg" ? "left-3.5 w-4 h-4" : "left-3 w-4 h-4"
          )}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full bg-canvas-subtle border border-transparent rounded-md text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-colors",
            size === "lg" ? "h-12 pl-10 pr-4 shadow-card" : "h-10 pl-9 pr-4"
          )}
        />
      </form>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-line rounded-xl shadow-popover overflow-hidden z-50"
        >
          {loading && items.length === 0 ? (
            <div className="px-4 py-3 text-xs text-ink-subtle">Searching…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-4 text-sm text-ink-subtle">
              No matches. Press Enter to search anyway.
            </div>
          ) : (
            <>
              {data.categories.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-2xs font-semibold uppercase tracking-wider text-ink-subtle flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />
                    Categories
                  </p>
                  {data.categories.map((c, i) => (
                    <SuggestionRow
                      key={c.id}
                      href={`/category/${c.slug}`}
                      active={active === i}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => setOpen(false)}
                      icon={<Tag className="w-4 h-4 text-ink-faint" />}
                      label={c.name}
                      meta={c.gig_count ? `${c.gig_count} gigs` : undefined}
                    />
                  ))}
                </div>
              )}
              {data.gigs.length > 0 && (
                <div className="border-t border-line">
                  <p className="px-4 pt-3 pb-1 text-2xs font-semibold uppercase tracking-wider text-ink-subtle flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Top gigs
                  </p>
                  {data.gigs.map((g, i) => {
                    const idx = data.categories.length + i;
                    return (
                      <SuggestionRow
                        key={g.id}
                        href={`/gig/${g.slug}`}
                        active={active === idx}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => setOpen(false)}
                        icon={
                          g.thumbnail_url ? (
                            <div className="relative w-7 h-7 rounded-md overflow-hidden bg-canvas-subtle shrink-0">
                              <Image src={g.thumbnail_url} alt="" fill className="object-cover" sizes="28px" />
                            </div>
                          ) : (
                            <Sparkles className="w-4 h-4 text-ink-faint" />
                          )
                        }
                        label={g.title}
                        meta={
                          g.average_rating && g.average_rating > 0 ? (
                            <span className="inline-flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {g.average_rating.toFixed(1)}
                            </span>
                          ) : undefined
                        }
                      />
                    );
                  })}
                </div>
              )}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setOpen(false)}
                className="block border-t border-line px-4 py-2.5 text-xs font-medium text-brand-primary-dark hover:bg-canvas-subtle text-center"
              >
                See all results for &quot;{query.trim()}&quot;
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  href,
  active,
  onMouseEnter,
  onClick,
  icon,
  label,
  meta,
}: {
  href: string;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  meta?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      role="option"
      aria-selected={active}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
        active ? "bg-brand-primary-50 text-brand-primary-dark" : "text-ink hover:bg-canvas-subtle"
      )}
    >
      <span className="shrink-0 flex items-center justify-center">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {meta && <span className="text-2xs text-ink-subtle shrink-0">{meta}</span>}
    </Link>
  );
}
