"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Star, ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <Link
          href={`/order/${id}`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to order
        </Link>

        <div className="bg-white border border-line rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <h1 className="font-heading text-xl text-ink">Leave a review</h1>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            Your review is public and permanent. Be specific — buyers and sellers both rely on
            real feedback.
          </p>

          <div className="space-y-5">
            <RatingRow label="Overall experience" value={overall} onChange={setOverall} />
            <RatingRow label="Communication" value={communication} onChange={setCommunication} />
            <RatingRow label="Service as described" value={described} onChange={setDescribed} />

            <div className="flex items-center justify-between gap-3 py-3 border-y border-line">
              <label htmlFor="recommend" className="text-sm font-medium text-ink">
                Would you recommend this seller?
              </label>
              <Switch id="recommend" checked={recommend} onCheckedChange={setRecommend} />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Your review</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Share your experience working with this seller…"
              />
              <p className="text-2xs text-ink-subtle mt-1">{text.length}/1000 · min 15</p>
            </div>

            <button
              onClick={submit}
              disabled={loading || text.length < 15}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Post review
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-ink">{label}</label>
      <RatingStars value={value} onChange={onChange} interactive size={22} />
    </div>
  );
}
