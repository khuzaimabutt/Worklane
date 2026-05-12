"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

function SuccessInner() {
  const search = useSearchParams();
  const orderId = search.get("order");

  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-success" />
      </div>
      <h1 className="font-heading text-4xl mb-3">Order Confirmed!</h1>
      <p className="text-neutral-600 mb-8">
        Your payment was successful. The seller has been notified — submit your requirements to get started.
      </p>
      <div className="flex flex-col gap-3">
        {orderId && (
          <Link href={`/order/${orderId}/requirements`}>
            <Button variant="cta" size="lg" className="w-full">Submit Requirements</Button>
          </Link>
        )}
        <Link href="/dashboard">
          <Button variant="secondary" className="w-full">View All Orders</Button>
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<main className="py-16 text-center text-neutral-400">Loading…</main>}>
        <SuccessInner />
      </Suspense>
      <Footer />
    </>
  );
}
