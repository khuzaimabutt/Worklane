"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { toast } from "sonner";
import type { Order } from "@/types/database.types";

export function OrderActions({ order, isBuyer }: { order: Order; isBuyer: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [revisionMsg, setRevisionMsg] = useState("");

  async function call(path: string, body?: any, key = path) {
    setLoading(key);
    const res = await fetch(`/api/orders/${order.id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setLoading(null);
    if (!res.ok) {
      toast.error("Action failed");
      return;
    }
    toast.success("Done");
    router.refresh();
  }

  if (order.status === "requires_requirements" && isBuyer) {
    return (
      <div className="bg-warning/5 border border-warning/20 rounded-xl p-6">
        <h3 className="font-semibold mb-2">Submit your requirements to begin</h3>
        <p className="text-sm text-neutral-600 mb-4">
          The seller needs details about your project before they can start. Your delivery clock begins after submission.
        </p>
        <Link href={`/order/${order.id}/requirements`}>
          <Button variant="cta">Submit Requirements</Button>
        </Link>
      </div>
    );
  }

  if (order.status === "in_progress") {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h3 className="font-semibold mb-3">In Progress</h3>
        {order.delivery_due_at && (
          <div className="mb-4">
            <p className="text-sm text-neutral-600">Delivery expected by:</p>
            <CountdownTimer to={order.delivery_due_at} className="text-2xl text-brand-primary" />
          </div>
        )}
        {!isBuyer && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">Deliver Order</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deliver Order</DialogTitle>
                <DialogDescription>Share a message and the buyer will be notified.</DialogDescription>
              </DialogHeader>
              <Textarea value={deliveryMsg} onChange={(e) => setDeliveryMsg(e.target.value)} rows={5} placeholder="Hi! I've attached..." />
              <Button onClick={() => call("deliver", { message: deliveryMsg }, "deliver")} disabled={loading === "deliver"}>
                {loading === "deliver" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Delivery"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  if (order.status === "delivered" && isBuyer) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Delivery Received</h3>
        {order.delivery_message && (
          <div className="bg-white border border-neutral-200 rounded-lg p-3">
            <p className="text-xs text-neutral-500 mb-1">Seller&apos;s message</p>
            <p className="text-sm">{order.delivery_message}</p>
          </div>
        )}
        {order.delivery_files && order.delivery_files.length > 0 && (
          <div className="space-y-2">
            {order.delivery_files.map((url, i) => (
              <a key={i} href={url} className="flex items-center gap-2 text-sm text-brand-primary hover:underline">
                <FileText className="w-4 h-4" /> Delivery file {i + 1} <Download className="w-3 h-3" />
              </a>
            ))}
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => call("accept", undefined, "accept")} disabled={loading === "accept"}>
            {loading === "accept" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept Delivery"}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Request Revision</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a Revision</DialogTitle>
                <DialogDescription>
                  {order.revisions_allowed - order.revisions_used} revisions remaining.
                </DialogDescription>
              </DialogHeader>
              <Textarea value={revisionMsg} onChange={(e) => setRevisionMsg(e.target.value)} rows={5} placeholder="Please change..." />
              <Button onClick={() => call("request-revision", { message: revisionMsg }, "revision")} disabled={loading === "revision"}>
                {loading === "revision" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Revision Request"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
        {order.auto_complete_at && (
          <p className="text-xs text-neutral-500">
            Auto-completes on {new Date(order.auto_complete_at).toLocaleDateString()} if no action.
          </p>
        )}
      </div>
    );
  }

  if (order.status === "completed") {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-success">Order Complete!</h3>
        <div className="flex gap-2 flex-wrap">
          {isBuyer && (
            <>
              <Link href={`/order/${order.id}/review`}><Button variant="cta">Leave a Review</Button></Link>
              <Link href={`/order/${order.id}/tip`}><Button variant="secondary">Send a Tip</Button></Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
