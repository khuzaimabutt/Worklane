"use client";
import { useState } from "react";
import { fromNow } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { EmailLog } from "@/types/database.types";

export function EmailInbox({ emails }: { emails: EmailLog[] }) {
  const [active, setActive] = useState<EmailLog | null>(emails[0] ?? null);

  return (
    <div className="bg-white border border-neutral-200 rounded-xl flex h-[70vh] overflow-hidden">
      <aside className="w-80 border-r border-neutral-200 overflow-y-auto">
        {emails.length === 0 ? (
          <p className="text-center text-sm text-neutral-500 p-8">No emails yet.</p>
        ) : (
          emails.map((e) => (
            <button
              key={e.id}
              onClick={() => setActive(e)}
              className={cn(
                "w-full text-left p-3 border-b border-neutral-100 hover:bg-neutral-50 block",
                active?.id === e.id && "bg-neutral-50"
              )}
            >
              <p className="text-sm font-medium truncate">{e.subject}</p>
              <p className="text-xs text-neutral-600 truncate">To: {e.recipient_email}</p>
              <p className="text-xs text-neutral-500 mt-1">{fromNow(e.sent_at)} · {e.template_name}</p>
            </button>
          ))
        )}
      </aside>
      <section className="flex-1 overflow-y-auto">
        {active ? (
          <>
            <header className="border-b border-neutral-200 p-4">
              <p className="font-semibold">{active.subject}</p>
              <p className="text-xs text-neutral-500 mt-1">To: {active.recipient_email}{active.recipient_name && ` <${active.recipient_name}>`}</p>
            </header>
            <iframe srcDoc={active.html_body} className="w-full min-h-[600px]" sandbox="" />
          </>
        ) : (
          <p className="p-8 text-neutral-500 text-sm">Select an email</p>
        )}
      </section>
    </div>
  );
}
