"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Gift, ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/utils/format";
import { calculateTipBreakdown, DEFAULT_PLATFORM_SETTINGS } from "@/lib/utils/fee-calculator";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

const PRESETS = [5, 10, 20, 50];

export default function TipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const finalAmount = custom ? parseFloat(custom) || 0 : amount;
  const breakdown = calculateTipBreakdown(finalAmount, DEFAULT_PLATFORM_SETTINGS);

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}/tip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalAmount, message }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Tip sent!");
      router.push(`/order/${id}`);
    } else {
      toast.error("Failed to send tip");
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <Link
          href={`/order/${id}`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to order
        </Link>

        <div className="bg-white border border-line rounded-2xl p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-brand-accent/15 text-brand-accent-dark flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <h1 className="font-heading text-xl text-ink">Send a tip</h1>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            Show appreciation for great work. Tips go directly to your seller&apos;s balance.
          </p>

          <label className="block text-sm font-medium text-ink mb-1.5">Amount</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={cn(
                  "h-10 rounded-md border text-sm font-semibold tabular-nums transition-colors",
                  amount === p && !custom
                    ? "border-brand-primary bg-brand-primary-50 text-brand-primary-dark"
                    : "border-line-strong text-ink hover:bg-canvas-subtle"
                )}
              >
                ${p}
              </button>
            ))}
          </div>
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Custom amount"
            inputMode="decimal"
            className="mb-4"
          />

          <label className="block text-sm font-medium text-ink mb-1.5">Message (optional)</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Thanks for the great work…"
            className="mb-5"
          />

          <div className="bg-canvas-subtle border border-line rounded-lg p-3 text-sm space-y-1.5 mb-5">
            <div className="flex justify-between text-ink-muted">
              <span>Tip amount</span>
              <span className="tabular-nums">{formatMoney(breakdown.amount)}</span>
            </div>
            <div className="flex justify-between text-ink-subtle text-xs">
              <span>Platform fee (20%)</span>
              <span className="tabular-nums">−{formatMoney(breakdown.platformCommission)}</span>
            </div>
            <div className="flex justify-between font-semibold text-ink pt-2 mt-1 border-t border-line">
              <span>Seller receives</span>
              <span className="tabular-nums">{formatMoney(breakdown.sellerAmount)}</span>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading || finalAmount < 1}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send tip · {formatMoney(finalAmount)}
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
