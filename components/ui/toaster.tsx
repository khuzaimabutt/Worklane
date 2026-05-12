"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        className: "rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-md",
      }}
    />
  );
}
