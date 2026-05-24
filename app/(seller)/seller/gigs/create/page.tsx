"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageUpload } from "@/components/ui/image-upload";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/slug-generator";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface PackageDraft {
  package_type: "basic" | "standard" | "premium";
  name: string;
  description: string;
  price: number;
  delivery_days: number;
  revisions: number;
  features: Array<{ name: string; included: boolean }>;
}

const DEFAULT_PACKAGES: PackageDraft[] = [
  { package_type: "basic", name: "Basic", description: "Starter package", price: 50, delivery_days: 7, revisions: 1, features: [] },
  { package_type: "standard", name: "Standard", description: "Most popular", price: 150, delivery_days: 14, revisions: 3, features: [] },
  { package_type: "premium", name: "Premium", description: "Full service", price: 300, delivery_days: 21, revisions: 5, features: [] },
];

const STEPS = ["Overview", "Pricing", "Description", "Gallery", "Review"];

export default function CreateGigPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [packages, setPackages] = useState<PackageDraft[]>(DEFAULT_PACKAGES);
  const [description, setDescription] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [requirements, setRequirements] = useState("");
  const [thumbnail, setThumbnail] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      setLoading(false);
      return;
    }
    const slug = slugify(title) + "-" + Date.now().toString(36).slice(-4);
    const { data: gig, error } = await sb
      .from("gigs")
      .insert({
        seller_id: user.id,
        category_id: categoryId || "11111111-1111-1111-1111-111111111111",
        title,
        slug,
        description,
        short_description: shortDesc,
        tags,
        thumbnail_url: thumbnail[0] || null,
        gallery_images: gallery,
        requirements,
        status: "pending_approval",
      })
      .select()
      .single();
    if (error || !gig) {
      toast.error(error?.message || "Failed");
      setLoading(false);
      return;
    }
    for (const p of packages) {
      await sb.from("gig_packages").insert({ gig_id: gig.id, ...p });
    }
    setLoading(false);
    toast.success("Gig submitted for review!");
    router.push("/seller/gigs");
  }

  const checks = {
    title: title.length >= 10,
    tags: tags.length > 0,
    pricing: packages.every((p) => p.price >= 5),
    description: description.length >= 120,
    thumbnail: thumbnail.length > 0,
  };
  const allValid = Object.values(checks).every(Boolean);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Seller</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Create a gig</h1>
          <p className="text-sm text-ink-subtle mt-1">
            Step {step} of {STEPS.length} · {STEPS[step - 1]}
          </p>
        </header>

        <ol className="flex gap-1.5 mb-8">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const done = s < step;
            const current = s === step;
            return (
              <li
                key={label}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors",
                  done || current ? "bg-brand-primary" : "bg-line"
                )}
              />
            );
          })}
        </ol>

        <div className="bg-white border border-line rounded-2xl p-6 sm:p-7">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-heading text-lg text-ink">Overview</h2>
              <Field
                label="Gig title"
                hint={`${title.length}/80 — start with "I will…"`}
              >
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  placeholder="I will build a professional Bubble.io MVP"
                />
              </Field>
              <Field label="Tags" hint={`${tags.length}/5`}>
                <TagInput value={tags} onChange={setTags} max={5} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-heading text-lg text-ink">Pricing</h2>
              <p className="text-sm text-ink-subtle">Three tiers — buyers will see them as Basic / Standard / Premium tabs.</p>
              {packages.map((pkg, i) => (
                <div key={pkg.package_type} className="border border-line rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xs uppercase tracking-wider font-semibold text-brand-primary-dark">
                      {pkg.package_type}
                    </span>
                    {pkg.package_type === "standard" && (
                      <span className="text-2xs px-1.5 py-0.5 rounded-full bg-brand-accent/15 text-brand-accent-dark font-semibold">
                        Most popular
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Field label="Name">
                      <Input
                        value={pkg.name}
                        onChange={(e) => setPackages((prev) => prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)))}
                      />
                    </Field>
                    <Field label="Price ($)">
                      <Input
                        type="number"
                        min={5}
                        value={pkg.price}
                        onChange={(e) => setPackages((prev) => prev.map((p, j) => (j === i ? { ...p, price: Number(e.target.value) } : p)))}
                      />
                    </Field>
                    <Field label="Delivery (days)">
                      <Input
                        type="number"
                        min={1}
                        value={pkg.delivery_days}
                        onChange={(e) => setPackages((prev) => prev.map((p, j) => (j === i ? { ...p, delivery_days: Number(e.target.value) } : p)))}
                      />
                    </Field>
                    <Field label="Revisions">
                      <Input
                        type="number"
                        min={0}
                        value={pkg.revisions}
                        onChange={(e) => setPackages((prev) => prev.map((p, j) => (j === i ? { ...p, revisions: Number(e.target.value) } : p)))}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-heading text-lg text-ink">Description</h2>
              <Field label="Short description" hint={`${shortDesc.length}/150 — shown in cards`}>
                <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} maxLength={150} rows={2} />
              </Field>
              <Field label="Full description" hint="Min 120 characters">
                <RichTextEditor value={description} onChange={setDescription} />
              </Field>
              <Field label="Requirements from buyer">
                <Textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={3}
                  placeholder="What do you need from the buyer to start the work?"
                />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-heading text-lg text-ink">Gallery</h2>
              <Field label="Thumbnail" hint="Required · 5:3 aspect works best">
                <ImageUpload value={thumbnail} onChange={setThumbnail} />
              </Field>
              <Field label="Gallery images" hint="Up to 5 · shown on gig detail">
                <ImageUpload value={gallery} onChange={setGallery} multiple max={5} />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="font-heading text-lg text-ink">Review &amp; publish</h2>
              <ul className="space-y-2">
                <Checkrow label="Title is at least 10 characters" ok={checks.title} />
                <Checkrow label="At least one tag added" ok={checks.tags} />
                <Checkrow label="All 3 packages priced ($5 min)" ok={checks.pricing} />
                <Checkrow label="Description is 120+ characters" ok={checks.description} />
                <Checkrow label="Thumbnail uploaded" ok={checks.thumbnail} />
              </ul>
              <p className="text-xs text-ink-subtle bg-canvas-subtle border border-line rounded-md p-3 leading-relaxed">
                After you submit, our team reviews your gig within 24 hours.
                Approved gigs appear in search immediately.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-7 pt-5 border-t border-line">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="inline-flex h-10 px-4 items-center gap-1 rounded-md text-sm font-medium text-ink-muted hover:bg-canvas-subtle hover:text-ink transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}
            {step < STEPS.length ? (
              <button
                onClick={() => setStep(step + 1)}
                className="inline-flex h-10 px-4 items-center gap-1 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading || !allValid}
                className="inline-flex h-10 px-5 items-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit for review
              </button>
            )}
          </div>
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

function Checkrow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
          ok ? "bg-success/10 text-success" : "bg-canvas-subtle text-ink-faint border border-line"
        )}
      >
        {ok && <Check className="w-3 h-3" strokeWidth={3} />}
      </span>
      <span className={ok ? "text-ink" : "text-ink-subtle"}>{label}</span>
    </li>
  );
}
