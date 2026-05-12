import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const sb = createClient();
  const { data } = await sb.from("categories").select("*").order("sort_order");
  return NextResponse.json({ categories: data ?? [] });
}
