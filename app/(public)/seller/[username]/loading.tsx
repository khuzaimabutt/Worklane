import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerProfileLoading() {
  return (
    <>
      <Navbar />
      <main className="bg-canvas min-h-screen">
        <div className="h-48 sm:h-56 bg-gradient-to-br from-brand-primary via-brand-primary-dark to-[#064E50]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 pb-12">
          <div className="bg-white border border-line rounded-2xl overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
              <Skeleton className="w-28 h-28 sm:w-32 sm:h-32 rounded-full -mt-20 sm:-mt-24 border-4 border-white shrink-0" />
              <div className="min-w-0 flex-1 sm:pt-2 space-y-3">
                <Skeleton className="h-8 w-64 max-w-full" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-full max-w-md" />
                <div className="flex gap-2 flex-wrap mt-2">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-28 rounded-full" />
                  <Skeleton className="h-7 w-32 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-11 w-44 shrink-0" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-line">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center px-4 py-5 border-r border-line last:border-r-0 space-y-2">
                  <Skeleton className="h-7 w-12 mx-auto" />
                  <Skeleton className="h-2 w-20 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-line rounded-xl overflow-hidden">
                <Skeleton className="aspect-[5/3]" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 flex-1" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5" />
                    <Skeleton className="h-3.5 w-3/4" />
                  </div>
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
