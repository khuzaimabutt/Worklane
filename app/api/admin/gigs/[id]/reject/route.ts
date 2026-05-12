import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/mock-email";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: me } = await sb.from("users").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { reason, details } = await req.json();
  const admin = createAdminClient();
  const { data: gig } = await admin.from("gigs").select("*, users!gigs_seller_id_fkey(email, full_name)").eq("id", params.id).single();
  if (!gig) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin.from("gigs").update({
    status: "rejected",
    rejection_reason: reason,
    rejection_details: details,
  }).eq("id", params.id);

  const seller = (gig as any).users;
  if (seller) {
    await sendEmail({
      to: seller.email,
      toName: seller.full_name,
      subject: "Action needed: gig changes",
      template: "gig_rejected",
      data: {
        sellerName: seller.full_name,
        gigTitle: gig.title,
        reason,
        details: details ?? "",
        editUrl: `${process.env.NEXT_PUBLIC_APP_URL}/seller/gigs`,
      },
    });
  }
  return NextResponse.json({ success: true });
}
