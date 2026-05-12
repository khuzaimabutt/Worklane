import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils/format";

export default async function AdminDashboardPage() {
  const sb = createClient();
  const [
    { count: users },
    { count: activeGigs },
    { count: pendingGigs },
    { count: totalOrders },
    { count: openDisputes },
    { data: monthOrders },
  ] = await Promise.all([
    sb.from("users").select("id", { count: "exact", head: true }),
    sb.from("gigs").select("id", { count: "exact", head: true }).eq("status", "active"),
    sb.from("gigs").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    sb.from("orders").select("id", { count: "exact", head: true }),
    sb.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
    sb.from("orders").select("platform_commission").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);

  const revenue = (monthOrders ?? []).reduce((s, o) => s + Number(o.platform_commission), 0);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card label="Users" value={users?.toString() ?? "0"} />
          <Card label="Active Gigs" value={activeGigs?.toString() ?? "0"} />
          <Card label="Pending Gigs" value={pendingGigs?.toString() ?? "0"} accent={pendingGigs! > 0} />
          <Card label="Total Orders" value={totalOrders?.toString() ?? "0"} />
          <Card label="Open Disputes" value={openDisputes?.toString() ?? "0"} accent={openDisputes! > 0} />
          <Card label="30-day Revenue" value={formatMoney(revenue)} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/admin/gigs/review" className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-sm transition">
            <h3 className="font-semibold mb-1">Gigs to Review</h3>
            <p className="text-3xl font-heading">{pendingGigs ?? 0}</p>
          </Link>
          <Link href="/admin/disputes" className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-sm transition">
            <h3 className="font-semibold mb-1">Open Disputes</h3>
            <p className="text-3xl font-heading">{openDisputes ?? 0}</p>
          </Link>
          <Link href="/admin/emails" className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-sm transition">
            <h3 className="font-semibold mb-1">Email Logs</h3>
            <p className="text-3xl font-heading">View</p>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${accent ? "border-warning bg-warning/5" : "border-neutral-200 bg-white"}`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-heading text-2xl mt-1">{value}</p>
    </div>
  );
}
