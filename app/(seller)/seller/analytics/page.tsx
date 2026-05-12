import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsChart } from "@/components/seller/analytics-chart";

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

  const { data: gigs } = await sb
    .from("gigs")
    .select("id, title, impressions, clicks, total_orders, average_rating")
    .eq("seller_id", au.id)
    .order("total_orders", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl mb-6">Analytics</h1>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
          <h2 className="font-heading text-xl mb-4">Earnings (30 days)</h2>
          <AnalyticsChart data={chartData} />
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-heading text-xl mb-4">Gig Performance</h2>
          {!gigs || gigs.length === 0 ? (
            <p className="text-sm text-neutral-500">No gigs yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200">
                  <th className="py-2">Gig</th>
                  <th className="text-right">Impressions</th>
                  <th className="text-right">Clicks</th>
                  <th className="text-right">Orders</th>
                  <th className="text-right">Rating</th>
                </tr>
              </thead>
              <tbody>
                {gigs.map((g) => (
                  <tr key={g.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2 max-w-xs truncate">{g.title}</td>
                    <td className="text-right">{g.impressions}</td>
                    <td className="text-right">{g.clicks}</td>
                    <td className="text-right">{g.total_orders}</td>
                    <td className="text-right">{g.average_rating?.toFixed(1) ?? "—"}</td>
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
