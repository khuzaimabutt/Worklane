import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const AUTH_REQUIRED = ["/dashboard", "/seller", "/order", "/messages", "/settings", "/checkout"];
const ADMIN_REQUIRED = ["/admin"];

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (ADMIN_REQUIRED.some((p) => pathname.startsWith(p))) {
    if (!user) return NextResponse.rewrite(new URL("/404", request.url));
    const { data } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
    if (!data?.is_admin) return NextResponse.rewrite(new URL("/404", request.url));
  }

  if (AUTH_REQUIRED.some((p) => pathname.startsWith(p)) && !user) {
    const redirect = new URL("/login", request.url);
    redirect.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
