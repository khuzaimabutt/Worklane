"use client";

import { useEffect, useState } from "react";
import { Loader2, AtSign, AlertTriangle, Mail } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { User } from "@/types/database.types";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: { user: au } } = await sb.auth.getUser();
      if (!au) return;
      const { data } = await sb.from("users").select("*").eq("id", au.id).single();
      if (data) {
        setUser(data as User);
        setFullName(data.full_name);
        setBio(data.bio ?? "");
      }
    })();
  }, []);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const sb = createClient();
    const { error } = await sb.from("users").update({ full_name: fullName, bio }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Save failed");
    else toast.success("Profile saved");
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="py-20 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-ink-faint mx-auto" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">Account</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink">Settings</h1>
        </header>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {user.is_seller && <TabsTrigger value="seller">Seller</TabsTrigger>}
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Section title="Profile" description="Shown publicly on your seller profile and order pages.">
              <div className="space-y-5">
                <Field label="Full name">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Field>
                <Field label="Username" hint="Username can't be changed">
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
                    <Input value={user.username} disabled className="pl-9" />
                  </div>
                </Field>
                <Field label="Bio" hint={`${bio.length}/600`}>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    maxLength={600}
                    placeholder="A short bio shown on your profile."
                  />
                </Field>
              </div>
              <div className="pt-5 mt-5 border-t border-line flex justify-end">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="inline-flex h-10 px-5 items-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save changes
                </button>
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="security">
            <Section title="Security" description="Manage how you sign in.">
              <div className="flex items-center justify-between gap-4 py-3 border-y border-line">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">Password</p>
                  <p className="text-xs text-ink-subtle">Last changed never</p>
                </div>
                <Link
                  href="/forgot-password"
                  className="inline-flex h-9 px-4 items-center rounded-md border border-line-strong text-sm font-medium text-ink hover:bg-canvas-subtle transition-colors shrink-0"
                >
                  Reset password
                </Link>
              </div>
              <p className="text-xs text-ink-subtle mt-4 leading-relaxed">
                We use the forgot-password flow to verify ownership before letting you set a new
                password.
              </p>
            </Section>
          </TabsContent>

          <TabsContent value="notifications">
            <Section title="Notifications" description="What we email you about. Most users keep all on.">
              <div className="divide-y divide-line">
                {[
                  { label: "New orders", description: "When someone orders one of your gigs" },
                  { label: "Order updates", description: "Status changes, deliveries, revisions" },
                  { label: "Messages", description: "New messages in your inbox" },
                  { label: "Review reminders", description: "After an order completes" },
                  { label: "Promotions", description: "Platform tips and feature updates" },
                ].map(({ label, description }) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{label}</p>
                      <p className="text-xs text-ink-subtle">{description}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-subtle mt-4 leading-relaxed flex items-start gap-1.5">
                <Mail className="w-3.5 h-3.5 mt-0.5 text-ink-faint shrink-0" />
                Transactional emails (password resets, payment receipts) are always sent.
              </p>
            </Section>
          </TabsContent>

          {user.is_seller && (
            <TabsContent value="seller">
              <Section title="Seller preferences" description="Control whether buyers can place new orders.">
                <div className="divide-y divide-line">
                  <Toggle
                    label="Accepting new orders"
                    description="When off, your gigs are paused and don't show in search."
                    defaultChecked
                  />
                  <Toggle
                    label="Vacation mode"
                    description="Shows an away banner on your profile with a return date."
                  />
                </div>
              </Section>
            </TabsContent>
          )}

          <TabsContent value="account">
            <Section title="Export" description="Download a copy of your account data.">
              <button className="inline-flex h-10 px-4 items-center rounded-md border border-line-strong text-sm font-medium text-ink hover:bg-canvas-subtle transition-colors">
                Export my data
              </button>
            </Section>
            <Section
              title="Danger zone"
              description="Permanently delete your account and all associated data."
              tone="danger"
            >
              <div className="flex items-start gap-3 text-sm bg-error/5 border border-error/20 rounded-lg p-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <p className="text-ink-muted leading-relaxed">
                  Deletion is irreversible. Active orders must be completed or cancelled first.
                </p>
              </div>
              <button className="inline-flex h-10 px-4 items-center rounded-md bg-error text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                Delete account
              </button>
            </Section>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </>
  );
}

function Section({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description?: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white border rounded-2xl p-6 sm:p-7 mb-5 ${tone === "danger" ? "border-error/30" : "border-line"}`}>
      <div className="mb-5">
        <h2 className={`font-heading text-lg ${tone === "danger" ? "text-error" : "text-ink"}`}>{title}</h2>
        {description && <p className="text-sm text-ink-subtle mt-1">{description}</p>}
      </div>
      {children}
    </div>
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

function Toggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-subtle">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
