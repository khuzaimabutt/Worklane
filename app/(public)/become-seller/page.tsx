"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, ChevronLeft, Landmark, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const SUGGESTED_SKILLS = ["React", "Next.js", "Node.js", "Python", "Figma", "Bubble.io", "Webflow", "TypeScript", "AI Integration", "UI/UX Design"];
const BANKS = [
  "HBL - Habib Bank Limited",
  "MCB Bank",
  "United Bank Limited (UBL)",
  "Allied Bank Limited (ABL)",
  "Bank Alfalah",
  "Meezan Bank",
  "Faysal Bank",
  "Standard Chartered Pakistan",
  "Other International Bank",
];

const STEPS = ["About you", "Background", "Bank", "Done"];

export default function BecomeSellerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routing, setRouting] = useState("");

  async function activate() {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      toast.error("Please sign in first");
      router.push("/login?redirect=/become-seller");
      return;
    }
    await sb.from("users").update({ is_seller: true }).eq("id", user.id);
    await sb.from("seller_profiles").upsert({
      user_id: user.id,
      tagline,
      description: bio,
      skills,
      seller_level: "new_seller",
      stripe_onboarding_complete: false,
    });
  }

  async function connectBank() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      await sb.from("seller_profiles").update({
        stripe_onboarding_complete: true,
        mock_bank_name: bankName,
        mock_account_last4: accountNumber.slice(-4),
      }).eq("user_id", user.id);
    }
    setLoading(false);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    setStep(4);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <header className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-dark mb-2">Seller onboarding</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Become a seller</h1>
          <p className="text-sm text-ink-subtle mt-1">Takes about 2 minutes.</p>
        </header>

        <ol className="flex items-center justify-between mb-8" aria-label="Onboarding steps">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const done = s < step;
            const current = s === step;
            return (
              <li key={label} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                      done
                        ? "bg-brand-primary border-brand-primary text-white"
                        : current
                          ? "bg-white border-brand-primary text-brand-primary-dark"
                          : "bg-white border-line text-ink-faint"
                    )}
                  >
                    {done ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={cn("text-2xs uppercase tracking-wider font-medium", current || done ? "text-ink" : "text-ink-faint")}>
                    {label}
                  </span>
                </div>
                {s < STEPS.length && (
                  <div className={cn("flex-1 h-0.5 mx-2 -mt-4 transition-colors", done ? "bg-brand-primary" : "bg-line")} />
                )}
              </li>
            );
          })}
        </ol>

        <div className="bg-white border border-line rounded-2xl p-6 sm:p-8">
          {step === 1 && (
            <>
              <h2 className="font-heading text-lg text-ink mb-1.5">Tell us about yourself</h2>
              <p className="text-sm text-ink-subtle mb-6">This appears at the top of your seller profile.</p>
              <div className="space-y-5">
                <Field label="Tagline" hint={`${tagline.length}/100`}>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Full-stack web & mobile developer · 5+ years"
                    maxLength={100}
                  />
                </Field>
                <Field label="Bio" hint={`${bio.length}/600`}>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share your background, expertise, and approach…"
                    rows={5}
                    maxLength={600}
                  />
                </Field>
                <Field label="Top skills" hint="Add 3–5 for best results">
                  <TagInput
                    value={skills}
                    onChange={setSkills}
                    suggestions={SUGGESTED_SKILLS}
                    placeholder="Add a skill and press Enter"
                  />
                </Field>
              </div>
              <div className="mt-7 pt-5 border-t border-line flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!tagline || !bio}
                  className="inline-flex h-10 px-5 items-center rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-heading text-lg text-ink mb-1.5">Background</h2>
              <p className="text-sm text-ink-subtle mb-6">Optional — fill these in later from settings.</p>
              <p className="text-sm text-ink-muted leading-relaxed mb-6 p-4 bg-canvas-subtle border border-line rounded-lg">
                Education, certifications, portfolio items, and social links can all be added from your
                seller dashboard once your account is active.
              </p>
              <div className="pt-5 border-t border-line flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex h-10 px-4 items-center gap-1 rounded-md text-sm font-medium text-ink-muted hover:bg-canvas-subtle hover:text-ink transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    await activate();
                    setLoading(false);
                    setStep(3);
                  }}
                  className="inline-flex h-10 px-5 items-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Continue to bank
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-heading text-lg text-ink mb-1.5">Connect your bank</h2>
              <p className="text-sm text-ink-subtle mb-4">Required to receive payouts. Your details are encrypted.</p>
              <div className="flex items-start gap-2 text-sm bg-info/5 border border-info/20 rounded-lg p-3 mb-6">
                <Sparkles className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <p className="text-ink-muted leading-relaxed">
                  <strong className="text-ink">Demo mode:</strong> portfolio project. No real bank
                  connection — these fields are stored as mock values only.
                </p>
              </div>
              <div className="space-y-5">
                <Field label="Bank">
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 bg-white border border-line-strong rounded-md text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                    >
                      <option value="">Select a bank…</option>
                      {BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </Field>
                <Field label="Account holder name">
                  <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="As shown on bank statement" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Account number">
                    <Input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      placeholder="••••••••••••"
                    />
                  </Field>
                  <Field label="Routing number">
                    <Input
                      type="text"
                      value={routing}
                      onChange={(e) => setRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
                      placeholder="9 digits"
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-7 pt-5 border-t border-line flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex h-10 px-4 items-center gap-1 rounded-md text-sm font-medium text-ink-muted hover:bg-canvas-subtle hover:text-ink transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={connectBank}
                  disabled={loading || !bankName || !accountHolder || accountNumber.length < 8}
                  className="inline-flex h-10 px-5 items-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Verifying" : "Connect account"}
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                <Check className="w-7 h-7 text-success" strokeWidth={2.5} />
              </div>
              <h2 className="font-heading text-2xl text-ink mb-2">You&apos;re a seller</h2>
              <p className="text-sm text-ink-muted mb-7 max-w-md mx-auto leading-relaxed">
                Your profile is active. Create your first gig to start receiving orders.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => router.push("/seller/gigs/create")}
                  className="inline-flex h-11 px-5 items-center rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors"
                >
                  Create your first gig
                </button>
                <button
                  onClick={() => router.push("/seller/dashboard")}
                  className="inline-flex h-11 px-5 items-center rounded-md border border-line-strong text-sm font-medium text-ink hover:bg-canvas-subtle transition-colors"
                >
                  Go to dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-ink">{label}</label>
        {hint && <span className="text-2xs text-ink-subtle">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
