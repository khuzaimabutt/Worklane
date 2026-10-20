"use client";

import Link from "next/link";
import type { ReactNode } from "react";

// A link that tracks the pointer and lights the card under it. CSS (.cat-spot) draws the light.
export function SpotlightLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  function track(e: React.PointerEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <Link href={href} className={`cat-spot ${className ?? ""}`} onPointerMove={track}>
      {children}
    </Link>
  );
}
