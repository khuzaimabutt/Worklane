"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "best_selling", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top rated" },
];

export function SortSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const search = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(search?.toString() ?? "");
    if (e.target.value === "relevance") params.delete("sort");
    else params.set("sort", e.target.value);
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-ink-subtle">Sort by</label>
      <select
        id="sort"
        defaultValue={defaultValue}
        onChange={onChange}
        className="h-9 pl-3 pr-8 bg-white border border-line-strong rounded-md text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
