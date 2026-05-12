import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils/format";
import { SellerLevelBadge } from "@/components/seller/seller-level-badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SellerDashboardPage() {
  const sb = createClient();
  const { data: { user: au } } = await sb.auth.getUser();
  if (!au) redirect("/login");
  const { data: user } = await sb.from("users").select("*").eq("id", au.id).single();
  if (!user?.is_seller) redirect("/become-seller");

  const { data: profile } = await sb.from("seller_profiles").select("*").eq("user_id", user.id).single();
  if (!profile) redirect("/become-seller");

  const [{ count: activeGigs }, { count: openOrders }, { data: monthOrders }] = await Promise.all([
    sb.from("gigs").select("id", { count: "exact", head: true }).eq("seller_id", user.id).eq("status", "active"),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", user.id).in("status", ["active", "in_progress", "requires_requirements"]),
    sb.from("orders").select("seller_earnings, created_at").eq("seller_id", user.id).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
  ]);
  const monthEarnings = (monthOrders ?? []).reduce((s, o) => s + Number(o.seller_earnings), 0);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-heading text-3xl mb-1">Seller Dashboard</h1>
            <div className="flex items-center gap-2 text-sm">
              <SellerLevelBadge level={profile.seller_level} />
              <span className="text-neutral-500">@{user.username}</span>
            </div>
          </div>
          <Link href="/seller/gigs/create">
            <Button variant="cta">
              <Plus className="w-4 h-4" /> Create a Gig
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Available Balance" value={formatMoney(profile.balance_available)} accent />
          <Stat label="Pending Clearance" value={formatMoney(profile.balance_pending_clearance)} />
          <Stat label="This Month" value={formatMoney(monthEarnings)} />
          <Stat label="Lifetime" value={formatMoney(profile.total_earnings_lifetime)} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card title="Active Gigs" value={activeGigs?.toString() ?? "0"} href="/seller/gigs" />
          <Card title="Open Orders" value={openOrders?.toString() ?? "0"} href="/seller/orders" />
          <Card title="Avg Rating" value={profile.average_rating.toFixed(2)} href="/seller/dashboard" />
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-heading text-xl mb-4">Level Progress</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Current level: <SellerLevelBadge level={profile.seller_level} className="ml-2" />
          </p>
          <div className="space-y-3 text-sm">
            <Progress label="Orders" value={profile.total_orders_completed} target={10} />
            <Progress label="Lifetime earnings" value={profile.total_earnings_lifetime} target={400} />
            <Progress label="Rating" value={profile.average_rating} target={4.5} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${accent ? "border-brand-primary bg-brand-primary/5" : "border-neutral-200 bg-white"}`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-heading text-2xl mt-1">{value}</p>
    </div>
  );
}

function Card({ title, value, href }: { title: string; value: string; href: string }) {
  return (
    <Link href={href} className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition">
      <p className="text-sm text-neutral-500">{title}</p>
      <p className="font-heading text-3xl mt-2">{value}</p>
    </Link>
  );
}

function Progress({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>
          {typeof value === "number" && value % 1 ? value.toFixed(2) : value}/{target}
        </span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
