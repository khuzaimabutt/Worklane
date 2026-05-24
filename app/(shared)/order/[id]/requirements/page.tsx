"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function RequirementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}/submit-requirements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirements: text }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Requirements submitted");
      router.push(`/order/${id}`);
    } else {
      toast.error("Failed to submit");
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
            <div className="w-10 h-10 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="font-heading text-xl text-ink">Submit your requirements</h1>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            The seller needs project details to start work. Your delivery clock starts the moment
            you submit.
          </p>

          <label className="block text-sm font-medium text-ink mb-1.5">Requirements</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Describe your project, brand guidelines, references, deadlines, links to relevant docs, etc."
          />
          <p className="text-2xs text-ink-subtle mt-1">{text.length} characters · min 10</p>

          <div className="mt-6 pt-5 border-t border-line flex justify-between gap-3">
            <button
              onClick={() => router.push(`/order/${id}`)}
              className="inline-flex h-10 px-4 items-center rounded-md text-sm font-medium text-ink-muted hover:bg-canvas-subtle hover:text-ink transition-colors"
            >
              I&apos;ll do this later
            </button>
            <button
              onClick={submit}
              disabled={loading || text.length < 10}
              className="inline-flex h-10 px-5 items-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit requirements
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
