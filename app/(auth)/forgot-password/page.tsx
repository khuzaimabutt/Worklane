"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = createClient();
    const { error: err } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/settings`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
        <h1 className="text-3xl font-heading text-center mb-2">Reset password</h1>
        {sent ? (
          <p className="text-center text-neutral-600 mt-4">
            If an account exists for <strong>{email}</strong>, a reset link has been logged. Check the{" "}
            <Link href="/admin/emails" className="text-brand-primary hover:underline">admin email inbox</Link>{" "}
            (portfolio demo).
          </p>
        ) : (
          <>
            <p className="text-neutral-500 text-center mb-6">Enter your email to receive a reset link</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              {error && <p className="text-error text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Link
              </button>
            </form>
            <p className="mt-4 text-sm text-center">
              <Link href="/login" className="text-brand-primary hover:underline">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
