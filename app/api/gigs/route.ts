import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") ?? "best_selling";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const sb = createClient();
  let query = sb.from("gigs").select("*", { count: "exact" }).eq("status", "active");
  if (q) query = query.textSearch("search_vector", q.split(" ").join(" & "));
  if (category) query = query.eq("category_id", category);
  if (sort === "newest") query = query.order("created_at", { ascending: false });
  else if (sort === "rating") query = query.order("average_rating", { ascending: false });
  else query = query.order("total_orders", { ascending: false });

  query = query.range((page - 1) * 12, page * 12 - 1);
  const { data, count } = await query;
  return NextResponse.json({ gigs: data ?? [], total: count ?? 0 });
}
