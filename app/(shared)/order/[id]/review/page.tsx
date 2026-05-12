"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/ui/rating-stars";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [overall, setOverall] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [described, setDescribed] = useState(5);
  const [recommend, setRecommend] = useState(true);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: id,
        overall_rating: overall,
        communication_rating: communication,
        service_as_described_rating: described,
        would_recommend: recommend,
        review_text: text,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Review posted!");
      router.push(`/order/${id}`);
    } else {
      toast.error("Failed to post review");
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h1 className="font-heading text-2xl mb-2">Leave a Review</h1>
          <p className="text-sm text-neutral-500 mb-6">Your review is public and permanent.</p>

          <div className="space-y-6">
            <RatingRow label="Overall experience" value={overall} onChange={setOverall} />
            <RatingRow label="Communication" value={communication} onChange={setCommunication} />
            <RatingRow label="Service as described" value={described} onChange={setDescribed} />
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Would you recommend this seller?</label>
              <Switch checked={recommend} onCheckedChange={setRecommend} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Your review</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Share your experience working with this seller..."
              />
              <p className="text-xs text-neutral-500 mt-1">{text.length}/1000 (min 15)</p>
            </div>
            <Button onClick={submit} disabled={loading || text.length < 15} variant="cta" size="lg" className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Review"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">{label}</label>
      <RatingStars value={value} onChange={onChange} interactive size={24} />
    </div>
  );
}
