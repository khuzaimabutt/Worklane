import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-24 text-center">
        <div>
          <p className="font-heading text-9xl text-brand-primary mb-4">404</p>
          <h1 className="font-heading text-3xl mb-2">Page not found</h1>
          <p className="text-neutral-500 mb-8 max-w-md">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
