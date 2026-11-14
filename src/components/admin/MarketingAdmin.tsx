"use client";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, fmtDate, inr } from "@/utils";
import { useToast } from "@/hooks/providers";
import { Badge, Field, ImageUploader, Modal, PageHeader, SearchBox, Table, Toggle, useList } from "./kit";
import { SmartImage } from "@/components/common/ui";

/* ---------------- Coupons ---------------- */
type Coupon = { _id?: string; code: string; type: "percent" | "fixed"; value: number; minOrder: number; maxDiscount: number; expiresAt?: string | null; usageLimit: number; usedCount?: number; active: boolean };
const blankCoupon: Coupon = { code: "", type: "percent", value: 10, minOrder: 0, maxDiscount: 0, expiresAt: "", usageLimit: 0, active: true };

function Coupons() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useList<Coupon>("/api/admin/coupons", { limit: 100 });
  const [edit, setEdit] = useState<Coupon | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return;
    const body = { ...edit, value: Number(edit.value), minOrder: Number(edit.minOrder) || 0, maxDiscount: Number(edit.maxDiscount) || 0, usageLimit: Number(edit.usageLimit) || 0, expiresAt: edit.expiresAt || null };
    try {
      if (edit._id) await api(`/api/admin/coupons/${edit._id}`, { method: "PUT", json: body }); else await api("/api/admin/coupons", { method: "POST", json: body });
      toast("Coupon saved"); setEdit(null); reload();
    } catch (er) { toast((er as Error).message, "err"); }
  };
  const del = async (c: Coupon) => { if (confirm(`Delete coupon ${c.code}?`)) { await api(`/api/admin/coupons/${c._id}`, { method: "DELETE" }); reload(); } };
  const expired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt) < new Date();
  return (
    <div>
      <div className="mb-4 flex justify-end"><button onClick={() => setEdit(blankCoupon)} className="btn btn-primary !py-2.5"><Plus size={15} /> New coupon</button></div>
      <Table<Coupon> rows={data?.items} loading={loading} error={error} retry={reload} empty="No coupons yet."
        cols={[
          { h: "Code", cell: (c) => <code className="font-medium">{c.code}</code> },
          { h: "Discount", cell: (c) => c.type === "percent" ? `${c.value}%${c.maxDiscount ? ` (max ${inr(c.maxDiscount)})` : ""}` : inr(c.value) },
          { h: "Min. order", cell: (c) => (c.minOrder ? inr(c.minOrder) : "—") },
          { h: "Expiry", cell: (c) => (c.expiresAt ? fmtDate(c.expiresAt) : "Never") },
          { h: "Used", cell: (c) => `${c.usedCount ?? 0}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
          { h: "Status", cell: (c) => expired(c) ? <Badge tone="red">Expired</Badge> : c.active ? <Badge tone="green">Active</Badge> : <Badge>Disabled</Badge> },
          { h: "", className: "text-right", cell: (c) => <div className="flex justify-end gap-3"><button aria-label="Edit" onClick={() => setEdit({ ...c, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "" })}><Pencil size={16} /></button><button aria-label="Delete" className="hover:text-red-600" onClick={() => del(c)}><Trash2 size={16} /></button></div> },
        ]} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? "Edit coupon" : "New coupon"}>
        {edit && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Code"><input required className="input uppercase" value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="Type"><select className="input" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Coupon["type"] })}><option value="percent">Percentage (%)</option><option value="fixed">Fixed amount (₹)</option></select></Field>
            <Field label={edit.type === "percent" ? "Percent off" : "Amount off (₹)"}><input required type="number" min={1} className="input" value={edit.value} onChange={(e) => setEdit({ ...edit, value: Number(e.target.value) })} /></Field>
            <Field label="Minimum order (₹)"><input type="number" min={0} className="input" value={edit.minOrder} onChange={(e) => setEdit({ ...edit, minOrder: Number(e.target.value) })} /></Field>
            {edit.type === "percent" && <Field label="Max discount (₹)" hint="0 = no cap"><input type="number" min={0} className="input" value={edit.maxDiscount} onChange={(e) => setEdit({ ...edit, maxDiscount: Number(e.target.value) })} /></Field>}
            <Field label="Expiry date"><input type="date" className="input" value={edit.expiresAt ?? ""} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value })} /></Field>
            <Field label="Usage limit" hint="0 = unlimited"><input type="number" min={0} className="input" value={edit.usageLimit} onChange={(e) => setEdit({ ...edit, usageLimit: Number(e.target.value) })} /></Field>
            <Field label="Active"><div className="pt-2"><Toggle label="Active" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} /></div></Field>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn btn-outline !py-2.5" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary !py-2.5">Save coupon</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ---------------- Banners ---------------- */
type Banner = { _id?: string; type: "hero" | "promo"; title: string; subtitle?: string; image: string; ctaLabel?: string; ctaLink?: string; active: boolean; sortOrder: number };
const blankBanner: Banner = { type: "hero", title: "", subtitle: "", image: "", ctaLabel: "Shop now", ctaLink: "/shop", active: true, sortOrder: 0 };

function Banners() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useList<Banner>("/api/admin/banners", { limit: 100 });
  const [edit, setEdit] = useState<Banner | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return;
    try {
      const body = { ...edit, sortOrder: Number(edit.sortOrder) || 0 };
      if (edit._id) await api(`/api/admin/banners/${edit._id}`, { method: "PUT", json: body }); else await api("/api/admin/banners", { method: "POST", json: body });
      toast("Banner saved"); setEdit(null); reload();
    } catch (er) { toast((er as Error).message, "err"); }
  };
  const del = async (b: Banner) => { if (confirm("Delete this banner?")) { await api(`/api/admin/banners/${b._id}`, { method: "DELETE" }); reload(); } };
  const toggle = async (b: Banner, active: boolean) => { await api(`/api/admin/banners/${b._id}`, { method: "PUT", json: { ...b, active } }); reload(); };
  return (
    <div>
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-neutral-500">Hero banners rotate at the top of the homepage. The first active promo banner appears as the campaign section.</p><button onClick={() => setEdit(blankBanner)} className="btn btn-primary !py-2.5"><Plus size={15} /> New banner</button></div>
      <Table<Banner> rows={data?.items} loading={loading} error={error} retry={reload} empty="No banners yet."
        cols={[
          { h: "Banner", cell: (b) => <div className="flex items-center gap-3"><div className="h-14 w-11 overflow-hidden bg-lavender"><SmartImage src={b.image} alt="" className="h-full w-full" /></div><div><p className="font-medium">{b.title}</p><p className="line-clamp-1 max-w-xs text-xs text-neutral-500">{b.subtitle}</p></div></div> },
          { h: "Type", cell: (b) => <Badge tone="purple">{b.type === "hero" ? "Homepage hero" : "Promotional"}</Badge> },
          { h: "Order", cell: (b) => b.sortOrder },
          { h: "Active", cell: (b) => <Toggle label="Active" checked={b.active} onChange={(v) => toggle(b, v)} /> },
          { h: "", className: "text-right", cell: (b) => <div className="flex justify-end gap-3"><button aria-label="Edit" onClick={() => setEdit(b)}><Pencil size={16} /></button><button aria-label="Delete" className="hover:text-red-600" onClick={() => del(b)}><Trash2 size={16} /></button></div> },
        ]} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? "Edit banner" : "New banner"}>
        {edit && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Placement"><select className="input" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Banner["type"] })}><option value="hero">Homepage hero</option><option value="promo">Promotional campaign</option></select></Field>
            <Field label="Title"><input required className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Subtitle"><textarea rows={2} className="input" value={edit.subtitle ?? ""} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} /></Field>
            <Field label="Image"><ImageUploader single images={edit.image ? [edit.image] : []} onChange={(v) => setEdit({ ...edit, image: v[0] ?? "" })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Button label"><input className="input" value={edit.ctaLabel ?? ""} onChange={(e) => setEdit({ ...edit, ctaLabel: e.target.value })} /></Field><Field label="Button link"><input className="input" value={edit.ctaLink ?? ""} onChange={(e) => setEdit({ ...edit, ctaLink: e.target.value })} placeholder="/shop?category=sarees" /></Field>
              <Field label="Sort order"><input type="number" className="input" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} /></Field><Field label="Active"><div className="pt-2"><Toggle label="Active" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} /></div></Field></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn btn-outline !py-2.5" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary !py-2.5">Save banner</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ---------------- Featured ---------------- */
type P = { _id: string; name: string; images: string[]; featured: boolean; bestseller: boolean; trending: boolean };
function Featured() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useList<P>("/api/admin/products", { q, page });
  const set = async (p: P, change: Partial<P>) => {
    try { const full = await api<{ item: Record<string, unknown> }>(`/api/admin/products/${p._id}`); await api(`/api/admin/products/${p._id}`, { method: "PUT", json: { ...full.item, ...change } }); reload(); }
    catch (e) { toast((e as Error).message, "err"); }
  };
  return (
    <div>
      <p className="mb-3 text-sm text-neutral-500">Choose which products appear in the homepage sections “Featured”, “Best Sellers” and “Trending”.</p>
      <div className="mb-4"><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search products" /></div>
      <Table<P> rows={data?.items} loading={loading} error={error} retry={reload} page={data?.page} pages={data?.pages} onPage={setPage}
        cols={[
          { h: "Product", cell: (p) => <div className="flex items-center gap-3"><div className="h-12 w-10 overflow-hidden bg-lavender"><SmartImage src={p.images[0]} alt="" className="h-full w-full" /></div><span className="font-medium">{p.name}</span></div> },
          { h: "Featured", cell: (p) => <Toggle label="Featured" checked={p.featured} onChange={(v) => set(p, { featured: v })} /> },
          { h: "Best seller", cell: (p) => <Toggle label="Best seller" checked={p.bestseller} onChange={(v) => set(p, { bestseller: v })} /> },
          { h: "Trending", cell: (p) => <Toggle label="Trending" checked={p.trending} onChange={(v) => set(p, { trending: v })} /> },
        ]} />
    </div>
  );
}

export function MarketingAdmin() {
  const [tab, setTab] = useState<"coupons" | "banners" | "featured">("coupons");
  return (
    <div>
      <PageHeader title="Marketing" sub="Coupons, homepage banners and featured products" />
      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b sm:gap-2">
        {([["coupons", "Coupons"], ["banners", "Banners & promotions"], ["featured", "Featured products"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm sm:px-4 ${tab === k ? "border-royal text-royal" : "border-transparent text-neutral-500"}`}>{l}</button>
        ))}
      </div>
      {tab === "coupons" ? <Coupons /> : tab === "banners" ? <Banners /> : <Featured />}
    </div>
  );
}
