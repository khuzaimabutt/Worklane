export type NotificationType =
  | "new_order"
  | "order_delivered"
  | "order_completed"
  | "order_cancelled"
  | "revision_requested"
  | "review_received"
  | "tip_received"
  | "message_received"
  | "custom_offer_received"
  | "gig_approved"
  | "gig_rejected"
  | "funds_cleared"
  | "withdrawal_processed"
  | "dispute_opened"
  | "level_changed";

export async function createNotification(
  client: any,
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    actionUrl?: string;
  }
) {
  return client.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    action_url: params.actionUrl ?? null,
  });
}
