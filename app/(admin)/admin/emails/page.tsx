import { Info } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmailInbox } from "@/components/admin/email-inbox";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminEmailsPage() {
  const sb = createAdminClient();
  const { data } = await sb.from("email_logs").select("*").order("sent_at", { ascending: false }).limit(200);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Admin</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Email logs</h1>
        </header>
        <div className="flex items-start gap-3 bg-info/5 border border-info/20 rounded-xl p-4 mb-6">
          <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
          <p className="text-sm text-ink-muted leading-relaxed">
            <strong className="text-ink">Portfolio demo:</strong> emails are logged to Supabase
            instead of being sent via SMTP. Useful for verifying that the right notifications fire
            on each event.
          </p>
        </div>
        <EmailInbox emails={data ?? []} />
      </main>
      <Footer />
    </>
  );
}
