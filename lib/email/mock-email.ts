import { createAdminClient } from "@/lib/supabase/admin";
import { templates, type EmailTemplate } from "./templates";

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, string | number>;
}

export async function sendEmail({ to, toName, subject, template, data }: SendEmailOptions) {
  const builder = templates[template];
  const html = builder ? builder(data) : `<p>No template ${template}</p>`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📧 [Mock Email] To: ${to} | Subject: ${subject} | Template: ${template}`);
  }

  const sb = createAdminClient();
  const { error } = await sb.from("email_logs").insert({
    recipient_email: to,
    recipient_name: toName ?? null,
    subject,
    template_name: template,
    html_body: html,
    metadata: data as Record<string, never>,
    status: "sent",
  });

  if (error) {
    console.error("Mock email log failed:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
