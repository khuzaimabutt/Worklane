import { redirect } from "next/navigation";
import { Wallet, Clock, Coins, XCircle, Landmark } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info"> = {
  pending: "warning",
  processing: "info",
  paid: "success",
  failed: "error",
};

export default async function SellerEarningsPage() {
  const sb = createClient();
  const { data: { user: au } } = await sb.auth.getUser();
  if (!au) redirect("/login");

  const { data: profile } = await sb.from("seller_profiles").select("*").eq("user_id", au.id).single();
  if (!profile) redirect("/become-seller");

  const { data: clearing } = await sb
    .from("orders")
    .select("id, order_number, package_snapshot, seller_earnings, funds_cleared_at, status")
    .eq("seller_id", au.id)
    .eq("status", "completed")
    .eq("funds_cleared", false);

  const { data: withdrawals } = await sb
    .from("withdrawals")
    .select("*")
    .eq("seller_id", au.id)
    .order("requested_at", { ascending: false })
    .limit(10);

  const bankConnected = Boolean(profile.mock_bank_name);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Seller</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Earnings</h1>
          <p className="text-sm text-ink-subtle mt-1">Balance, clearing schedule, and withdrawals.</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <BalanceCard label="Available" value={formatMoney(profile.balance_available)} icon={<Wallet className="w-4 h-4" />} accent />
          <BalanceCard label="Clearing" value={formatMoney(profile.balance_pending_clearance)} icon={<Clock className="w-4 h-4" />} />
          <BalanceCard label="Lifetime" value={formatMoney(profile.total_earnings_lifetime)} icon={<Coins className="w-4 h-4" />} />
          <BalanceCard label="Cancelled" value={profile.total_orders_cancelled.toString()} icon={<XCircle className="w-4 h-4" />} />
        </div>

        <section className="bg-white border border-line rounded-2xl p-6 sm:p-7 mb-6">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="font-heading text-lg text-ink">Withdraw funds</h2>
              <p className="text-sm text-ink-subtle mt-1">Move your available balance to your bank account.</p>
            </div>
            <button
              disabled={!bankConnected || profile.balance_available <= 0}
              className="inline-flex h-10 px-4 items-center rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request withdrawal
            </button>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-canvas-subtle border border-line">
            <div className="w-9 h-9 rounded-md bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            {bankConnected ? (
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{profile.mock_bank_name}</p>
                <p className="text-xs text-ink-subtle">Account ending in {profile.mock_account_last4}</p>
              </div>
            ) : (
              <p className="text-sm text-ink-subtle">No bank account connected — link one to enable withdrawals.</p>
            )}
          </div>
        </section>

        <section className="bg-white border border-line rounded-2xl p-6 sm:p-7 mb-6">
          <h2 className="font-heading text-lg text-ink mb-4">Clearing schedule</h2>
          {!clearing || clearing.length === 0 ? (
            <p className="text-sm text-ink-subtle">No funds currently clearing.</p>
          ) : (
            <Table
              headers={["Order", "Gig", "Amount", "Clears"]}
              rightAlign={[false, false, true, true]}
              rows={clearing.map((c) => [
                <span className="font-mono text-2xs text-ink-subtle">{c.order_number}</span>,
                <span className="text-ink">{(c.package_snapshot as any)?.name ?? "—"}</span>,
                <span className="text-ink font-medium tabular-nums">{formatMoney(c.seller_earnings)}</span>,
                <span className="text-ink-subtle text-xs">{c.funds_cleared_at ? formatDate(c.funds_cleared_at) : "—"}</span>,
              ])}
            />
          )}
        </section>

        <section className="bg-white border border-line rounded-2xl p-6 sm:p-7">
          <h2 className="font-heading text-lg text-ink mb-4">Withdrawal history</h2>
          {!withdrawals || withdrawals.length === 0 ? (
            <p className="text-sm text-ink-subtle">No withdrawals yet.</p>
          ) : (
            <Table
              headers={["Requested", "Amount", "Status"]}
              rightAlign={[false, true, false]}
              rows={withdrawals.map((w) => [
                <span className="text-ink">{formatDate(w.requested_at)}</span>,
                <span className="font-medium text-ink tabular-nums">{formatMoney(w.amount)}</span>,
                <Badge variant={STATUS_VARIANT[w.status] ?? "secondary"} className="capitalize">{w.status}</Badge>,
              ])}
            />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function BalanceCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 border",
        accent ? "bg-brand-primary-50 border-brand-primary/25" : "bg-white border-line"
      )}
    >
      <div className={cn("flex items-center gap-2 mb-2 text-xs uppercase tracking-wider font-semibold",
        accent ? "text-brand-primary-dark" : "text-ink-subtle")}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <p className="font-heading text-2xl sm:text-[1.75rem] text-ink tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function Table({
  headers,
  rightAlign,
  rows,
}: {
  headers: string[];
  rightAlign: boolean[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle border-b border-line">
            {headers.map((h, i) => (
              <th key={i} className={cn("py-2.5 px-2", rightAlign[i] && "text-right")}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-line-subtle last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className={cn("py-3 px-2", rightAlign[ci] && "text-right")}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
