"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h1 className="font-heading text-2xl mb-2">Submit Your Requirements</h1>
          <p className="text-sm text-neutral-500 mb-6">
            The seller needs details to start. Your delivery clock begins once submitted.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Describe your project requirements, brand guidelines, references, deadlines, etc."
            className="mb-4"
          />
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => router.push(`/order/${id}`)}>
              I&apos;ll do this later
            </Button>
            <Button onClick={submit} disabled={loading || text.length < 10}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Requirements"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
