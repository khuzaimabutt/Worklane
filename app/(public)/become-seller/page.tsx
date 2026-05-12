"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/client";
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

export default function BecomeSellerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // Step 3
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routing, setRouting] = useState("");

  async function activate() {
    setLoading(true);
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
    await new Promise((r) => setTimeout(r, 2000));
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
    confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
    setStep(4);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-neutral-200 rounded-xl p-8">
          {/* Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    s < step ? "bg-success text-white" : s === step ? "bg-brand-primary text-white" : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`flex-1 h-0.5 ${s < step ? "bg-success" : "bg-neutral-200"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <h1 className="font-heading text-3xl mb-2">Tell us about yourself</h1>
              <p className="text-neutral-500 mb-6">This appears on your seller profile.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tagline</label>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Full-Stack Web & Mobile Developer | 5+ Years"
                    maxLength={100}
                  />
                  <p className="text-xs text-neutral-500 mt-1">{tagline.length}/100</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share your background, expertise, and approach..."
                    rows={5}
                    maxLength={600}
                  />
                  <p className="text-xs text-neutral-500 mt-1">{bio.length}/600</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Your top skills</label>
                  <TagInput value={skills} onChange={setSkills} suggestions={SUGGESTED_SKILLS} placeholder="Add a skill and press Enter" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!tagline || !bio}>Next</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-heading text-3xl mb-2">Background</h1>
              <p className="text-neutral-500 mb-6">Optional — you can fill these in later from settings.</p>
              <p className="text-sm text-neutral-600 mb-6">
                Education, certifications, portfolio, and social links can all be added from your seller dashboard once you&apos;re active.
              </p>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button
                  onClick={async () => {
                    await activate();
                    setLoading(false);
                    setStep(3);
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue to Bank Connection"}
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-heading text-3xl mb-2">Connect Your Bank</h1>
              <p className="text-neutral-500 mb-2">Required to receive payouts. Your details are encrypted.</p>
              <p className="text-xs text-info bg-info/10 border border-info/30 rounded-lg p-2 mb-6">
                <strong>Demo mode:</strong> This is a portfolio project. No real bank connection — these fields are stored as mock values only.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Name</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full h-10 border border-neutral-300 rounded-lg px-3 text-sm"
                  >
                    <option value="">Select a bank…</option>
                    {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                  <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <Input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder="••••••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Routing Number</label>
                  <Input
                    type="text"
                    value={routing}
                    onChange={(e) => setRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="9-digit routing number"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={connectBank} disabled={loading || !bankName || !accountHolder || accountNumber.length < 8}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                  ) : (
                    "Connect Account"
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h1 className="font-heading text-4xl mb-3">Welcome to SkillBazaar Sellers! 🎉</h1>
              <p className="text-neutral-600 mb-6">Your seller profile is active. Create your first gig to start earning.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="cta" size="lg" onClick={() => router.push("/seller/gigs/create")}>
                  Create Your First Gig
                </Button>
                <Button variant="secondary" onClick={() => router.push("/seller/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
