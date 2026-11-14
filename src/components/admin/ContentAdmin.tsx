"use client";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/utils";
import { useToast } from "@/hooks/providers";
import { Card, Field, PageHeader, Toggle } from "./kit";
import { ErrorState, Skeleton } from "@/components/common/ui";
import type { PublicSettings } from "@/services/settings";

export function ContentAdmin() {
  const { toast } = useToast();
  const [s, setS] = useState<PublicSettings | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { api<PublicSettings>("/api/admin/settings").then(setS).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorState message={error} />;
  if (!s) return <Skeleton className="h-96 w-full" />;

  const up = <K extends keyof PublicSettings>(k: K, v: PublicSettings[K]) => setS({ ...s, [k]: v });
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const r = await api<PublicSettings>("/api/admin/settings", { method: "PUT", json: {
        storeName: s.storeName, tagline: s.tagline, announcement: s.announcement, whatsappNumber: s.whatsappNumber, contact: s.contact, social: s.social,
        about: s.about, footerText: s.footerText, testimonials: s.testimonials, shipping: { flatRate: Number(s.shipping.flatRate), freeAbove: Number(s.shipping.freeAbove) },
        codEnabled: s.codEnabled, lowStockThreshold: Number(s.lowStockThreshold),
      } });
      setS(r); toast("Website content saved — changes are live");
    } catch (er) { toast((er as Error).message, "err"); }
    setSaving(false);
  };

  return (
    <form onSubmit={save} className="space-y-6 pb-24">
      <PageHeader title="Website Content" sub="Everything here updates the public website instantly. Hero & promo banners are under Marketing." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Brand & announcement"><div className="space-y-4">
          <Field label="Store name"><input className="input" value={s.storeName} onChange={(e) => up("storeName", e.target.value)} /></Field>
          <Field label="Tagline"><input className="input" value={s.tagline} onChange={(e) => up("tagline", e.target.value)} /></Field>
          <Field label="Announcement bar text" hint="Leave blank to hide the bar"><input className="input" value={s.announcement} onChange={(e) => up("announcement", e.target.value)} /></Field>
          <Field label="Footer text"><input className="input" value={s.footerText} onChange={(e) => up("footerText", e.target.value)} /></Field>
        </div></Card>

        <Card title="WhatsApp, shipping & payments"><div className="space-y-4">
          <Field label="WhatsApp number" hint="With country code, e.g. 919876543210. Used for all enquiry buttons."><input className="input" value={s.whatsappNumber} onChange={(e) => up("whatsappNumber", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Flat shipping (₹)"><input type="number" min={0} className="input" value={s.shipping.flatRate} onChange={(e) => up("shipping", { ...s.shipping, flatRate: Number(e.target.value) })} /></Field>
            <Field label="Free shipping above (₹)"><input type="number" min={0} className="input" value={s.shipping.freeAbove} onChange={(e) => up("shipping", { ...s.shipping, freeAbove: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Low-stock threshold (units)"><input type="number" min={0} className="input" value={s.lowStockThreshold} onChange={(e) => up("lowStockThreshold", Number(e.target.value))} /></Field>
          <div className="flex items-center justify-between"><span className="text-sm">Enable Cash on Delivery</span><Toggle label="Cash on Delivery" checked={s.codEnabled} onChange={(v) => up("codEnabled", v)} /></div>
        </div></Card>

        <Card title="About Us"><div className="space-y-4">
          <Field label="Heading"><input className="input" value={s.about.title} onChange={(e) => up("about", { ...s.about, title: e.target.value })} /></Field>
          <Field label="Story"><textarea rows={8} className="input" value={s.about.body} onChange={(e) => up("about", { ...s.about, body: e.target.value })} /></Field>
        </div></Card>

        <Card title="Contact & social"><div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email"><input type="email" className="input" value={s.contact.email} onChange={(e) => up("contact", { ...s.contact, email: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" value={s.contact.phone} onChange={(e) => up("contact", { ...s.contact, phone: e.target.value })} /></Field>
          </div>
          <Field label="Address"><input className="input" value={s.contact.address} onChange={(e) => up("contact", { ...s.contact, address: e.target.value })} /></Field>
          <Field label="Opening hours"><input className="input" value={s.contact.hours} onChange={(e) => up("contact", { ...s.contact, hours: e.target.value })} /></Field>
          {(["instagram", "facebook", "youtube", "pinterest"] as const).map((k) => <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} URL`}><input type="url" className="input" value={s.social[k] ?? ""} onChange={(e) => up("social", { ...s.social, [k]: e.target.value })} placeholder="https://…" /></Field>)}
        </div></Card>
      </div>

      <Card title="Testimonials">
        <p className="text-sm text-neutral-600">Add and manage the testimonials shown on the home page. <a href="/admin/testimonials" className="font-medium text-royal underline">Manage testimonials →</a></p>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:left-[232px] xl:left-[260px]"><div className="flex justify-end"><button disabled={saving} className="btn btn-primary !py-2.5">{saving ? <Loader2 size={15} className="animate-spin" /> : "Save all changes"}</button></div></div>
    </form>
  );
}
