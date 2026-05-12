import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { initials, formatMoney, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const sb = createClient();
  const { data: { user: authUser } } = await sb.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: user } = await sb.from("users").select("*").eq("id", authUser.id).single();
  if (!user) redirect("/login");

  const [{ count: activeOrders }, { count: pendingReviews }, { data: spentRows }, { count: savedGigs }, { data: orders }] = await Promise.all([
    sb.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", user.id).in("status", ["active", "in_progress", "requires_requirements", "delivered", "revision_requested"]),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", user.id).eq("status", "completed"),
    sb.from("orders").select("buyer_total_paid").eq("buyer_id", user.id).eq("status", "completed"),
    sb.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    sb.from("orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const totalSpent = (spentRows ?? []).reduce((sum, o) => sum + Number(o.buyer_total_paid), 0);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="w-14 h-14">
            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
            <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-3xl">Welcome back, {user.full_name.split(" ")[0]}</h1>
            <p className="text-sm text-neutral-500">@{user.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Orders" value={activeOrders?.toString() ?? "0"} />
          <StatCard label="Pending Reviews" value={pendingReviews?.toString() ?? "0"} />
          <StatCard label="Total Spent" value={formatMoney(totalSpent)} />
          <StatCard label="Saved Gigs" value={savedGigs?.toString() ?? "0"} />
        </div>

        <h2 className="font-heading text-xl mb-4">Recent Orders</h2>
        {!orders || orders.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
            <p className="text-neutral-500 mb-4">You haven&apos;t placed any orders yet.</p>
            <Link href="/search" className="btn-cta inline-block">Browse Services</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/order/${o.id}`}
                className="block bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-neutral-500">{o.order_number}</p>
                    <p className="font-medium truncate">{(o.package_snapshot as any)?.name ?? "Service"}</p>
                    <p className="text-xs text-neutral-500">Placed {formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="info" className="capitalize">{o.status.replace(/_/g, " ")}</Badge>
                    <p className="text-sm font-semibold mt-1">{formatMoney(o.buyer_total_paid)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-heading text-3xl mt-1">{value}</p>
    </div>
  );
}
