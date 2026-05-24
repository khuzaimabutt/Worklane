import Link from "next/link";
import { Search, Home } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20 text-center">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-dark mb-3">
            404 · Not found
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl text-ink mb-3 text-balance">
            We couldn&apos;t find that page.
          </h1>
          <p className="text-sm text-ink-muted leading-relaxed mb-8">
            The link may be broken, the page may have moved, or it may never have existed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors"
            >
              <Home className="w-4 h-4" />
              Back home
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-line-strong text-sm font-medium text-ink hover:bg-canvas-subtle transition-colors"
            >
              <Search className="w-4 h-4" />
              Browse services
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
