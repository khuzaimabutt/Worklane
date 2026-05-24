import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Worklane — Find the Right Freelancer. Get It Done.",
  description: "Browse services from verified professionals. Quality work, transparent pricing, secure payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-white text-neutral-900">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
