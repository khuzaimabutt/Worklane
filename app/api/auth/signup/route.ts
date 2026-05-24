import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/slug-generator";

/**
 * Server-side signup that bypasses Supabase's built-in email confirmation
 * (and its strict free-tier hourly rate limit) by using auth.admin.createUser
 * with email_confirm: true. After this returns OK, the client signs in with
 * the password to establish a session.
 *
 * Falls back to a clear error response if the service role isn't configured.
 */
export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey.includes("placeholder")) {
    return NextResponse.json(
      { error: "Signup service not configured" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { email, password, fullName, username } = body as {
    email?: string;
    password?: string;
    fullName?: string;
    username?: string;
  };

  if (!email || !password || !fullName) {
    return NextResponse.json(
      { error: "email, password, and fullName are required" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Decide on a username. Use provided value, else derive from full name.
  const requested = (username && username.trim()) ||
    slugify(fullName).replace(/-/g, "_").slice(0, 30) ||
    `user_${Date.now().toString(36)}`;
  const safe = requested.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (safe.length < 2) {
    return NextResponse.json({ error: "Username must be at least 2 characters" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("username", safe)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  // Create the auth user with email already confirmed — skips the verification
  // email entirely so the Supabase email rate limit doesn't apply.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, username: safe },
  });

  if (createErr || !created.user) {
    const msg = createErr?.message ?? "Could not create account";
    const status = /already.*registered|already exists/i.test(msg) ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes(email.toLowerCase());

  const { error: profileErr } = await admin.from("users").upsert({
    id: created.user.id,
    email,
    full_name: fullName,
    username: safe,
    is_email_verified: true,
    is_admin: isAdmin,
  });

  if (profileErr) {
    // Best-effort cleanup so a half-created account doesn't strand the email
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: created.user.id, username: safe });
}
