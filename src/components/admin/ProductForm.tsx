"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Check, CircleDashed, FileText, Image as ImageIcon, IndianRupee, Layers, ListChecks, Loader2, Plus, Save, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { api, discountPct, inr, slugify } from "@/utils";
import { useToast } from "@/hooks/providers";
import { Field, ImageUploader, Toggle } from "./kit";
import { ErrorState, SmartImage, Skeleton } from "@/components/common/ui";

type Variant = { sku: string; size: string; color: string; stock: number };
type FormState = {
  name: string; slug: string; description: string; category: string; price: string; salePrice: string; images: string[];
  colors: { name: string; hex: string }[]; sizes: string[]; variants: Variant[]; fabric: string; specifications: { key: string; value: string }[];
  featured: boolean; bestseller: boolean; trending: boolean; published: boolean;
};
const EMPTY: FormState = { name: "", slug: "", description: "", category: "", price: "", salePrice: "", images: [], colors: [], sizes: [], variants: [], fabric: "", specifications: [], featured: false, bestseller: false, trending: false, published: true };
const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size", "One Size"];
const SWATCHES = ["#7A184E", "#120A1E", "#D4AF37", "#E8B7C3", "#0F7B5F", "#1F2A5A", "#C0262D", "#F4E7CB", "#FFFFFF", "#8A8A8A"];

function Section({ n, icon: Icon, title, hint, actions, children, id }: { n: number; icon: typeof FileText; title: string; hint?: string; actions?: ReactNode; children: ReactNode; id: string }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(18,10,30,0.04)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7A184E]/8 text-[#7A184E]"><Icon size={17} /></span>
          <div><h2 className="text-[15px] font-semibold text-[#120A1E]"><span className="mr-1.5 text-neutral-400">{n}.</span>{title}</h2>{hint && <p className="text-xs text-neutral-500">{hint}</p>}</div>
        </div>
        {actions}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [f, setF] = useState<FormState>(EMPTY);
  const [cats, setCats] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState({ name: "", hex: "#7A184E" });
  const [initial, setInitial] = useState(JSON.stringify(EMPTY));
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api<{ items: { _id: string; name: string }[] }>("/api/admin/categories?limit=100").then((r) => setCats(r.items)).catch(() => {});
    if (id) api<{ item: Record<string, unknown> }>(`/api/admin/products/${id}`).then(({ item }) => {
      const loaded = { ...EMPTY, ...(item as object), category: String(item.category), price: String(item.price ?? ""), salePrice: item.salePrice ? String(item.salePrice) : "" } as FormState;
      setF(loaded); setInitial(JSON.stringify(loaded)); setLoading(false);
    }).catch((e) => { setError(e.message); setLoading(false); });
  }, [id]);

  const dirty = JSON.stringify(f) !== initial;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const price = Number(f.price) || 0;
  const sale = Number(f.salePrice) || 0;
  const onSale = sale > 0 && sale < price;
  const totalStock = f.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const catName = cats.find((c) => c._id === f.category)?.name;

  const checks = useMemo(() => [
    { ok: f.name.trim().length > 1, t: "Product name" },
    { ok: !!f.category, t: "Category selected" },
    { ok: f.images.length > 0, t: "At least one image" },
    { ok: price > 0 && (!f.salePrice || onSale), t: "Valid pricing" },
    { ok: f.variants.length > 0 && totalStock > 0, t: "Variants with stock" },
    { ok: f.description.trim().length >= 20, t: "Description (20+ characters)" },
  ], [f, price, onSale, totalStock]);
  const done = checks.filter((c) => c.ok).length;
  const pct = Math.round((done / checks.length) * 100);

  const addSize = (s: string) => { const v = s.trim(); if (v && !f.sizes.includes(v)) set("sizes", [...f.sizes, v]); setNewSize(""); };
  const addColor = () => { const n = newColor.name.trim(); if (n && !f.colors.some((c) => c.name.toLowerCase() === n.toLowerCase())) set("colors", [...f.colors, { name: n, hex: newColor.hex }]); setNewColor({ name: "", hex: newColor.hex }); };

  const generate = () => {
    if (!f.sizes.length || !f.colors.length) return toast("Add at least one size and one colour first", "err");
    const base = (f.slug || slugify(f.name)).split("-").map((w) => w[0]).join("").toUpperCase().slice(0, 4) || "SKY";
    const existing = new Map(f.variants.map((v) => [`${v.color}|${v.size}`, v]));
    const next: Variant[] = [];
    for (const c of f.colors) for (const s of f.sizes) {
      const old = existing.get(`${c.name}|${s}`);
      next.push(old ?? { sku: `SKY-${base}-${c.name.slice(0, 3).toUpperCase()}-${s.replace(/\s/g, "").toUpperCase()}`, size: s, color: c.name, stock: 0 });
    }
    set("variants", next);
    toast(`${next.length} variants ready: set stock for each`);
  };
  const setVariant = (color: string, size: string, patch: Partial<Variant>) => set("variants", f.variants.map((v) => (v.color === color && v.size === size ? { ...v, ...patch } : v)));
  const setColorStock = (color: string, n: number) => set("variants", f.variants.map((v) => (v.color === color ? { ...v, stock: n } : v)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...f, slug: f.slug || undefined, price: Number(f.price), salePrice: f.salePrice ? Number(f.salePrice) : null,
        variants: f.variants.map((v) => ({ ...v, stock: Number(v.stock) || 0 })),
        specifications: f.specifications.filter((s) => s.key && s.value),
      };
      if (id) await api(`/api/admin/products/${id}`, { method: "PUT", json: payload });
      else await api("/api/admin/products", { method: "POST", json: payload });
      setInitial(JSON.stringify(f));
      toast(id ? "Product updated" : "Product created");
      router.push("/admin/products");
    } catch (er) { toast((er as Error).message, "err"); }
    setSaving(false);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-96 w-full" /></div>;
  if (error) return <ErrorState message={error} />;

  const colorGroups = f.colors.map((c) => ({ c, rows: f.variants.filter((v) => v.color === c.name) })).filter((g) => g.rows.length);
  const orphan = f.variants.filter((v) => !f.colors.some((c) => c.name === v.color));
  const nav = [["basic", "Basics"], ["media", "Media"], ["pricing", "Pricing"], ["variants", "Variants"], ["details", "Details"]];

  return (
    <form onSubmit={save} className="pb-28">
      {/* sticky header */}
      <div className="sticky top-[var(--admin-bar,0px)] z-30 -mx-4 mb-6 border-b border-neutral-200/80 bg-[#F6F4F1]/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin/products" aria-label="Back to products" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"><ArrowLeft size={16} /></Link>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-[#120A1E] md:text-2xl">{f.name.trim() || (id ? "Edit product" : "New product")}</h1>
              <p className="flex items-center gap-2 text-xs text-neutral-500">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${f.published ? "bg-emerald-50 text-emerald-700" : "bg-neutral-200 text-neutral-600"}`}>{f.published ? "Published" : "Draft"}</span>
                {dirty ? <span className="text-amber-600">● Unsaved changes</span> : id ? <span>All changes saved</span> : <span>Not saved yet</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/products" className="btn btn-outline !rounded-lg !py-2.5">Discard</Link>
            <button disabled={saving} className="btn btn-primary !rounded-lg !py-2.5">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {id ? "Save changes" : "Create product"}</button>
          </div>
        </div>
        <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Sections">
          {nav.map(([h, l]) => <a key={h} href={`#${h}`} className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-white hover:text-[#7A184E]">{l}</a>)}
        </nav>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Section id="basic" n={1} icon={FileText} title="Basic information" hint="What customers read first">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Product name" className="sm:col-span-2"><input required className="input !rounded-lg" placeholder="e.g. Kanchipuram Silk Saree" value={f.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
              <Field label="Category"><select required className="input !rounded-lg" value={f.category} onChange={(e) => set("category", e.target.value)}><option value="">Select category…</option>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field>
              <Field label="URL slug" hint={`Store link: /products/${f.slug || "your-slug"}`}><input className="input !rounded-lg" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
              <Field label="Description" className="sm:col-span-2" hint={`${f.description.length}/5000 characters`}><textarea rows={6} maxLength={5000} className="input !rounded-lg" placeholder="Describe the fabric, fit, occasion and what makes this piece special…" value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
            </div>
          </Section>

          <Section id="media" n={2} icon={ImageIcon} title="Product images" hint="First image is the main photo · JPEG, PNG or WebP · up to 5 MB each"
            actions={<span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">{f.images.length}/8</span>}>
            <ImageUploader images={f.images} onChange={(v) => set("images", v)} />
            {f.images.length === 0 && <p className="mt-3 text-xs text-amber-700">Products with photos convert far better. Add at least one image.</p>}
          </Section>

          <Section id="pricing" n={3} icon={IndianRupee} title="Pricing" hint="Prices are inclusive of taxes">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Regular price (₹)"><input required type="number" min={1} className="input !rounded-lg" value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
              <Field label="Sale price (₹)" hint="Leave empty for no discount"><input type="number" min={0} className="input !rounded-lg" value={f.salePrice} onChange={(e) => set("salePrice", e.target.value)} /></Field>
            </div>
            {f.salePrice && !onSale && <p className="mt-3 text-xs text-red-600">Sale price must be lower than the regular price.</p>}
            {onSale && <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><span className="font-semibold">{discountPct(price, sale)}% off</span><span>Customers save {inr(price - sale)}</span><span>They pay <b>{inr(sale)}</b></span></div>}
          </Section>

          <Section id="variants" n={4} icon={Layers} title="Sizes, colours & stock" hint="Stock is tracked per size and colour"
            actions={<button type="button" onClick={generate} className="btn btn-dark !rounded-lg !py-2.5 !text-[10px]"><Wand2 size={13} /> Generate variants</button>}>
            <div className="space-y-6">
              <div>
                <p className="label">Sizes</p>
                <div className="mb-2.5 flex flex-wrap gap-2">{f.sizes.map((s) => <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-[#120A1E] py-1 pl-3.5 pr-2 text-sm text-white">{s}<button type="button" aria-label={`Remove ${s}`} onClick={() => set("sizes", f.sizes.filter((x) => x !== s))} className="rounded-full p-0.5 hover:bg-white/20"><X size={13} /></button></span>)}</div>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_SIZES.filter((s) => !f.sizes.includes(s)).map((s) => <button key={s} type="button" onClick={() => addSize(s)} className="rounded-full border border-dashed border-neutral-300 px-3 py-1 text-xs text-neutral-600 transition hover:border-[#7A184E] hover:text-[#7A184E]">+ {s}</button>)}
                  <input className="input !w-32 !rounded-full !py-1.5" placeholder="Custom…" value={newSize} onChange={(e) => setNewSize(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(newSize); } }} />
                </div>
              </div>

              <div>
                <p className="label">Colours</p>
                <div className="mb-3 flex flex-wrap gap-2">{f.colors.map((c) => <span key={c.name} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 py-1 pl-1.5 pr-2 text-sm"><i className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />{c.name}<button type="button" aria-label={`Remove ${c.name}`} onClick={() => set("colors", f.colors.filter((x) => x.name !== c.name))} className="rounded-full p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"><X size={13} /></button></span>)}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-1.5">{SWATCHES.map((h) => <button key={h} type="button" aria-label={`Pick ${h}`} onClick={() => setNewColor({ ...newColor, hex: h })} className={`h-6 w-6 rounded-full ring-offset-1 transition ${newColor.hex.toLowerCase() === h.toLowerCase() ? "ring-2 ring-[#7A184E]" : "ring-1 ring-black/10"}`} style={{ background: h }} />)}</div>
                  <input type="color" aria-label="Custom colour" value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} className="h-9 w-10 cursor-pointer rounded-md border border-neutral-200" />
                  <input className="input !w-44 !rounded-lg" placeholder="Colour name" value={newColor.name} onChange={(e) => setNewColor({ ...newColor, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }} />
                  <button type="button" onClick={addColor} className="btn btn-outline !rounded-lg !py-2.5"><Plus size={14} /> Add colour</button>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between"><p className="label !mb-0">Stock matrix</p><span className="text-xs text-neutral-500">{f.variants.length} variants · <b className="text-[#120A1E]">{totalStock}</b> units total</span></div>
                {f.variants.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center"><Layers className="mx-auto text-neutral-400" size={28} strokeWidth={1.3} /><p className="mt-2 text-sm text-neutral-600">No variants yet</p><p className="text-xs text-neutral-500">Add sizes and colours above, then click “Generate variants”.</p></div>
                ) : (
                  <div className="space-y-4">
                    {colorGroups.map(({ c, rows }) => (
                      <div key={c.name} className="overflow-hidden rounded-xl border border-neutral-200">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-50 px-4 py-2.5">
                          <span className="flex items-center gap-2 text-sm font-medium"><i className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />{c.name}<span className="text-xs font-normal text-neutral-500">· {rows.reduce((s, v) => s + (Number(v.stock) || 0), 0)} units</span></span>
                          <label className="flex items-center gap-2 text-xs text-neutral-500">Set all sizes to <input type="number" min={0} className="input !w-20 !rounded-md !py-1" placeholder="qty" onChange={(e) => e.target.value !== "" && setColorStock(c.name, Number(e.target.value))} aria-label={`Set all ${c.name} stock`} /></label>
                        </div>
                        <div className="overflow-x-auto"><table className="w-full min-w-[460px] text-sm"><thead className="text-left text-[10px] uppercase tracking-wider text-neutral-400"><tr><th className="px-4 py-2 font-medium">Size</th><th className="px-2 py-2 font-medium">SKU</th><th className="px-2 py-2 font-medium">Stock</th><th className="w-10" /></tr></thead>
                          <tbody className="divide-y divide-neutral-100">{rows.map((v) => (
                            <tr key={v.sku + v.size}>
                              <td className="px-4 py-2 font-medium">{v.size}</td>
                              <td className="px-2 py-1.5"><input className="input !rounded-md !py-1.5 font-mono !text-xs" value={v.sku} onChange={(e) => setVariant(v.color, v.size, { sku: e.target.value.toUpperCase() })} aria-label={`SKU ${v.color} ${v.size}`} /></td>
                              <td className="px-2 py-1.5"><div className="flex items-center gap-2"><input type="number" min={0} className="input !w-24 !rounded-md !py-1.5" value={v.stock} onChange={(e) => setVariant(v.color, v.size, { stock: Number(e.target.value) })} aria-label={`Stock ${v.color} ${v.size}`} />{Number(v.stock) === 0 ? <span className="text-[10px] font-semibold uppercase text-red-600">Out</span> : Number(v.stock) <= 5 ? <span className="text-[10px] font-semibold uppercase text-amber-600">Low</span> : null}</div></td>
                              <td className="pr-3 text-right"><button type="button" aria-label="Remove variant" onClick={() => set("variants", f.variants.filter((x) => x !== v))} className="text-neutral-400 hover:text-red-600"><Trash2 size={15} /></button></td>
                            </tr>))}</tbody></table></div>
                      </div>
                    ))}
                    {orphan.length > 0 && <p className="text-xs text-amber-700">{orphan.length} variant(s) use a colour that was removed. Re-add the colour or delete them: {orphan.map((o) => o.sku).join(", ")}</p>}
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section id="details" n={5} icon={ListChecks} title="Fabric & specifications" hint="Shown in the product details accordion"
            actions={<button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-[#7A184E] hover:underline" onClick={() => set("specifications", [...f.specifications, { key: "", value: "" }])}><Plus size={13} /> Add row</button>}>
            <Field label="Fabric details"><input className="input !rounded-lg" placeholder="e.g. Pure Kanchipuram silk with gold zari" value={f.fabric} onChange={(e) => set("fabric", e.target.value)} /></Field>
            <div className="mt-5 space-y-2.5">
              {f.specifications.length === 0 ? <p className="rounded-lg bg-neutral-50 px-4 py-3 text-xs text-neutral-500">Add rows like <i>Care → Dry clean only</i> or <i>Origin → Made in India</i>.</p> : f.specifications.map((s, i) => (
                <div key={i} className="flex gap-2"><input className="input !rounded-lg" placeholder="Name (e.g. Care)" value={s.key} onChange={(e) => set("specifications", f.specifications.map((x, k) => (k === i ? { ...x, key: e.target.value } : x)))} />
                  <input className="input !rounded-lg" placeholder="Value" value={s.value} onChange={(e) => set("specifications", f.specifications.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
                  <button type="button" aria-label="Remove row" onClick={() => set("specifications", f.specifications.filter((_, k) => k !== i))} className="px-2 text-neutral-400 hover:text-red-600"><Trash2 size={15} /></button></div>
              ))}
            </div>
          </Section>
        </div>

        {/* sidebar */}
        <aside className="space-y-6 xl:sticky xl:top-40 xl:self-start">
          <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(18,10,30,0.04)]">
            <p className="border-b border-neutral-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Store preview</p>
            <div className="p-5">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-lg bg-lavender">
                {f.images[0] ? <SmartImage src={f.images[0]} alt="Preview" className="h-full w-full" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-400"><ImageIcon size={28} strokeWidth={1.2} /><span className="text-xs">No image yet</span></div>}
                {onSale && <span className="absolute left-2 top-2 rounded bg-[#7A184E] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">-{discountPct(price, sale)}%</span>}
                {totalStock === 0 && f.variants.length > 0 && <span className="absolute left-2 top-2 rounded bg-[#120A1E] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">Sold out</span>}
              </div>
              <div className="mt-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">{catName || "Category"}</p>
                <p className="mt-1 font-display text-xl leading-tight">{f.name.trim() || "Product name"}</p>
                <p className="mt-1.5 text-sm"><span className={`font-semibold ${onSale ? "text-[#7A184E]" : ""}`}>{price ? inr(onSale ? sale : price) : "₹0"}</span>{onSale && <span className="ml-2 text-xs text-neutral-400 line-through">{inr(price)}</span>}</p>
                {f.colors.length > 0 && <div className="mt-2 flex justify-center -space-x-1">{f.colors.slice(0, 5).map((c) => <i key={c.name} className="h-4 w-4 rounded-full border border-white ring-1 ring-neutral-200" style={{ background: c.hex }} />)}</div>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(18,10,30,0.04)]">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Visibility</p>
            <div className="space-y-4">
              {([["published", "Published", "Visible in the store"], ["featured", "Featured", "Homepage highlight"], ["bestseller", "Best seller", "Best Sellers section"], ["trending", "Trending", "Trending section"]] as const).map(([k, l, d]) => (
                <div key={k} className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-[#120A1E]">{l}</p><p className="text-xs text-neutral-500">{d}</p></div><Toggle label={l} checked={f[k]} onChange={(v) => set(k, v)} /></div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(18,10,30,0.04)]">
            <div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Listing quality</p><span className="text-sm font-semibold text-[#120A1E]">{pct}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-[#7A184E] to-[#D4AF37]"}`} style={{ width: `${pct}%` }} /></div>
            <ul className="mt-4 space-y-2">
              {checks.map((c) => <li key={c.t} className={`flex items-center gap-2.5 text-sm ${c.ok ? "text-neutral-700" : "text-neutral-400"}`}>{c.ok ? <Check size={15} className="text-emerald-600" /> : <CircleDashed size={15} />}{c.t}</li>)}
            </ul>
            {pct === 100 && <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><Sparkles size={14} /> Ready to publish</p>}
          </div>
        </aside>
      </div>
    </form>
  );
}
