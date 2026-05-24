"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

function SuccessInner() {
  const search = useSearchParams();
  const orderId = search.get("order");

  return (
    <main className="max-w-md mx-auto px-4 py-16 sm:py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-7 h-7 text-success" />
      </div>
      <h1 className="font-heading text-2xl sm:text-3xl text-ink mb-3">Order confirmed</h1>
      <p className="text-sm text-ink-muted leading-relaxed mb-8 text-balance">
        Your payment is held in escrow. The seller has been notified — submit your requirements
        so they can get started.
      </p>
      <div className="flex flex-col gap-2.5">
        {orderId && (
          <Link
            href={`/order/${orderId}/requirements`}
            className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors"
          >
            Submit requirements
          </Link>
        )}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-line-strong text-sm font-medium text-ink hover:bg-canvas-subtle transition-colors"
        >
          View all orders
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<main className="py-16 text-center text-ink-faint">Loading…</main>}>
        <SuccessInner />
      </Suspense>
      <Footer />
    </>
  );
}
