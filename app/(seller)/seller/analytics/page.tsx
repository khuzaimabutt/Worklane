import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsChart } from "@/components/seller/analytics-chart";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default async function SellerAnalyticsPage() {
  const sb = createClient();
  const { data: { user: au } } = await sb.auth.getUser();
  if (!au) redirect("/login");

  const since = new Date(Date.now() - 30 * 86400000);
  const { data: orders } = await sb
    .from("orders")
    .select("seller_earnings, created_at")
    .eq("seller_id", au.id)
    .gte("created_at", since.toISOString());

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    dailyMap.set(d, 0);
  }
  (orders ?? []).forEach((o) => {
    const d = o.created_at.split("T")[0];
    dailyMap.set(d, (dailyMap.get(d) ?? 0) + Number(o.seller_earnings));
  });
  const chartData = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, earnings]) => ({ date: date.slice(5), earnings }));

  const total30 = chartData.reduce((s, d) => s + d.earnings, 0);

  const { data: gigs } = await sb
    .from("gigs")
    .select("id, title, impressions, clicks, total_orders, average_rating")
    .eq("seller_id", au.id)
    .order("total_orders", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Seller</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Analytics</h1>
          <p className="text-sm text-ink-subtle mt-1">Performance across the last 30 days.</p>
        </header>

        <section className="bg-white border border-line rounded-2xl p-6 sm:p-7 mb-6">
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 text-2xs uppercase tracking-wider font-semibold text-ink-subtle mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-brand-primary-dark" />
                <span>Earnings · 30 days</span>
              </div>
              <p className="font-heading text-3xl sm:text-4xl text-ink tabular-nums tracking-tight">
                {formatMoney(total30)}
              </p>
            </div>
          </div>
          <AnalyticsChart data={chartData} />
        </section>

        <section className="bg-white border border-line rounded-2xl p-6 sm:p-7">
          <h2 className="font-heading text-lg text-ink mb-4">Gig performance</h2>
          {!gigs || gigs.length === 0 ? (
            <p className="text-sm text-ink-subtle">No gigs yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-2xs font-semibold uppercase tracking-wider text-ink-subtle border-b border-line">
                    <th className="py-2.5 px-2">Gig</th>
                    <th className="py-2.5 px-2 text-right">Impressions</th>
                    <th className="py-2.5 px-2 text-right">Clicks</th>
                    <th className="py-2.5 px-2 text-right">CTR</th>
                    <th className="py-2.5 px-2 text-right">Orders</th>
                    <th className="py-2.5 px-2 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {gigs.map((g) => {
                    const impressions = g.impressions ?? 0;
                    const clicks = g.clicks ?? 0;
                    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
                    return (
                      <tr key={g.id} className="border-b border-line-subtle last:border-0">
                        <td className="py-3 px-2 max-w-xs truncate text-ink">{g.title}</td>
                        <td className="py-3 px-2 text-right tabular-nums text-ink-muted">{impressions.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right tabular-nums text-ink-muted">{clicks.toLocaleString()}</td>
                        <td className={cn("py-3 px-2 text-right tabular-nums", ctr > 0 ? "text-ink" : "text-ink-faint")}>
                          {ctr.toFixed(1)}%
                        </td>
                        <td className="py-3 px-2 text-right tabular-nums font-semibold text-ink">{(g.total_orders ?? 0).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right tabular-nums text-ink-muted">{g.average_rating ? g.average_rating.toFixed(1) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
