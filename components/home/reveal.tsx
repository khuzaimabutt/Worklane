"use client";
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

type State = "visible" | "pre" | "in";

/**
 * Fades and lifts its child into place the first time it scrolls into view.
 * Server render and above-the-fold content stay fully visible (no flash, no layout shift).
 * Only opacity and transform change. Skipped under prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("visible");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) return;
    setState("pre");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as any;
  return (
    <Component
      ref={ref}
      className={cn("reveal", state === "pre" && "reveal-pre", state === "in" && "reveal-in", className)}
      style={{ ...style, transitionDelay: state === "in" ? `${delay}ms` : undefined }}
    >
      {children}
    </Component>
  );
}
