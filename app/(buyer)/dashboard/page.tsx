import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Package, MessageCircle, Heart, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { initials, formatMoney, formatDate } from "@/lib/utils/format";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info"> = {
  pending_payment: "warning",
  active: "info",
  in_progress: "info",
  requires_requirements: "warning",
  delivered: "info",
  revision_requested: "warning",
  completed: "success",
  cancelled: "error",
  disputed: "error",
};

export default async function DashboardPage() {
  const sb = createClient();
  const { data: { user: authUser } } = await sb.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: user } = await sb.from("users").select("*").eq("id", authUser.id).single();
  if (!user) redirect("/login");

  const [{ count: activeOrders }, { count: pendingReviews }, { data: spentRows }, { count: savedGigs }, { data: orders }] =
    await Promise.all([
      sb.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", user.id).in("status", ["active", "in_progress", "requires_requirements", "delivered", "revision_requested"]),
      sb.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", user.id).eq("status", "completed"),
      sb.from("orders").select("buyer_total_paid").eq("buyer_id", user.id).eq("status", "completed"),
      sb.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      sb.from("orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(6),
    ]);

  const totalSpent = (spentRows ?? []).reduce((sum, o) => sum + Number(o.buyer_total_paid), 0);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="flex items-center gap-4 mb-8">
          <Avatar className="w-14 h-14 shrink-0 border border-line">
            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
            <AvatarFallback className="bg-canvas-subtle text-ink-muted">
              {initials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-0.5">Dashboard</p>
            <h1 className="font-heading text-2xl sm:text-3xl text-ink truncate">
              Welcome back, {user.full_name.split(" ")[0]}
            </h1>
          </div>
          <Link
            href="/search"
            className="hidden sm:inline-flex h-10 px-4 items-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse services
          </Link>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Active orders" value={activeOrders?.toString() ?? "0"} icon={<Package className="w-4 h-4" />} />
          <StatCard label="Completed" value={pendingReviews?.toString() ?? "0"} icon={<MessageCircle className="w-4 h-4" />} />
          <StatCard label="Total spent" value={formatMoney(totalSpent)} icon={<ShoppingBag className="w-4 h-4" />} />
          <StatCard label="Saved gigs" value={savedGigs?.toString() ?? "0"} icon={<Heart className="w-4 h-4" />} />
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-heading text-lg text-ink">Recent orders</h2>
          {orders && orders.length > 0 && (
            <Link href="/orders" className="text-sm font-medium text-brand-primary-dark hover:underline">
              View all <ArrowRight className="w-3 h-3 inline -mt-0.5" />
            </Link>
          )}
        </div>

        {!orders || orders.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-sm text-ink mb-1 font-medium">No orders yet</p>
            <p className="text-sm text-ink-subtle mb-5">When you place an order, it will appear here.</p>
            <Link href="/search" className="btn-primary">Browse services</Link>
          </div>
        ) : (
          <div className="bg-white border border-line rounded-2xl divide-y divide-line overflow-hidden">
            {orders.map((o) => {
              const variant = STATUS_VARIANT[o.status] ?? "secondary";
              return (
                <Link
                  key={o.id}
                  href={`/order/${o.id}`}
                  className="block px-5 py-4 hover:bg-canvas-subtle transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-mono text-2xs text-ink-subtle">{o.order_number}</p>
                        <Badge variant={variant} className="capitalize">
                          {o.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="font-medium text-ink truncate">
                        {(o.package_snapshot as any)?.name ?? "Service"}
                      </p>
                      <p className="text-xs text-ink-subtle mt-0.5">Placed {formatDate(o.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-semibold text-ink tabular-nums">
                        {formatMoney(o.buyer_total_paid)}
                      </p>
                      <ArrowRight className="w-4 h-4 text-ink-faint inline-block mt-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-line rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2 text-ink-subtle">
        <span className="text-brand-primary-dark">{icon}</span>
        <p className="text-2xs uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className="font-heading text-2xl sm:text-3xl text-ink tabular-nums">{value}</p>
    </div>
  );
}
