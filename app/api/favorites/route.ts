import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ favorites: [] });
  const { data } = await sb.from("favorites").select("gig_id, gigs(*)").eq("user_id", user.id);
  return NextResponse.json({ favorites: data ?? [] });
}

export async function POST(request: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { gig_id } = await request.json();

  const { data: existing } = await sb.from("favorites").select("id").eq("user_id", user.id).eq("gig_id", gig_id).single();
  if (existing) {
    await sb.from("favorites").delete().eq("id", existing.id);
    return NextResponse.json({ favorited: false });
  }
  await sb.from("favorites").insert({ user_id: user.id, gig_id });
  return NextResponse.json({ favorited: true });
}
