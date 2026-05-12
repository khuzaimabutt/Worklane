"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
        <main className="text-center py-16 text-neutral-400">Loading…</main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl mb-6">Settings</h1>
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {user.is_seller && <TabsTrigger value="seller">Seller</TabsTrigger>}
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input value={user.username} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={600} />
                <p className="text-xs text-neutral-500 mt-1">{bio.length}/600</p>
              </div>
              <Button onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Change Password</h3>
              <p className="text-sm text-neutral-500">Use the forgot-password flow to change your password.</p>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
              {["New orders", "Order updates", "Messages", "Review reminders", "Promotions"].map((label) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <span className="text-sm">{label}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </TabsContent>

          {user.is_seller && (
            <TabsContent value="seller">
              <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Available (accepting new orders)</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Vacation mode</span>
                  <Switch />
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="account">
            <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
              <Button variant="secondary">Export My Data</Button>
              <Button variant="danger">Delete Account</Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </>
  );
}
