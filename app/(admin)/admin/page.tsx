import Link from "next/link";
import { ArrowRight, Users, Package, AlertTriangle, ShoppingBag, AlertOctagon, TrendingUp, Mail } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

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
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Admin</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Dashboard</h1>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Users" value={users?.toString() ?? "0"} icon={<Users className="w-4 h-4" />} />
          <StatCard label="Active gigs" value={activeGigs?.toString() ?? "0"} icon={<Package className="w-4 h-4" />} />
          <StatCard label="Pending review" value={pendingGigs?.toString() ?? "0"} icon={<AlertTriangle className="w-4 h-4" />} accent={(pendingGigs ?? 0) > 0} />
          <StatCard label="Orders" value={totalOrders?.toString() ?? "0"} icon={<ShoppingBag className="w-4 h-4" />} />
          <StatCard label="Open disputes" value={openDisputes?.toString() ?? "0"} icon={<AlertOctagon className="w-4 h-4" />} accent={(openDisputes ?? 0) > 0} tone="danger" />
          <StatCard label="30-day revenue" value={formatMoney(revenue)} icon={<TrendingUp className="w-4 h-4" />} />
        </div>

        <h2 className="font-heading text-base text-ink mb-3">Queues</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <NavCard
            href="/admin/gigs/review"
            title="Gigs to review"
            value={pendingGigs ?? 0}
            icon={<Package className="w-4 h-4" />}
            urgent={(pendingGigs ?? 0) > 0}
          />
          <NavCard
            href="/admin/disputes"
            title="Open disputes"
            value={openDisputes ?? 0}
            icon={<AlertOctagon className="w-4 h-4" />}
            urgent={(openDisputes ?? 0) > 0}
            tone="danger"
          />
          <NavCard href="/admin/emails" title="Email logs" value="View" icon={<Mail className="w-4 h-4" />} />
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  tone?: "default" | "danger";
}) {
  const isDanger = tone === "danger" && accent;
  return (
    <div
      className={cn(
        "rounded-2xl p-4 border",
        isDanger
          ? "bg-error/5 border-error/30"
          : accent
            ? "bg-amber-50 border-amber-200"
            : "bg-white border-line"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 mb-2 text-2xs uppercase tracking-wider font-semibold",
          isDanger ? "text-error" : accent ? "text-amber-700" : "text-ink-subtle"
        )}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <p className={cn("font-heading text-xl sm:text-2xl tabular-nums", isDanger ? "text-error" : "text-ink")}>{value}</p>
    </div>
  );
}

function NavCard({
  href,
  title,
  value,
  icon,
  urgent,
  tone,
}: {
  href: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  urgent?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-2xl p-5 border transition-all bg-white",
        urgent && tone === "danger"
          ? "border-error/30 hover:border-error"
          : urgent
            ? "border-amber-300 hover:border-amber-400"
            : "border-line hover:border-line-strong hover:shadow-card-hover"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn("flex items-center gap-2 text-2xs uppercase tracking-wider font-semibold", urgent && tone === "danger" ? "text-error" : urgent ? "text-amber-700" : "text-ink-subtle")}>
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-ink-faint group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className={cn("font-heading text-2xl sm:text-3xl tabular-nums", urgent && tone === "danger" ? "text-error" : "text-ink")}>{value}</p>
    </Link>
  );
}
