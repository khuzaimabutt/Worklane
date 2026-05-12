"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, Search, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils/format";
import type { User } from "@/types/database.types";

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      const { data } = await sb.from("users").select("*").eq("id", authUser.id).single();
      setUser((data as User) ?? null);
    });
  }, []);

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/" className="font-heading text-2xl text-brand-primary whitespace-nowrap">
          SkillBazaar
        </Link>

        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What service are you looking for?"
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </form>

        <nav className="hidden lg:flex items-center gap-5 text-sm">
          <Link href="/search" className="hover:text-brand-primary">Browse</Link>
          <Link href="/how-it-works" className="hover:text-brand-primary">How It Works</Link>
          {!user?.is_seller && (
            <Link href="/become-seller" className="hover:text-brand-primary">Become a Seller</Link>
          )}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          {user ? (
            <>
              <Link href="/messages" aria-label="Messages" className="p-2 rounded-lg hover:bg-neutral-100">
                <Bell className="w-5 h-5 text-neutral-700" />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                      <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium text-neutral-900">{user.full_name}</div>
                    <div className="text-xs text-neutral-500">@{user.username}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/dashboard")}>Dashboard</DropdownMenuItem>
                  {user.is_seller && (
                    <DropdownMenuItem onSelect={() => router.push("/seller/dashboard")}>Seller Dashboard</DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => router.push("/messages")}>Messages</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/settings")}>Settings</DropdownMenuItem>
                  {user.is_admin && (
                    <DropdownMenuItem onSelect={() => router.push("/admin")}>Admin</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={signOut}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-brand-primary">
                Login
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Sign Up
              </Link>
            </>
          )}
          <button className="lg:hidden p-2" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
