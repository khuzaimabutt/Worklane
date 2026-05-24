import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 30;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ categories: [], gigs: [] });
  }

  const sb = createClient();
  const pattern = `%${q}%`;

  const [{ data: categories }, { data: gigs }] = await Promise.all([
    sb
      .from("categories")
      .select("id, slug, name, gig_count")
      .ilike("name", pattern)
      .limit(4),
    sb
      .from("gigs")
      .select("id, slug, title, thumbnail_url, average_rating")
      .eq("status", "active")
      .ilike("title", pattern)
      .order("total_orders", { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    categories: categories ?? [],
    gigs: gigs ?? [],
  });
}
