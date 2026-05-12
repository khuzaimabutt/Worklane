"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const REJECT_REASONS = [
  "Low quality thumbnail",
  "Misleading title or description",
  "Incomplete description (under 120 words)",
  "Pricing issues",
  "Inappropriate content",
  "Category mismatch",
  "Other",
];

export function GigReviewActions({ gigId }: { gigId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    const res = await fetch(`/api/admin/gigs/${gigId}/${action}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: action === "reject" ? JSON.stringify({ reason, details }) : undefined,
    });
    setLoading(null);
    if (res.ok) {
      toast.success(action === "approve" ? "Gig approved" : "Gig rejected");
      router.refresh();
    } else toast.error("Failed");
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => act("approve")} disabled={loading !== null}>
        {loading === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="danger">Reject</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Gig</DialogTitle>
          </DialogHeader>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-neutral-300 rounded-lg p-2 text-sm">
            {REJECT_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Additional details for the seller..." />
          <Button variant="danger" onClick={() => act("reject")} disabled={loading !== null}>
            {loading === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Rejection"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
