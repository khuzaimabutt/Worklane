import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmailInbox } from "@/components/admin/email-inbox";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminEmailsPage() {
  // Use admin client because email_logs has no read policies
  const sb = createAdminClient();
  const { data } = await sb.from("email_logs").select("*").order("sent_at", { ascending: false }).limit(200);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl mb-6">Email Logs</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Portfolio demo — these emails are stored in Supabase instead of being sent via SMTP.
        </p>
        <EmailInbox emails={data ?? []} />
      </main>
      <Footer />
    </>
  );
}
