import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GigCardSkeleton } from "@/components/gig/gig-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
          <div className="hidden lg:block">
            <div className="bg-white border border-line rounded-xl p-5 space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-line">
              <Skeleton className="h-9 w-20 lg:hidden" />
              <Skeleton className="h-9 w-32 ml-auto" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <GigCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
