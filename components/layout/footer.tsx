import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <Col title="Platform">
          <Link href="/about" className="block hover:text-brand-primary py-1">About</Link>
          <Link href="/blog" className="block hover:text-brand-primary py-1">Blog</Link>
          <Link href="/careers" className="block hover:text-brand-primary py-1">Careers</Link>
          <Link href="/press" className="block hover:text-brand-primary py-1">Press</Link>
        </Col>
        <Col title="Categories">
          <Link href="/category/web-development" className="block hover:text-brand-primary py-1">Web Development</Link>
          <Link href="/category/mobile-development" className="block hover:text-brand-primary py-1">Mobile Development</Link>
          <Link href="/category/design-creative" className="block hover:text-brand-primary py-1">Design & Creative</Link>
          <Link href="/category/ai-automation" className="block hover:text-brand-primary py-1">AI & Automation</Link>
        </Col>
        <Col title="Support">
          <Link href="/help" className="block hover:text-brand-primary py-1">Help Center</Link>
          <Link href="/contact" className="block hover:text-brand-primary py-1">Contact</Link>
          <Link href="/disputes" className="block hover:text-brand-primary py-1">Dispute Policy</Link>
        </Col>
        <Col title="Legal">
          <Link href="/privacy" className="block hover:text-brand-primary py-1">Privacy Policy</Link>
          <Link href="/terms" className="block hover:text-brand-primary py-1">Terms of Service</Link>
          <Link href="/cookies" className="block hover:text-brand-primary py-1">Cookie Policy</Link>
        </Col>
      </div>
      <div className="border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} SkillBazaar. All rights reserved.</p>
          <p className="font-heading text-brand-primary text-base">SkillBazaar</p>
        </div>
      </div>
    </footer>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-neutral-900 mb-3">{title}</h4>
      <div className="space-y-1 text-neutral-600">{children}</div>
    </div>
  );
}
