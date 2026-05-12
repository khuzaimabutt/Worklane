import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/utils/format";

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

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl mb-6">Earnings</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card label="Available" value={formatMoney(profile.balance_available)} accent />
          <Card label="Clearing" value={formatMoney(profile.balance_pending_clearance)} />
          <Card label="Lifetime" value={formatMoney(profile.total_earnings_lifetime)} />
          <Card label="Cancelled Orders" value={profile.total_orders_cancelled.toString()} />
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Withdraw</h2>
            <Button variant="cta">Request Withdrawal</Button>
          </div>
          {profile.mock_bank_name ? (
            <p className="text-sm text-neutral-600">
              Connected: <strong>{profile.mock_bank_name}</strong> ****{profile.mock_account_last4}
            </p>
          ) : (
            <p className="text-sm text-neutral-500">Connect a bank account to enable withdrawals.</p>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
          <h2 className="font-heading text-xl mb-4">Clearing Schedule</h2>
          {!clearing || clearing.length === 0 ? (
            <p className="text-sm text-neutral-500">No funds currently clearing.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200">
                  <th className="py-2">Order</th>
                  <th>Gig</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Clears</th>
                </tr>
              </thead>
              <tbody>
                {clearing.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2 font-mono text-xs">{c.order_number}</td>
                    <td>{(c.package_snapshot as any)?.name ?? "—"}</td>
                    <td className="text-right">{formatMoney(c.seller_earnings)}</td>
                    <td className="text-right text-xs">{c.funds_cleared_at ? formatDate(c.funds_cleared_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-heading text-xl mb-4">Withdrawal History</h2>
          {!withdrawals || withdrawals.length === 0 ? (
            <p className="text-sm text-neutral-500">No withdrawals yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200">
                  <th className="py-2">Requested</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2">{formatDate(w.requested_at)}</td>
                    <td className="text-right">{formatMoney(w.amount)}</td>
                    <td className="capitalize">{w.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${accent ? "border-brand-primary bg-brand-primary/5" : "border-neutral-200 bg-white"}`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-heading text-2xl mt-1">{value}</p>
    </div>
  );
}
