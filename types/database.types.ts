// Hand-written DB types — replace with `npx supabase gen types typescript --linked > types/database.types.ts` after linking your Supabase project.
// These types mirror supabase/schema.sql.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SellerLevel = "new_seller" | "level_one" | "level_two" | "top_rated";

export type OrderStatus =
  | "pending_payment"
  | "active"
  | "requires_requirements"
  | "in_progress"
  | "delivered"
  | "revision_requested"
  | "completed"
  | "cancelled"
  | "disputed";

export type GigStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "paused"
  | "rejected"
  | "deleted";

export interface User {
  id: string;
  full_name: string;
  email: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  country: string;
  timezone: string;
  languages: Array<{ language: string; level: string }>;
  is_seller: boolean;
  is_admin: boolean;
  is_email_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  tagline: string | null;
  description: string | null;
  skills: string[];
  seller_level: SellerLevel;
  response_time_hours: number | null;
  response_rate: number | null;
  on_time_delivery_rate: number;
  order_completion_rate: number;
  total_earnings_lifetime: number;
  balance_pending_clearance: number;
  balance_available: number;
  total_orders_completed: number;
  total_orders_cancelled: number;
  total_reviews_received: number;
  average_rating: number;
  stripe_onboarding_complete: boolean;
  mock_bank_name: string | null;
  mock_account_last4: string | null;
  portfolio_items: Array<{ title: string; description: string; image_url: string; url?: string }>;
  education: Array<{ degree: string; institution: string; year: string }>;
  certifications: Array<{ name: string; provider: string; year: string; url?: string }>;
  social_links: { website?: string; linkedin?: string; github?: string; twitter?: string };
  is_available: boolean;
  vacation_mode: boolean;
  vacation_start: string | null;
  vacation_end: string | null;
  vacation_message: string | null;
  auto_reply_message: string | null;
  days_active: number;
  joined_as_seller_at: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  gig_count: number;
  created_at: string;
}

export interface Gig {
  id: string;
  seller_id: string;
  category_id: string;
  subcategory_id: string | null;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  tags: string[];
  thumbnail_url: string | null;
  gallery_images: string[];
  intro_video_url: string | null;
  faq: Array<{ question: string; answer: string }>;
  requirements: string | null;
  status: GigStatus;
  rejection_reason: string | null;
  rejection_details: string | null;
  total_orders: number;
  total_reviews: number;
  average_rating: number;
  total_favorites: number;
  impressions: number;
  clicks: number;
  is_featured: boolean;
  featured_until: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GigPackage {
  id: string;
  gig_id: string;
  package_type: "basic" | "standard" | "premium";
  name: string;
  description: string;
  price: number;
  delivery_days: number;
  revisions: number;
  features: Array<{ name: string; included: boolean }>;
  is_active: boolean;
}

export interface GigExtra {
  id: string;
  gig_id: string;
  title: string;
  description: string | null;
  price: number;
  delivery_days_added: number;
  sort_order: number;
  is_active: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string;
  gig_id: string;
  package_id: string;
  package_snapshot: GigPackage;
  selected_extras: Array<{ id: string; title: string; price: number }>;
  is_custom_offer: boolean;
  gig_base_price: number;
  extras_price: number;
  order_subtotal: number;
  buyer_service_fee: number;
  buyer_total_paid: number;
  platform_commission: number;
  seller_earnings: number;
  tip_amount: number;
  tip_platform_cut: number;
  seller_tip_earnings: number;
  status: OrderStatus;
  requirements_submitted: boolean;
  buyer_requirements: string | null;
  buyer_requirements_files: string[];
  delivery_days: number;
  delivery_due_at: string | null;
  delivered_at: string | null;
  delivery_message: string | null;
  delivery_files: string[];
  auto_complete_at: string | null;
  revisions_allowed: number;
  revisions_used: number;
  revision_message: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancellation_requested_by: string | null;
  completed_at: string | null;
  funds_cleared: boolean;
  funds_cleared_at: string | null;
  funds_transferred: boolean;
  funds_transferred_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomOffer {
  id: string;
  seller_id: string;
  buyer_id: string;
  conversation_id: string | null;
  title: string;
  description: string;
  price: number;
  delivery_days: number;
  revisions: number;
  status: "pending" | "accepted" | "declined" | "expired";
  expires_at: string;
  accepted_at: string | null;
  order_id: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  gig_id: string;
  buyer_id: string;
  seller_id: string;
  overall_rating: number;
  communication_rating: number;
  service_as_described_rating: number;
  would_recommend: boolean;
  review_text: string;
  seller_response: string | null;
  seller_responded_at: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  order_id: string | null;
  subject: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  buyer_unread_count: number;
  seller_unread_count: number;
  is_archived_buyer: boolean;
  is_archived_seller: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: "text" | "file" | "image" | "custom_offer" | "order_update" | "system";
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  custom_offer_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  gig_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  opened_by: string;
  reason: "not_as_described" | "not_delivered" | "quality_issue" | "communication" | "other";
  description: string;
  evidence_files: string[];
  status: "open" | "admin_reviewing" | "waiting_response" | "resolved_buyer" | "resolved_seller" | "closed";
  admin_assigned: string | null;
  admin_notes: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  status: "processing" | "completed" | "failed";
  mock_bank_name: string | null;
  mock_account_last4: string | null;
  notes: string | null;
  requested_at: string;
  completed_at: string | null;
}

export interface Tip {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  platform_commission: number;
  seller_amount: number;
  message: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  report_type: "gig" | "user" | "review";
  reported_gig_id: string | null;
  reported_user_id: string | null;
  reported_review_id: string | null;
  reason: "inappropriate_content" | "spam" | "fake_reviews" | "scam" | "copyright" | "misleading" | "other";
  description: string;
  status: "pending" | "reviewed" | "action_taken" | "dismissed";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  template_name: string;
  html_body: string;
  metadata: Record<string, Json>;
  status: "sent" | "failed";
  sent_at: string;
}

export interface PlatformSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface SellerLevelHistory {
  id: string;
  seller_id: string;
  previous_level: SellerLevel;
  new_level: SellerLevel;
  changed_at: string;
  reason: string | null;
}

type Table<T> = { Row: T; Insert: Partial<T>; Update: Partial<T> };

export type Database = {
  public: {
    Tables: {
      users: Table<User>;
      seller_profiles: Table<SellerProfile>;
      categories: Table<Category>;
      gigs: Table<Gig>;
      gig_packages: Table<GigPackage>;
      gig_extras: Table<GigExtra>;
      orders: Table<Order>;
      custom_offers: Table<CustomOffer>;
      reviews: Table<Review>;
      conversations: Table<Conversation>;
      messages: Table<Message>;
      favorites: Table<Favorite>;
      notifications: Table<Notification>;
      disputes: Table<Dispute>;
      withdrawals: Table<Withdrawal>;
      tips: Table<Tip>;
      reports: Table<Report>;
      email_logs: Table<EmailLog>;
      platform_settings: Table<PlatformSetting>;
      seller_level_history: Table<SellerLevelHistory>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
