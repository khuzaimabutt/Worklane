import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function GigDetailLoading() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">
        <Skeleton className="h-3 w-48 mb-5" />
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-8 space-y-6">
            <div>
              <Skeleton className="h-9 w-3/4 mb-4" />
              <div className="flex items-center gap-3 flex-wrap">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="aspect-[16/9] rounded-2xl" />
            <div className="bg-white border border-line rounded-2xl p-6 sm:p-7 space-y-3">
              <Skeleton className="h-5 w-40 mb-3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-card">
              <div className="h-12 border-b border-line flex">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-1 flex items-center justify-center">
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-3" />
                  ))}
                </div>
                <Skeleton className="h-11" />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
