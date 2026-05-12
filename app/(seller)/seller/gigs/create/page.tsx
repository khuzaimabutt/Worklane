"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageUpload } from "@/components/ui/image-upload";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/slug-generator";
import { toast } from "sonner";

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

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl mb-2">Create a Gig</h1>
        <p className="text-sm text-neutral-500 mb-6">Step {step} of 5</p>

        <div className="flex mb-6 gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-brand-primary" : "bg-neutral-200"}`} />
          ))}
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          {step === 1 && (
            <>
              <h2 className="font-heading text-2xl mb-4">Overview</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Gig Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="I will..." />
                  <p className="text-xs text-neutral-500 mt-1">{title.length}/80</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Tags</label>
                  <TagInput value={tags} onChange={setTags} max={5} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-heading text-2xl mb-4">Pricing</h2>
              <div className="space-y-4">
                {packages.map((pkg, i) => (
                  <div key={pkg.package_type} className="border border-neutral-200 rounded-lg p-4 grid md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs uppercase text-neutral-500 mb-1">{pkg.package_type}</p>
                      <Input
                        value={pkg.name}
                        onChange={(e) => setPackages((prev) => prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)))}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Price ($)</p>
                      <Input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => setPackages((prev) => prev.map((p, j) => (j === i ? { ...p, price: Number(e.target.value) } : p)))}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Delivery (days)</p>
                      <Input
                        type="number"
                        value={pkg.delivery_days}
                        onChange={(e) => setPackages((prev) => prev.map((p, j) => (j === i ? { ...p, delivery_days: Number(e.target.value) } : p)))}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Revisions</p>
                      <Input
                        type="number"
                        value={pkg.revisions}
                        onChange={(e) => setPackages((prev) => prev.map((p, j) => (j === i ? { ...p, revisions: Number(e.target.value) } : p)))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-heading text-2xl mb-4">Description</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Short description (shown in cards)</label>
                  <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} maxLength={150} rows={2} />
                  <p className="text-xs text-neutral-500 mt-1">{shortDesc.length}/150</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Full description</label>
                  <RichTextEditor value={description} onChange={setDescription} />
                  <p className="text-xs text-neutral-500 mt-1">Min 120 characters</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Requirements you need from buyers</label>
                  <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} />
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-heading text-2xl mb-4">Gallery</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Thumbnail (required)</label>
                  <ImageUpload value={thumbnail} onChange={setThumbnail} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Gallery images (up to 5)</label>
                  <ImageUpload value={gallery} onChange={setGallery} multiple max={5} />
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="font-heading text-2xl mb-4">Preview & Publish</h2>
              <div className="space-y-2 text-sm">
                <Checklist label="Title" ok={title.length >= 10} />
                <Checklist label="Tags" ok={tags.length > 0} />
                <Checklist label="3 packages priced" ok={packages.every((p) => p.price >= 5)} />
                <Checklist label="Description (120+ chars)" ok={description.length >= 120} />
                <Checklist label="Thumbnail uploaded" ok={thumbnail.length > 0} />
              </div>
              <p className="text-xs text-neutral-500 mt-4">Your gig will be reviewed within 24 hours.</p>
            </>
          )}

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
            ) : (
              <div />
            )}
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button variant="cta" onClick={submit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for Review"}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Checklist({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Check className={`w-4 h-4 ${ok ? "text-success" : "text-neutral-300"}`} />
      <span className={ok ? "" : "text-neutral-500"}>{label}</span>
    </div>
  );
}
