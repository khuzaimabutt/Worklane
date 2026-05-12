"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/utils/format";
import { calculateTipBreakdown, DEFAULT_PLATFORM_SETTINGS } from "@/lib/utils/fee-calculator";
import { toast } from "sonner";

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
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h1 className="font-heading text-2xl mb-2">Show Your Appreciation 🎁</h1>
          <p className="text-sm text-neutral-500 mb-6">Send the seller a tip for their work.</p>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={`py-2 rounded-lg border font-medium ${
                  amount === p && !custom ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-neutral-300"
                }`}
              >
                ${p}
              </button>
            ))}
          </div>
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Custom amount"
            className="mb-4"
          />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Optional message..."
            className="mb-4"
          />
          <div className="bg-neutral-50 rounded-lg p-3 text-xs space-y-1 mb-4">
            <div className="flex justify-between"><span>Tip amount</span><span>{formatMoney(breakdown.amount)}</span></div>
            <div className="flex justify-between text-neutral-500"><span>Platform (20%)</span><span>−{formatMoney(breakdown.platformCommission)}</span></div>
            <div className="flex justify-between font-semibold border-t border-neutral-200 pt-1 mt-1">
              <span>Seller receives</span><span>{formatMoney(breakdown.sellerAmount)}</span>
            </div>
          </div>
          <Button variant="cta" size="lg" className="w-full" onClick={submit} disabled={loading || finalAmount < 1}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Send Tip — ${formatMoney(finalAmount)}`}
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
