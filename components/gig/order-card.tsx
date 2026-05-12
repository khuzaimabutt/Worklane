"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/format";
import { calculateOrderPricing, DEFAULT_PLATFORM_SETTINGS } from "@/lib/utils/fee-calculator";
import type { GigPackage, GigExtra } from "@/types/database.types";

export function OrderCard({
  gigId,
  packages,
  extras,
}: {
  gigId: string;
  packages: GigPackage[];
  extras: GigExtra[];
}) {
  const [pkgType, setPkgType] = useState<string>(packages[0]?.package_type ?? "basic");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const currentPkg = packages.find((p) => p.package_type === pkgType) ?? packages[0];
  const extrasTotal = useMemo(
    () => extras.filter((e) => selectedExtras.includes(e.id)).reduce((sum, e) => sum + Number(e.price), 0),
    [extras, selectedExtras]
  );

  const pricing = calculateOrderPricing(Number(currentPkg?.price ?? 0), extrasTotal, DEFAULT_PLATFORM_SETTINGS);

  function toggleExtra(id: string) {
    setSelectedExtras((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const orderUrl = `/checkout?gig=${gigId}&pkg=${currentPkg?.id}&extras=${selectedExtras.join(",")}`;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <Tabs value={pkgType} onValueChange={setPkgType}>
        <TabsList className="w-full px-4">
          {packages.map((p) => (
            <TabsTrigger key={p.package_type} value={p.package_type} className="flex-1 capitalize">
              {p.package_type}
            </TabsTrigger>
          ))}
        </TabsList>
        {packages.map((p) => (
          <TabsContent key={p.id} value={p.package_type} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-xs text-neutral-500 mt-1">{p.description}</p>
              </div>
              <p className="font-heading text-3xl">{formatMoney(Number(p.price))}</p>
            </div>
            <ul className="space-y-1 text-sm">
              {(p.features ?? []).map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  {f.included ? (
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                  )}
                  <span className={f.included ? "text-neutral-900" : "text-neutral-400 line-through"}>{f.name}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm pt-2 border-t border-neutral-100">
              <span>⏱ {p.delivery_days} days delivery</span>
              <span>↺ {p.revisions === -1 ? "Unlimited" : p.revisions} revisions</span>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {extras.length > 0 && (
        <div className="border-t border-neutral-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Add-ons</p>
          {extras.map((ex) => (
            <label key={ex.id} className="flex items-center justify-between text-sm cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(ex.id)}
                  onChange={() => toggleExtra(ex.id)}
                  className="text-brand-primary"
                />
                <span>{ex.title}</span>
              </div>
              <span className="font-medium">+{formatMoney(Number(ex.price))}</span>
            </label>
          ))}
        </div>
      )}

      <div className="border-t border-neutral-200 p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Package</span>
          <span className="tabular-nums">{formatMoney(pricing.gigBasePrice)}</span>
        </div>
        {pricing.extrasPrice > 0 && (
          <div className="flex justify-between">
            <span>Add-ons</span>
            <span className="tabular-nums">+{formatMoney(pricing.extrasPrice)}</span>
          </div>
        )}
        <div className="flex justify-between text-neutral-500">
          <span>Service fee (5.5%)</span>
          <span className="tabular-nums">{formatMoney(pricing.buyerServiceFee)}</span>
        </div>
        {pricing.buyerSmallOrderFee > 0 && (
          <div className="flex justify-between text-neutral-500">
            <span>Small order fee</span>
            <span className="tabular-nums">{formatMoney(pricing.buyerSmallOrderFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold pt-1 border-t border-neutral-100">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(pricing.buyerTotalPaid)}</span>
        </div>
      </div>

      <div className="p-4 space-y-2 border-t border-neutral-200">
        <Link href={orderUrl} className="block">
          <Button variant="cta" size="lg" className="w-full">
            Order Now — {formatMoney(pricing.buyerTotalPaid)}
          </Button>
        </Link>
        <Button variant="secondary" className="w-full">Contact Seller</Button>
        <button className="w-full text-xs text-brand-primary hover:underline">Request Custom Offer</button>
      </div>
    </div>
  );
}
