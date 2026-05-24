"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, Search, Heart } from "lucide-react";
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
import { cn } from "@/lib/utils/cn";
import type { User } from "@/types/database.types";

const NAV_LINKS = [
  { href: "/search", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link
          href="/"
          className="text-xl font-semibold text-brand-primary tracking-tight whitespace-nowrap shrink-0 hover:text-brand-primary-dark transition-colors"
        >
          SkillBazaar
        </Link>

        <form onSubmit={onSearch} className="hidden md:flex flex-1 min-w-0 max-w-xl">
          <div className="relative w-full min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What service are you looking for?"
              className="w-full pl-9 pr-4 h-10 bg-canvas-subtle border border-transparent rounded-md text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-colors"
            />
          </div>
        </form>

        <nav className="hidden lg:flex items-center gap-1 text-sm shrink-0">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 h-9 inline-flex items-center rounded-md transition-colors",
                isActive(l.href)
                  ? "text-brand-primary-dark bg-brand-primary-50"
                  : "text-ink-muted hover:text-ink hover:bg-canvas-subtle"
              )}
            >
              {l.label}
            </Link>
          ))}
          {!user?.is_seller && (
            <Link
              href="/become-seller"
              className="px-3 h-9 inline-flex items-center rounded-md text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
            >
              Become a seller
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 ml-auto shrink-0">
          {user ? (
            <>
              <Link
                href="/favorites"
                aria-label="Favorites"
                className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
              >
                <Heart className="w-[18px] h-[18px]" />
              </Link>
              <Link
                href="/messages"
                aria-label="Messages"
                className="relative w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
              >
                <Bell className="w-[18px] h-[18px]" />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    aria-label="Account menu"
                  >
                    <Avatar className="w-8 h-8 border border-line">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                      <AvatarFallback className="text-xs bg-canvas-subtle text-ink-muted">
                        {initials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <div className="font-semibold text-ink truncate">{user.full_name}</div>
                    <div className="text-xs text-ink-subtle font-normal truncate">@{user.username}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/dashboard")}>Dashboard</DropdownMenuItem>
                  {user.is_seller && (
                    <DropdownMenuItem onSelect={() => router.push("/seller/dashboard")}>
                      Seller Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => router.push("/messages")}>Messages</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/settings")}>Settings</DropdownMenuItem>
                  {user.is_admin && (
                    <DropdownMenuItem onSelect={() => router.push("/admin")}>Admin</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex h-9 px-3 items-center rounded-md text-sm font-medium text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 px-4 items-center rounded-md text-sm font-medium bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors"
              >
                Join
              </Link>
            </>
          )}
          <button
            className="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
