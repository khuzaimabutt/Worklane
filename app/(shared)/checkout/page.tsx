"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Loader2, Info } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/ui/price-display";
import { createClient } from "@/lib/supabase/client";
import { calculateOrderPricing, DEFAULT_PLATFORM_SETTINGS } from "@/lib/utils/fee-calculator";
import { formatMoney } from "@/lib/utils/format";
import { toast } from "sonner";
import type { GigPackage, Gig } from "@/types/database.types";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" /></div>}>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const router = useRouter();
  const search = useSearchParams();
  const gigId = search.get("gig");
  const pkgId = search.get("pkg");
  const extrasParam = search.get("extras") || "";

  const [gig, setGig] = useState<Gig | null>(null);
  const [pkg, setPkg] = useState<GigPackage | null>(null);
  const [extras, setExtras] = useState<any[]>([]);
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gigId || !pkgId) return;
    const sb = createClient();
    (async () => {
      const [{ data: g }, { data: p }, { data: ex }] = await Promise.all([
        sb.from("gigs").select("*").eq("id", gigId).single(),
        sb.from("gig_packages").select("*").eq("id", pkgId).single(),
        sb.from("gig_extras").select("*").in("id", extrasParam ? extrasParam.split(",").filter(Boolean) : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      setGig(g as Gig);
      setPkg(p as GigPackage);
      setExtras(ex ?? []);
    })();
  }, [gigId, pkgId, extrasParam]);

  if (!gig || !pkg) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
        </main>
        <Footer />
      </>
    );
  }

  const extrasTotal = extras.reduce((s, e) => s + Number(e.price), 0);
  const pricing = calculateOrderPricing(Number(pkg.price), extrasTotal, DEFAULT_PLATFORM_SETTINGS);

  async function placeOrder() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gig_id: gigId,
          package_id: pkgId,
          selected_extras: extras.map((e) => ({ id: e.id, title: e.title, price: Number(e.price) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");
      toast.success("Order placed!");
      router.push(`/order/${data.order.id}/requirements`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl mb-6">Checkout</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <p className="text-sm font-medium mb-1">{gig.title}</p>
            <p className="text-xs text-neutral-500 mb-4">
              {pkg.name} · {pkg.delivery_days} days · {pkg.revisions === -1 ? "Unlimited" : pkg.revisions} revisions
            </p>
            {extras.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-neutral-500 mb-1">Add-ons</p>
                {extras.map((e) => (
                  <div key={e.id} className="flex justify-between text-sm">
                    <span>{e.title}</span>
                    <span>{formatMoney(Number(e.price))}</span>
                  </div>
                ))}
              </div>
            )}
            <PriceDisplay
              subtotal={pricing.orderSubtotal}
              serviceFee={pricing.buyerServiceFee}
              smallOrderFee={pricing.buyerSmallOrderFee}
              total={pricing.buyerTotalPaid}
              className="border-t border-neutral-100 pt-3"
            />
            <p className="text-xs text-neutral-500 mt-4">
              Funds held securely in escrow until you accept delivery.
            </p>
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-start gap-2 bg-info/10 border border-info/20 rounded-lg p-3 mb-4 text-xs text-info">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Demo mode:</strong> Stripe is in test mode. Use card{" "}
                <code className="bg-white px-1 rounded">4242 4242 4242 4242</code>, any future expiry, any CVC.
              </p>
            </div>
            <h2 className="font-semibold mb-4">Payment Method</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Card Number</label>
                <Input
                  value={card}
                  onChange={(e) => setCard(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="4242 4242 4242 4242"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry</label>
                  <Input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM/YY" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVC</label>
                  <Input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name on Card</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <Button variant="cta" size="lg" className="w-full mt-6" onClick={placeOrder} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Place Order — ${formatMoney(pricing.buyerTotalPaid)}`}
            </Button>
            <p className="text-xs text-neutral-500 mt-3 flex items-center gap-1 justify-center">
              <Lock className="w-3 h-3" /> Secured by Stripe. Your payment info is encrypted.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
