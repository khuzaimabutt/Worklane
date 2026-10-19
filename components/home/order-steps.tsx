"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface Step {
  icon: ReactNode;
  t: string;
  d: string;
}

/** The four order steps. On wide screens a line draws across the step icons once the list scrolls into view. */
export function OrderSteps({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [drawn, setDrawn] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.8) return;
    setDrawn(false);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ol ref={ref} className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <span
        aria-hidden
        className="steps-line pointer-events-none absolute left-[12.5%] right-[12.5%] top-[2.75rem] hidden lg:block h-px bg-brand-primary/40"
        data-drawn={drawn}
      />
      {steps.map((step, i) => (
        <li key={step.t} className="relative rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center justify-between mb-8">
            <span className="relative z-10 w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center">
              {step.icon}
            </span>
            <span className="font-display text-3xl text-line-strong tabular-nums" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
          </div>
          <h3 className="text-base font-semibold text-ink mb-2">{step.t}</h3>
          <p className="text-sm text-ink-muted leading-relaxed">{step.d}</p>
        </li>
      ))}
    </ol>
  );
}
