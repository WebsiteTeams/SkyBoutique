"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Search, Sparkles } from "lucide-react";
import { api, inr } from "@/utils";
import { ProductGrid, type ProductLite } from "./ProductCard";
import { EmptyState, ErrorState, PageHero, Pagination, ProductGridSkeleton } from "@/components/common/ui";

type Opts = { sizes: string[]; colors: { name: string; hex: string }[]; maxPrice: number };
type Cat = { name: string; slug: string };
type Result = { items: ProductLite[]; total: number; page: number; pages: number };

const SORTS = [
  ["newest", "Newest Arrivals"], 
  ["popularity", "Most Desired (Popularity)"], 
  ["price-asc", "Price: Low to High"], 
  ["price-desc", "Price: High to Low"]
];

export function ShopClient({ categories, options }: { categories: Cat[]; options: Opts }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [min, setMin] = useState(sp.get("minPrice") ?? "");
  const [max, setMax] = useState(sp.get("maxPrice") ?? "");
  const seq = useRef(0);

  const qs = sp.toString();
  const set = useCallback((patch: Record<string, string | null>, resetPage = true) => {
    const n = new URLSearchParams(qs);
    for (const [k, v] of Object.entries(patch)) (v ? n.set(k, v) : n.delete(k));
    if (resetPage) n.delete("page");
    router.push(`${path}?${n.toString()}`, { scroll: false });
  }, [qs, path, router]);

  useEffect(() => { setQ(sp.get("q") ?? ""); setMin(sp.get("minPrice") ?? ""); setMax(sp.get("maxPrice") ?? ""); }, [sp]);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true); 
    setError("");
    try {
      const r = await api<Result>(`/api/products?${qs}&limit=12`);
      if (mine === seq.current) setData(r);
    } catch (e) { if (mine === seq.current) setError((e as Error).message); }
    if (mine === seq.current) setLoading(false);
  }, [qs]);
  useEffect(() => { load(); }, [load]);

  const category = sp.get("category") ?? "";
  const activeCat = categories.find((c) => c.slug === category);
  const flagTitle = { bestseller: "Best Sellers", trending: "Trending Edit", featured: "Atelier Featured" }[sp.get("flag") ?? ""] ;
  const title = sp.get("q") ? `Results for “${sp.get("q")}”` : activeCat?.name ?? flagTitle ?? "All Collections";
  const activeFilters = useMemo(() => ["size", "color", "availability", "minPrice", "maxPrice", "flag", "q"].filter((k) => sp.get(k)), [sp]);

  const Filters = (
    <div className="divide-y divide-[#EFE8DE] [&>div]:py-6 [&>div:first-child]:pt-0">
      <div>
        <h3 className="label !text-[#8C6A32]">Category</h3>
        <ul className="space-y-2 text-sm font-light">
          <li>
            <button onClick={() => set({ category: null })} className={`transition ${!category ? "font-semibold text-[#7A184E]" : "text-neutral-600 hover:text-[#7A184E]"}`}>
              All Collections
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button onClick={() => set({ category: c.slug })} className={`transition ${category === c.slug ? "font-semibold text-[#7A184E]" : "text-neutral-600 hover:text-[#7A184E]"}`}>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="label !text-[#8C6A32]">Price Range (₹)</h3>
        <form onSubmit={(e) => { e.preventDefault(); set({ minPrice: min || null, maxPrice: max || null }); }} className="flex items-center gap-2">
          <input className="input !bg-white !py-1.5 text-xs" inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} aria-label="Minimum price" />
          <span className="text-neutral-400">–</span>
          <input className="input !bg-white !py-1.5 text-xs" inputMode="numeric" placeholder={String(options.maxPrice)} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} aria-label="Maximum price" />
          <button className="btn btn-dark !px-3 !py-1.5 text-xs">Apply</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {[[0, 2000], [2000, 5000], [5000, 15000], [15000, 0]].map(([a, b]) => (
            <button key={a} onClick={() => set({ minPrice: a ? String(a) : null, maxPrice: b ? String(b) : null })} 
              className="border border-[#C5A880]/30 px-2 py-0.5 text-neutral-600 hover:border-[#7A184E] hover:text-[#7A184E] bg-white">
              {b ? `${inr(a)}–${inr(b)}` : `${inr(a)}+`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="label !text-[#8C6A32]">Atelier Size</h3>
        <div className="flex flex-wrap gap-2">
          {options.sizes.map((s) => (
            <button key={s} onClick={() => set({ size: sp.get("size") === s ? null : s })} aria-pressed={sp.get("size") === s} 
              className={`border px-3 py-1.5 text-xs transition ${sp.get("size") === s ? "border-[#120A1E] bg-[#120A1E] text-[#F4E7CB]" : "border-[#C5A880]/30 hover:border-[#7A184E] bg-white"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="label !text-[#8C6A32]">Color Palette</h3>
        <div className="flex flex-wrap gap-2.5">
          {options.colors.map((c) => (
            <button key={c.name} title={c.name} aria-label={c.name} aria-pressed={sp.get("color") === c.name} onClick={() => set({ color: sp.get("color") === c.name ? null : c.name })}
              className={`h-7 w-7 rounded-full transition-all ${sp.get("color") === c.name ? "ring-2 ring-[#C5A880] ring-offset-2 scale-110 shadow-sm" : "ring-1 ring-neutral-300 hover:ring-[#C5A880]"}`} 
              style={{ background: c.hex }} 
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="label !text-[#8C6A32]">Availability</h3>
        <div className="space-y-2 text-sm font-light">
          {[["", "All Creations"], ["in-stock", "In Stock (Ready for Dispatch)"], ["out-of-stock", "Archive / Reserved"]].map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="avail" className="accent-[#7A184E]" checked={(sp.get("availability") ?? "") === v} onChange={() => set({ availability: v || null })} /> 
              {l}
            </label>
          ))}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <button onClick={() => router.push(category ? `${path}?category=${category}` : path)} className="text-xs uppercase tracking-widest text-[#7A184E] underline pt-2">
          Reset all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <PageHero eyebrow={activeCat ? "The Atelier Curation" : "Curated Fashion House"} title={title} sub={(activeCat as Cat & { description?: string })?.description || "Heirloom craftsmanship, pure silks, and refined silhouettes."} />
      
      <div className="container-x py-10 md:py-16">
        <div className="mb-10 flex flex-wrap items-center gap-4 border-b border-[#EFE8DE] pb-6">
          <form onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() || null }); }} className="relative min-w-0 flex-1 md:max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input !bg-white !pl-10 !py-2.5" placeholder="Search sarees, kurtis, gowns…" aria-label="Search products" />
          </form>

          <button onClick={() => setFiltersOpen(true)} className="btn btn-outline-gold !px-4 !py-2.5 text-xs lg:hidden">
            <SlidersHorizontal size={15} /> Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
          </button>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-xs uppercase tracking-[0.2em] text-[#8C6A32] font-semibold sm:inline">
              {data ? `${data.total} creations` : ""}
            </span>
            <select aria-label="Sort by" value={sp.get("sort") ?? "newest"} onChange={(e) => set({ sort: e.target.value === "newest" ? null : e.target.value })} 
              className="input !w-auto !py-2 !bg-white text-xs font-medium uppercase tracking-wider border-[#C5A880]/40">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-6 border-r border-[#EFE8DE]">
              {Filters}
            </div>
          </aside>

          <div>
            {error ? (
              <ErrorState message={error} retry={load} />
            ) : loading && !data ? (
              <ProductGridSkeleton />
            ) : data && data.items.length === 0 ? (
              <EmptyState 
                title="No creations matched your criteria" 
                text="Please adjust your selected filters or try a broader search phrase." 
                action={<button onClick={() => router.push(path)} className="btn btn-primary">Reset Filter Choices</button>} 
              />
            ) : data && (
              <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                <ProductGrid items={data.items} />
                <Pagination page={data.page} pages={data.pages} onChange={(p) => { set({ page: String(p) }, false); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              </div>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <div className="absolute inset-0 bg-[#120A1E]/60 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm overflow-y-auto bg-[#FCFAF7] border-r border-[#C5A880]/30 p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between border-b border-[#EFE8DE] pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#D4AF37]" />
                  <h2 className="font-display text-2xl text-ink">Refine Atelier Pieces</h2>
                </div>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={20} /></button>
              </div>
              {Filters}
              <button onClick={() => setFiltersOpen(false)} className="btn btn-gold mt-8 w-full">Apply Filters</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
