import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/mock-email";

export async function POST(request: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await request.json();
  if (typeof amount !== "number" || amount < 20) {
    return NextResponse.json({ error: "Minimum $20" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("seller_profiles").select("balance_available, mock_bank_name, mock_account_last4").eq("user_id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (Number(profile.balance_available) < amount) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

  await admin.from("withdrawals").insert({
    seller_id: user.id,
    amount,
    status: "processing",
    mock_bank_name: profile.mock_bank_name,
    mock_account_last4: profile.mock_account_last4,
  });

  await admin.from("seller_profiles").update({
    balance_available: Number(profile.balance_available) - amount,
  }).eq("user_id", user.id);

  const { data: u } = await admin.from("users").select("email, full_name").eq("id", user.id).single();
  if (u) {
    await sendEmail({
      to: u.email,
      toName: u.full_name,
      subject: "Withdrawal processed",
      template: "withdrawal_processed",
      data: { sellerName: u.full_name, amount: amount.toFixed(2), bankName: profile.mock_bank_name ?? "Bank", last4: profile.mock_account_last4 ?? "0000" },
    });
  }

  return NextResponse.json({ success: true });
}
