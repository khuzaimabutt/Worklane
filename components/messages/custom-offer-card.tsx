"use client";
import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils/format";
import { toast } from "sonner";

interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_days: number;
  revisions: number;
  status: string;
}

export function CustomOfferCard({ offerId, mine }: { offerId: string; mine: boolean }) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.from("custom_offers").select("*").eq("id", offerId).single().then(({ data }) => setOffer(data as Offer));
  }, [offerId]);

  if (!offer) return null;

  async function accept() {
    setLoading(true);
    const res = await fetch(`/api/custom-offers/${offerId}/accept`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      toast.success("Offer accepted! Order created.");
    } else toast.error("Failed to accept");
  }

  return (
    <div className={`max-w-md ${mine ? "ml-auto" : ""}`}>
      <div className="bg-white border-2 border-brand-primary rounded-xl p-4">
        <div className="flex items-center gap-2 text-brand-primary text-xs font-semibold mb-2 uppercase">
          <Briefcase className="w-4 h-4" />
          Custom Offer
        </div>
        <h4 className="font-semibold mb-1">{offer.title}</h4>
        <p className="text-sm text-neutral-600 mb-3">{offer.description}</p>
        <div className="flex items-center gap-3 text-sm font-medium mb-3">
          <span className="font-heading text-xl">{formatMoney(Number(offer.price))}</span>
          <span className="text-neutral-500">·</span>
          <span>{offer.delivery_days} days</span>
          <span className="text-neutral-500">·</span>
          <span>{offer.revisions} revisions</span>
        </div>
        {offer.status === "pending" && !mine && (
          <div className="flex gap-2">
            <Button onClick={accept} disabled={loading} variant="cta">Accept Offer</Button>
            <Button variant="secondary">Decline</Button>
          </div>
        )}
        {offer.status !== "pending" && (
          <p className="text-xs text-neutral-500 capitalize">{offer.status}</p>
        )}
      </div>
    </div>
  );
}
