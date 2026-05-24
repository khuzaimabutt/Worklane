"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      offset={16}
      gap={8}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group !flex !gap-3 !items-start !px-4 !py-3 !rounded-xl !border !shadow-popover !bg-white !text-ink !font-sans !text-sm !w-full",
          title: "!text-sm !font-semibold !text-ink",
          description: "!text-xs !text-ink-subtle !leading-relaxed !mt-0.5",
          actionButton:
            "!bg-brand-primary !text-white !text-xs !font-semibold !rounded-md !h-7 !px-3 hover:!bg-brand-primary-dark",
          cancelButton: "!bg-canvas-subtle !text-ink-muted !text-xs !rounded-md !h-7 !px-3",
          success: "!border-green-100 !bg-green-50",
          error: "!border-red-100 !bg-red-50",
          info: "!border-blue-100 !bg-blue-50",
          warning: "!border-amber-100 !bg-amber-50",
        },
      }}
      icons={{
        success: (
          <svg className="w-4 h-4 text-green-700" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        error: (
          <svg className="w-4 h-4 text-red-700" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        ),
        info: (
          <svg className="w-4 h-4 text-blue-700" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="7" fillOpacity="0.1" />
            <path d="M8 6.5v4M8 4.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        ),
        warning: (
          <svg className="w-4 h-4 text-amber-700" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2.5L1.5 13.5h13L8 2.5z" strokeLinejoin="round" />
            <path d="M8 7v3M8 12v.01" strokeLinecap="round" />
          </svg>
        ),
      }}
    />
  );
}
