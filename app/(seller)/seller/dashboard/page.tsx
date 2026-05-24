import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowRight, Wallet, Clock, TrendingUp, Coins, Package, ShoppingBag, Star } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SellerLevelBadge } from "@/components/seller/seller-level-badge";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

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
        <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Seller dashboard</p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-2xl sm:text-3xl text-ink">
                Hi, {user.full_name.split(" ")[0]}
              </h1>
              <SellerLevelBadge level={profile.seller_level} />
            </div>
            <p className="text-sm text-ink-subtle mt-1">@{user.username}</p>
          </div>
          <Link
            href="/seller/gigs/create"
            className="inline-flex h-10 px-4 items-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create a gig
          </Link>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <BalanceCard
            label="Available balance"
            value={formatMoney(profile.balance_available)}
            icon={<Wallet className="w-4 h-4" />}
            accent
            cta={{ label: "Withdraw", href: "/seller/earnings" }}
          />
          <BalanceCard
            label="Pending clearance"
            value={formatMoney(profile.balance_pending_clearance)}
            icon={<Clock className="w-4 h-4" />}
          />
          <BalanceCard
            label="Last 30 days"
            value={formatMoney(monthEarnings)}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <BalanceCard
            label="Lifetime earnings"
            value={formatMoney(profile.total_earnings_lifetime)}
            icon={<Coins className="w-4 h-4" />}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <NavCard
            title="Active gigs"
            value={activeGigs?.toString() ?? "0"}
            href="/seller/gigs"
            icon={<Package className="w-4 h-4" />}
          />
          <NavCard
            title="Open orders"
            value={openOrders?.toString() ?? "0"}
            href="/seller/orders"
            icon={<ShoppingBag className="w-4 h-4" />}
          />
          <NavCard
            title="Avg rating"
            value={profile.average_rating ? profile.average_rating.toFixed(2) : "—"}
            href={`/seller/${user.username}`}
            icon={<Star className="w-4 h-4" />}
          />
        </div>

        <div className="bg-white border border-line rounded-2xl p-6 sm:p-7">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-heading text-lg text-ink">Level progress</h2>
            <SellerLevelBadge level={profile.seller_level} />
          </div>
          <p className="text-sm text-ink-subtle mb-6">
            Hit each milestone below to qualify for the next seller level.
          </p>
          <div className="space-y-5">
            <ProgressRow label="Orders completed" value={profile.total_orders_completed} target={10} unit="" />
            <ProgressRow label="Lifetime earnings" value={profile.total_earnings_lifetime} target={400} unit="$" />
            <ProgressRow label="Average rating" value={profile.average_rating} target={4.5} unit="★" precision={2} />
          </div>
        </div>
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
  cta,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  cta?: { label: string; href: string };
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
      {cta && (
        <Link
          href={cta.href}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary-dark hover:underline"
        >
          {cta.label} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function NavCard({ title, value, href, icon }: { title: string; value: string; href: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group bg-white border border-line rounded-2xl p-5 hover:border-line-strong hover:shadow-card-hover transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-2xs uppercase tracking-wider font-semibold text-ink-subtle">
          <span className="text-brand-primary-dark">{icon}</span>
          <span>{title}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-ink-faint group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="font-heading text-2xl sm:text-3xl text-ink tabular-nums">{value}</p>
    </Link>
  );
}

function ProgressRow({
  label,
  value,
  target,
  unit,
  precision = 0,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  precision?: number;
}) {
  const pct = Math.min((value / target) * 100, 100);
  const formatted = precision > 0 ? value.toFixed(precision) : value.toLocaleString();
  const done = value >= target;
  return (
    <div>
      <div className="flex justify-between items-baseline text-sm mb-1.5">
        <span className="text-ink font-medium">{label}</span>
        <span className={cn("tabular-nums", done ? "text-brand-primary-dark font-semibold" : "text-ink-subtle")}>
          {unit === "$" ? `$${formatted}` : `${formatted}${unit ? " " + unit : ""}`} <span className="text-ink-faint">/ {unit === "$" ? `$${target}` : `${target}${unit ? " " + unit : ""}`}</span>
        </span>
      </div>
      <div className="h-2 bg-canvas-subtle rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", done ? "bg-brand-primary" : "bg-brand-primary/70")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
