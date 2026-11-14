"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, LayoutGrid, List, Package, Pencil, Plus, Sparkles, Star, Trash2, TrendingUp } from "lucide-react";
import { api, discountPct, inr } from "@/utils";
import { useToast } from "@/hooks/providers";
import { Badge, PageHeader, SearchBox, Stat, Table, Toggle, useList } from "./kit";
import { EmptyState, SmartImage } from "@/components/common/ui";

type P = {
  _id: string; name: string; slug: string; images: string[]; price: number; salePrice?: number; category?: { name: string };
  variants: { sku: string; stock: number }[]; featured: boolean; bestseller: boolean; trending: boolean; published: boolean; soldCount?: number; createdAt: string;
};
type Stats = { total: number; published: number; draft: number; featured: number; out: number };
type Cat = { _id: string; name: string };

const STATUS = [["", "All"], ["published", "Published"], ["draft", "Drafts"], ["out", "Out of stock"], ["featured", "Featured"]] as const;
const SORTS = [["newest", "Newest first"], ["oldest", "Oldest first"], ["name-asc", "Name A–Z"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["popular", "Best selling"]] as const;
const stockOf = (p: P) => p.variants.reduce((s, v) => s + v.stock, 0);

function StockChip({ p }: { p: P }) {
  const t = stockOf(p);
  if (t === 0) return <Badge tone="red">Out of stock</Badge>;
  if (t <= 10) return <Badge tone="amber">{t} left</Badge>;
  return <span className="text-xs text-neutral-500">{t} in stock</span>;
}

function PriceBlock({ p, big }: { p: P; big?: boolean }) {
  const sale = p.salePrice && p.salePrice < p.price;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`${big ? "text-base" : "text-sm"} font-semibold text-[#120A1E]`}>{inr(sale ? p.salePrice! : p.price)}</span>
      {sale && <><span className="text-xs text-neutral-400 line-through">{inr(p.price)}</span><span className="text-[10px] font-semibold text-emerald-700">{discountPct(p.price, p.salePrice)}% off</span></>}
    </div>
  );
}

export function ProductsAdmin() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [cats, setCats] = useState<Cat[]>([]);
  const limit = view === "grid" ? 12 : 10;

  useEffect(() => {
    try { const v = localStorage.getItem("sky_admin_products_view"); if (v === "list" || v === "grid") setView(v); } catch {}
    api<{ items: Cat[] }>("/api/admin/categories?limit=100").then((r) => setCats(r.items)).catch(() => {});
  }, []);
  const changeView = (v: "grid" | "list") => { setView(v); setPage(1); try { localStorage.setItem("sky_admin_products_view", v); } catch {} };

  const { data, loading, error, reload } = useList<P>("/api/admin/products", { q, status, category, sort, page, limit });
  const stats = (data as unknown as { stats?: Stats } | null)?.stats;
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  const patch = async (p: P, change: Partial<P>, msg?: string) => {
    try {
      const full = await api<{ item: Record<string, unknown> }>(`/api/admin/products/${p._id}`);
      await api(`/api/admin/products/${p._id}`, { method: "PUT", json: { ...full.item, category: full.item.category as string, ...change } });
      if (msg) toast(msg);
      reload();
    } catch (e) { toast((e as Error).message, "err"); }
  };
  const del = async (p: P) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try { await api(`/api/admin/products/${p._id}`, { method: "DELETE" }); toast("Product deleted"); reload(); } catch (e) { toast((e as Error).message, "err"); }
  };

  const filtered = !!(q || status || category);

  return (
    <div>
      <PageHeader title="Products" sub="Manage your catalogue, pricing, stock and visibility."
        actions={<Link href="/admin/products/new" className="btn btn-primary !rounded-lg !py-3"><Plus size={15} /> Add product</Link>} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
        <Stat label="Total products" value={stats?.total ?? "–"} icon={Package} sub="In your catalogue" />
        <Stat label="Published" value={stats?.published ?? "–"} icon={CheckCircle2} sub={stats ? `${stats.draft} draft${stats.draft === 1 ? "" : "s"} hidden from store` : undefined} />
        <Stat label="Featured" value={stats?.featured ?? "–"} icon={Sparkles} sub="Shown on the homepage" />
        <Stat label="Out of stock" value={stats?.out ?? "–"} icon={AlertTriangle} tone={stats?.out ? "warn" : undefined} sub="Needs restocking" />
      </div>

      {/* toolbar */}
      <div className="mb-5 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(18,10,30,0.04)] sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={resetPage(setQ)} placeholder="Search name or SKU" />
          <select aria-label="Category" className="input !w-auto !rounded-lg !py-2.5" value={category} onChange={(e) => resetPage(setCategory)(e.target.value)}>
            <option value="">All categories</option>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select aria-label="Sort" className="input !w-auto !rounded-lg !py-2.5" value={sort} onChange={(e) => resetPage(setSort)(e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="ml-auto flex overflow-hidden rounded-lg border border-neutral-200" role="group" aria-label="View">
            {([["grid", LayoutGrid], ["list", List]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => changeView(v)} aria-pressed={view === v} aria-label={`${v} view`} className={`px-3 py-2.5 transition ${view === v ? "bg-[#120A1E] text-white" : "text-neutral-500 hover:bg-neutral-50"}`}><Icon size={16} /></button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS.map(([v, l]) => (
            <button key={v} onClick={() => resetPage(setStatus)(v)} aria-pressed={status === v}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${status === v ? "border-[#7A184E] bg-[#7A184E] text-white" : "border-neutral-200 text-neutral-600 hover:border-[#7A184E]/40 hover:text-[#7A184E]"}`}>{l}</button>
          ))}
          {filtered && <button onClick={() => { setQ(""); setStatus(""); setCategory(""); setPage(1); }} className="ml-auto text-xs text-[#7A184E] underline">Clear filters</button>}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border bg-white p-10 text-center text-sm text-red-700">{error} <button onClick={reload} className="ml-2 underline">Retry</button></div>
      ) : view === "list" ? (
        <Table<P> scrollable rows={data?.items} loading={loading} error="" retry={reload} page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} empty={filtered ? "No products match your filters." : "No products yet. Add your first one."}
          cols={[
            { h: "Product", cell: (p) => <div className="flex items-center gap-3"><div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-lavender"><SmartImage src={p.images[0]} alt="" className="h-full w-full" /></div><div className="min-w-0"><p className="truncate font-medium text-[#120A1E]">{p.name}</p><p className="text-xs text-neutral-500">{p.category?.name} · {p.variants.length} variants</p></div></div> },
            { h: "Price", cell: (p) => <PriceBlock p={p} /> },
            { h: "Stock", cell: (p) => <StockChip p={p} /> },
            { h: "Sold", cell: (p) => <span className="tabular-nums text-neutral-600">{p.soldCount ?? 0}</span> },
            { h: "Featured", cell: (p) => <Toggle label="Featured" checked={p.featured} onChange={(v) => patch(p, { featured: v })} /> },
            { h: "Published", cell: (p) => <Toggle label="Published" checked={p.published} onChange={(v) => patch(p, { published: v }, v ? "Product published" : "Product hidden from store")} /> },
            { h: "", className: "text-right", cell: (p) => <div className="flex justify-end gap-1"><Link href={`/admin/products/${p._id}`} aria-label={`Edit ${p.name}`} className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-[#120A1E]"><Pencil size={16} /></Link><button onClick={() => del(p)} aria-label={`Delete ${p.name}`} className="rounded-md p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></div> },
          ]} />
      ) : (
        <>
          {loading && !data ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded-xl" />)}</div>
          ) : data && data.items.length === 0 ? (
            <div className="rounded-xl border bg-white"><EmptyState title={filtered ? "No products match your filters" : "Your catalogue is empty"} text={filtered ? "Try a different search or clear the filters." : "Add your first product to see it here and in your store."}
              action={filtered ? <button onClick={() => { setQ(""); setStatus(""); setCategory(""); }} className="btn btn-outline">Clear filters</button> : <Link href="/admin/products/new" className="btn btn-primary">Add product</Link>} /></div>
          ) : (
            <div className={`grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
              {data?.items.map((p) => (
                <article key={p._id} className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(18,10,30,0.04)] transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="relative aspect-[4/5] overflow-hidden bg-lavender">
                    <Link href={`/admin/products/${p._id}`} aria-label={`Edit ${p.name}`}><SmartImage src={p.images[0]} alt={p.name} className={`h-full w-full transition duration-500 group-hover:scale-105 ${p.published ? "" : "opacity-50 grayscale"}`} /></Link>
                    <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
                      {!p.published && <span className="flex items-center gap-1 rounded-full bg-[#120A1E]/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"><EyeOff size={11} /> Draft</span>}
                      {p.featured && <span className="flex items-center gap-1 rounded-full bg-[#D4AF37] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#120A1E]"><Star size={11} /> Featured</span>}
                      {p.bestseller && <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#7A184E]"><TrendingUp size={11} /> Bestseller</span>}
                    </div>
                    <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                      <Link href={`/admin/products/${p._id}`} aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#120A1E] shadow hover:bg-[#120A1E] hover:text-white"><Pencil size={14} /></Link>
                      <button onClick={() => del(p)} aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-600 shadow hover:bg-red-600 hover:text-white"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C6A32]">{p.category?.name}</p>
                    <Link href={`/admin/products/${p._id}`} className="mt-1 line-clamp-1 font-medium text-[#120A1E] hover:text-[#7A184E]">{p.name}</Link>
                    <div className="mt-1.5"><PriceBlock p={p} big /></div>
                    <div className="mt-2 flex items-center justify-between"><StockChip p={p} /><span className="text-[11px] text-neutral-400">{p.soldCount ?? 0} sold</span></div>
                    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                      <span className="flex items-center gap-1.5 text-xs text-neutral-500">{p.published ? <Eye size={13} className="text-emerald-600" /> : <EyeOff size={13} />}{p.published ? "Live" : "Hidden"}</span>
                      <Toggle label={p.published ? "Unpublish" : "Publish"} checked={p.published} onChange={(v) => patch(p, { published: v }, v ? "Product published" : "Product hidden from store")} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {data && data.pages > 0 && data.total > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-neutral-500">Showing <b className="font-medium text-neutral-700">{(data.page - 1) * limit + 1}–{Math.min(data.page * limit, data.total)}</b> of <b className="font-medium text-neutral-700">{data.total}</b></p>
              {data.pages > 1 && (
                <nav className="flex items-center gap-1" aria-label="Pagination">
                  <button className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous"><ChevronLeft size={14} /></button>
                  <span className="px-3 text-xs text-neutral-600">Page {data.page} of {data.pages}</span>
                  <button className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40" disabled={page >= data.pages} onClick={() => setPage(page + 1)} aria-label="Next"><ChevronRight size={14} /></button>
                </nav>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
