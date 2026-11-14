"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, ShoppingBag, X, ZoomIn, Truck, Check, ShieldCheck, Gem, Sparkles, RotateCcw, Ruler, Star, Share2 } from "lucide-react";
import { SmartImage, Stars, WhatsAppIcon } from "@/components/common/ui";
import { useCart, useSettings, useToast, useWishlist } from "@/hooks/providers";
import { api, discountPct, effectivePrice, inr, whatsappLink, fmtDate } from "@/utils";
import { ProductGrid, type ProductLite } from "./ProductCard";

export type Product = Omit<ProductLite, "variants"> & {
  description: string;
  fabric: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  variants: { sku: string; size: string; color: string; stock: number }[];
  specifications: { key: string; value: string }[];
  ratingAvg: number;
  ratingCount: number;
};

/* ───────────────────────── Section heading ───────────────────────── */
export function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 text-center md:mb-12">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl text-ink md:text-5xl">{title}</h2>
      <span className="mx-auto mt-4 block h-px w-14 bg-gradient-to-r from-transparent via-[#C5A880] to-transparent" />
      {sub && <p className="mx-auto mt-4 max-w-md text-sm font-light text-neutral-500">{sub}</p>}
    </div>
  );
}

/* ───────────────────────── Gallery ───────────────────────── */
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const list = images.length ? images : [""];
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const touch = useRef<number | null>(null);
  const go = useCallback((d: number) => setI((c) => (c + d + list.length) % list.length), [list.length]);

  useEffect(() => {
    if (!lightbox) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", key); };
  }, [lightbox, go]);

  return (
    <div className="mx-auto grid w-full max-w-[420px] gap-3 md:max-w-[520px] md:grid-cols-[68px_1fr] md:gap-3.5 lg:sticky lg:top-28 lg:max-w-none lg:self-start">
      {/* thumbnails */}
      {list.length > 1 && (
        <div className="no-scrollbar order-2 flex gap-2.5 overflow-x-auto md:order-1 md:max-h-[560px] md:flex-col md:overflow-y-auto">
          {list.map((src, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`View image ${k + 1}`} aria-current={k === i}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg transition-all md:h-[5.25rem] md:w-full ${k === i ? "ring-2 ring-[#7A184E] ring-offset-2" : "opacity-60 hover:opacity-100"}`}>
              <SmartImage src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* main image */}
      <div className={`order-1 md:order-2 ${list.length > 1 ? "" : "md:col-span-2"}`}>
        <div
          className="group relative aspect-[4/5] max-h-[560px] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-[#F5F1EC] shadow-luxury"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLightbox(true)}
          onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touch.current === null) return;
            const dx = e.changedTouches[0].clientX - touch.current; touch.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="h-full w-full">
              <SmartImage src={list[i]} alt={`${name} — view ${i + 1}`} priority className="h-full w-full object-cover transition-transform duration-200"
                style={zoom ? { transform: "scale(2.2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
            </motion.div>
          </AnimatePresence>

          {list.length > 1 && (
            <>
              <button aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white md:opacity-0 md:group-hover:opacity-100"><ChevronLeft size={20} /></button>
              <button aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white md:opacity-0 md:group-hover:opacity-100"><ChevronRight size={20} /></button>
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 md:hidden">
                {list.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/55"}`} />)}
              </div>
            </>
          )}
          <span className="pointer-events-none absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm backdrop-blur md:flex"><ZoomIn size={13} /> Hover to zoom · Click to expand</span>
          {list.length > 1 && <span className="absolute left-4 top-4 rounded-full bg-[#120A1E]/70 px-3 py-1 text-[11px] font-medium tabular-nums tracking-wider text-white backdrop-blur">{i + 1} / {list.length}</span>}
        </div>
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`${name} images`}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#120A1E]/95 p-4 backdrop-blur-lg" onClick={() => setLightbox(false)}>
            <button aria-label="Close" className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-[#F4E7CB] hover:bg-white/20 hover:text-white"><X size={26} /></button>
            {list.length > 1 && (
              <>
                <button aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:left-8"><ChevronLeft size={26} /></button>
                <button aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:right-8"><ChevronRight size={26} /></button>
              </>
            )}
            <SmartImage src={list[i]} alt={name} className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain shadow-2xl" />
            <p className="absolute bottom-5 text-xs tracking-[0.2em] text-[#F4E7CB]/80">{i + 1} / {list.length}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Size guide ───────────────────────── */
const CHART: [string, string, string, string][] = [
  ["XS", "32", "26", "35"], ["S", "34", "28", "36"], ["M", "36", "30", "37"],
  ["L", "38", "32", "38"], ["XL", "40", "34", "39"], ["XXL", "42", "36", "40"],
];
function SizeGuide({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Size guide"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#120A1E]/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()}
        className="max-h-[90svh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between">
          <div><p className="eyebrow">Find your fit</p><h3 className="mt-1 font-display text-3xl text-ink">Size guide</h3></div>
          <button aria-label="Close" onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100"><X size={20} /></button>
        </div>
        <p className="mt-3 text-sm font-light text-neutral-500">Body measurements in inches. If you are between sizes, we suggest sizing up.</p>
        <div className="mt-5 overflow-hidden rounded-xl border border-[#EFE8DE]">
          <table className="w-full text-center text-sm">
            <thead className="bg-[#FBF8F3] text-[11px] uppercase tracking-wider text-[#8C6A32]"><tr><th className="py-3">Size</th><th>Bust</th><th>Waist</th><th>Hip</th></tr></thead>
            <tbody className="divide-y divide-[#F0EAE1]">{CHART.map((r) => <tr key={r[0]}><td className="py-3 font-semibold text-ink">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 flex gap-2 text-xs text-neutral-500"><Ruler size={14} className="mt-0.5 shrink-0 text-[#8C6A32]" /> Measure over light clothing, keeping the tape snug but not tight. Need help? Message us on WhatsApp.</p>
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── Purchase panel ───────────────────────── */
export function Purchase({ product }: { product: Product }) {
  const router = useRouter();
  const cart = useCart();
  const wish = useWishlist();
  const { toast } = useToast();
  const settings = useSettings();
  const colors = product.colors.length ? product.colors : [...new Set(product.variants.map((v) => v.color))].map((n) => ({ name: n, hex: "#999" }));
  const sizes = product.sizes.length ? product.sizes : [...new Set(product.variants.map((v) => v.size))];
  const [color, setColor] = useState(colors.find((c) => product.variants.some((v) => v.color === c.name && v.stock > 0))?.name ?? colors[0]?.name ?? "");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [guide, setGuide] = useState(false);
  const [tab, setTab] = useState<"story" | "details" | "shipping">("story");
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setPageUrl(window.location.href); }, []);

  // sticky mobile bar appears once the main buttons scroll out of view
  useEffect(() => {
    const el = ctaRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const variant = product.variants.find((v) => v.color === color && v.size === size);
  const stockFor = (sz: string) => product.variants.find((v) => v.color === color && v.size === sz)?.stock ?? 0;
  const price = effectivePrice(product);
  const pct = discountPct(product.price, product.salePrice);
  const anyStock = product.variants.some((v) => v.stock > 0);
  const maxQty = variant ? Math.min(variant.stock, 10) : 10;
  const catName = typeof product.category === "object" ? product.category.name : "";

  useEffect(() => { setQty((q) => Math.min(q, Math.max(1, maxQty))); }, [maxQty]);
  useEffect(() => { if (size && stockFor(size) === 0) setSize(""); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [color]);

  const validate = () => {
    if (!size) { toast("Please select a size", "err"); return null; }
    if (!variant || variant.stock < 1) { toast("This size/colour combination is currently reserved or out of stock", "err"); return null; }
    return variant;
  };
  const addToCart = () => {
    const v = validate(); if (!v) return false;
    cart.add({ productId: product._id, sku: v.sku, qty }, v.stock);
    return true;
  };
  const onAdd = () => {
    if (addToCart()) { setAdded(true); toast("Added to your shopping bag"); cart.setDrawerOpen(true); setTimeout(() => setAdded(false), 1800); }
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: product.name, url: pageUrl });
      else { await navigator.clipboard.writeText(pageUrl); toast("Link copied"); }
    } catch { /* cancelled */ }
  };
  const waText = `Hello ${settings.storeName}! I am interested in inquiring about "${product.name}"${size ? ` (Size: ${size}` : ""}${size && color ? `, Colour: ${color})` : size ? ")" : ""} — ${inr(price)}.\n${pageUrl}`;

  const TABS = [["story", "Description"], ["details", "Details"], ["shipping", "Delivery & returns"]] as const;

  return (
    <div>
      {/* heading */}
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow">{catName}</p>
        <div className="flex gap-2">
          <button onClick={share} aria-label="Share this product" className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:border-[#7A184E] hover:text-[#7A184E]"><Share2 size={16} /></button>
          <button onClick={() => wish.toggle(product._id)} aria-label="Toggle wishlist" aria-pressed={wish.has(product._id)} className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:border-[#7A184E]">
            <Heart size={17} className={wish.has(product._id) ? "fill-[#7A184E] text-[#7A184E]" : "text-neutral-600"} />
          </button>
        </div>
      </div>

      <h1 className="mt-2 font-display text-4xl font-medium leading-[1.08] tracking-tight text-ink md:text-5xl">{product.name}</h1>

      {product.ratingCount > 0 && (
        <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-[#7A184E]">
          <Stars value={product.ratingAvg} /> <span className="font-semibold text-ink">{product.ratingAvg.toFixed(1)}</span> · {product.ratingCount} review{product.ratingCount === 1 ? "" : "s"}
        </a>
      )}

      {/* price */}
      <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-4xl font-semibold tabular-nums text-ink md:text-5xl">{inr(price)}</span>
        {pct > 0 && (
          <>
            <span className="text-lg tabular-nums text-neutral-400 line-through">{inr(product.price)}</span>
            <span className="rounded-full bg-[#7A184E] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white">SAVE {pct}%</span>
          </>
        )}
      </div>
      <p className="mt-1.5 text-xs text-neutral-500">Inclusive of all taxes · Free delivery across India</p>

      <div className="my-7 h-px bg-gradient-to-r from-[#C5A880]/60 via-neutral-200 to-transparent" />

      {/* colour */}
      {colors.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Colour <span className="ml-1 font-medium normal-case tracking-normal text-ink">{color}</span></p>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((c) => {
              const out = !product.variants.some((v) => v.color === c.name && v.stock > 0);
              return (
                <button key={c.name} onClick={() => setColor(c.name)} aria-label={c.name} aria-pressed={color === c.name} title={out ? `${c.name} — reserved` : c.name}
                  className={`relative h-10 w-10 rounded-full transition-all ${color === c.name ? "ring-2 ring-[#7A184E] ring-offset-[3px]" : "ring-1 ring-neutral-300 hover:ring-neutral-500"} ${out ? "opacity-40" : ""}`}
                  style={{ background: c.hex }}>
                  {out && <span className="absolute inset-0 flex items-center justify-center"><span className="h-px w-full rotate-45 bg-neutral-700" /></span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* size */}
      <div className="mt-7">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Size {size && <span className="ml-1 font-medium normal-case tracking-normal text-ink">{size}</span>}</p>
          <button type="button" onClick={() => setGuide(true)} className="flex items-center gap-1.5 text-xs font-medium text-[#7A184E] hover:underline"><Ruler size={13} /> Size guide</button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-5">
          {sizes.map((sz) => {
            const st = stockFor(sz);
            return (
              <button key={sz} disabled={st === 0} onClick={() => setSize(sz)} aria-pressed={size === sz}
                className={`relative rounded-xl border py-3 text-sm font-medium transition ${size === sz ? "border-[#7A184E] bg-[#7A184E] text-white shadow-md" : st === 0 ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-300 line-through" : "border-neutral-300 bg-white text-ink hover:border-[#7A184E] hover:text-[#7A184E]"}`}>
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* stock */}
      <div className="mt-5 min-h-6 text-sm" aria-live="polite">
        {!anyStock ? (
          <span className="font-medium text-[#A82424]">Currently out of stock</span>
        ) : variant ? (
          variant.stock <= 5 ? (
            <span className="flex items-center gap-1.5 font-medium text-amber-700"><Sparkles size={14} /> Only {variant.stock} left — order soon</span>
          ) : (
            <span className="flex items-center gap-1.5 font-medium text-emerald-800"><Check size={15} /> In stock — ready to ship</span>
          )
        ) : (
          <span className="font-light text-neutral-500">Select a size to check availability</span>
        )}
      </div>

      {/* quantity + CTAs */}
      <div ref={ctaRef} className="mt-5 space-y-3">
        <div className="flex gap-3">
          <div className="flex shrink-0 items-center rounded-full border border-neutral-300 bg-white">
            <button aria-label="Decrease quantity" className="p-3.5 text-neutral-600 hover:text-ink" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={14} /></button>
            <span className="w-8 text-center text-sm font-semibold text-ink" aria-live="polite">{qty}</span>
            <button aria-label="Increase quantity" className="p-3.5 text-neutral-600 hover:text-ink disabled:opacity-40" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}><Plus size={14} /></button>
          </div>
          <button disabled={!anyStock} className="btn btn-primary flex-1" onClick={onAdd}>
            {added ? <><Check size={16} /> Added</> : <><ShoppingBag size={16} /> Add to Bag</>}
          </button>
        </div>
        <button disabled={!anyStock} className="btn btn-gold w-full" onClick={() => { if (addToCart()) router.push("/checkout"); }}>Buy it now</button>
        <a href={whatsappLink(settings.whatsappNumber, waText)} target="_blank" rel="noopener noreferrer"
          className="btn w-full border border-[#25D366]/60 bg-[#25D366]/5 text-[#128C4A] transition hover:bg-[#25D366] hover:text-white">
          <WhatsAppIcon /> Enquire on WhatsApp
        </a>
      </div>

      {/* trust row */}
      <ul className="mt-7 grid grid-cols-3 gap-2 text-center">
        {([[Truck, "Free delivery", "Pan-India"], [RotateCcw, "Easy returns", "7-day policy"], [ShieldCheck, "Secure pay", "UPI · Cards · COD"]] as const).map(([Icon, t, d]) => (
          <li key={t} className="rounded-2xl border border-[#EFE8DE] bg-[#FDFBF8] px-2 py-3.5">
            <Icon size={20} strokeWidth={1.5} className="mx-auto text-[#8C6A32]" />
            <p className="mt-2 text-xs font-semibold text-ink">{t}</p>
            <p className="text-[10px] text-neutral-500">{d}</p>
          </li>
        ))}
      </ul>

      {/* tabs */}
      <div className="mt-9">
        <div role="tablist" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-neutral-200">
          {TABS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`relative shrink-0 pb-3 text-sm font-medium transition ${tab === k ? "text-[#7A184E]" : "text-neutral-500 hover:text-ink"}`}>
              {l}
              {tab === k && <motion.span layoutId="pd-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-[#7A184E]" />}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="pt-5 text-sm leading-relaxed text-neutral-600">
          {tab === "story" && (
            <div className="space-y-4">
              <p className="whitespace-pre-line text-[15px]">{product.description}</p>
              {product.fabric && <p className="flex gap-2.5 rounded-xl bg-[#FBF8F3] p-4 text-[13px]"><Gem size={16} className="mt-0.5 shrink-0 text-[#8C6A32]" /><span><b className="font-semibold text-ink">Fabric &amp; care — </b>{product.fabric}</span></p>}
            </div>
          )}
          {tab === "details" && (
            product.specifications.length > 0 || product.fabric ? (
              <dl className="divide-y divide-[#F0EAE1] overflow-hidden rounded-xl border border-[#EFE8DE]">
                {product.fabric && <div className="grid grid-cols-[120px_1fr] gap-3 px-4 py-3"><dt className="font-medium text-neutral-500">Fabric</dt><dd className="text-ink">{product.fabric}</dd></div>}
                {product.specifications.map((s) => (
                  <div key={s.key} className="grid grid-cols-[120px_1fr] gap-3 px-4 py-3"><dt className="font-medium text-neutral-500">{s.key}</dt><dd className="text-ink">{s.value}</dd></div>
                ))}
              </dl>
            ) : <p>Detailed specifications are not available for this product.</p>
          )}
          {tab === "shipping" && (
            <ul className="space-y-3">
              {[[Truck, "Free insured delivery", "Dispatched in 1–3 business days, delivered in 3–7 days across India."], [RotateCcw, "7-day easy returns", "Unworn items with tags can be returned or exchanged within 7 days."], [ShieldCheck, "Secure payments", "UPI, cards, net banking and Cash on Delivery."]].map(([Icon, t, d]) => {
                const I = Icon as typeof Truck;
                return <li key={t as string} className="flex gap-3"><I size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[#8C6A32]" /><div><p className="font-medium text-ink">{t as string}</p><p className="text-xs text-neutral-500">{d as string}</p></div></li>;
              })}
            </ul>
          )}
        </div>
      </div>

      <AnimatePresence>{guide && <SizeGuide onClose={() => setGuide(false)} />}</AnimatePresence>

      {/* sticky mobile buy bar */}
      <AnimatePresence>
        {showBar && anyStock && (
          <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-[#EFE8DE] bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(18,10,30,0.08)] backdrop-blur lg:hidden"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-neutral-500">{product.name}</p>
              <p className="font-semibold tabular-nums text-ink">{inr(price)}{size && <span className="ml-2 text-xs font-normal text-neutral-500">Size {size}</span>}</p>
            </div>
            <button className="btn btn-primary !px-6 !py-3" onClick={onAdd}>{added ? <><Check size={16} /> Added</> : <><ShoppingBag size={16} /> Add to Bag</>}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Reviews ───────────────────────── */
type Rev = { name: string; rating: number; comment?: string; createdAt: string };
export function Reviews({ productId }: { productId: string }) {
  const [items, setItems] = useState<Rev[] | null>(null);
  const load = () => api<{ items: Rev[] }>(`/api/reviews?product=${productId}`).then((r) => setItems(r.items)).catch(() => setItems([]));
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [productId]);

  const stats = useMemo(() => {
    const list = items ?? [];
    const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: list.filter((r) => Math.round(r.rating) === n).length }));
    const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
    return { dist, avg, total: list.length };
  }, [items]);

  return (
    <section id="reviews" className="mt-20 scroll-mt-28 border-t border-[#EFE8DE] pt-16 md:mt-24">
      <SectionHead eyebrow="Testimonials" title="Customer reviews" />
      <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:gap-12">
        {/* summary */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#EFE8DE] bg-[#FDFBF8] p-6">
            {stats.total === 0 ? (
              <p className="py-4 text-center font-display text-xl text-ink">Be the first to review</p>
            ) : (
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="font-display text-6xl leading-none text-ink">{stats.avg.toFixed(1)}</p>
                  <div className="mt-2 flex justify-center"><Stars value={stats.avg} /></div>
                  <p className="mt-1 text-[11px] text-neutral-500">{stats.total} review{stats.total === 1 ? "" : "s"}</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {stats.dist.map((d) => (
                    <div key={d.n} className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span className="flex w-4 items-center gap-0.5">{d.n}<Star size={9} className="fill-[#D4AF37] text-[#D4AF37]" /></span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFE8DE]"><span className="block h-full rounded-full bg-[#D4AF37]" style={{ width: `${stats.total ? (d.c / stats.total) * 100 : 0}%` }} /></span>
                      <span className="w-4 text-right tabular-nums">{d.c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-6">
            <h3 className="font-display text-2xl text-ink">Share your experience</h3>
            <p className="mt-2 text-xs font-light leading-relaxed text-neutral-500">Reviews can be written by customers whose order has been delivered. Open <Link href="/account/orders" className="font-medium text-[#7A184E] underline-offset-2 hover:underline">My orders</Link> and choose “Write a review”.</p>
          </div>
        </div>

        {/* list */}
        <div>
          {items === null ? (
            <p className="text-sm font-light text-neutral-500">Loading reviews…</p>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#C5A880]/50 bg-white p-12 text-center">
              <Star size={28} className="mx-auto text-[#C5A880]" />
              <p className="mt-3 font-display text-2xl text-ink">No reviews yet</p>
              <p className="mt-1 text-xs font-light text-neutral-500">Customers who received this item can leave a review.</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((r, i) => (
                <li key={i} className="flex flex-col rounded-3xl border border-[#EFE8DE] bg-white p-6">
                  <Stars value={r.rating} />
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-700">{r.comment || "Loved it."}</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-[#F0EAE1] pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A184E] text-sm font-semibold text-white">{(r.name || "?").charAt(0).toUpperCase()}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-neutral-500"><Check size={11} className="text-emerald-600" /> Verified buyer · {fmtDate(r.createdAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Recently viewed ───────────────────────── */
const RV_KEY = "sky_recent_v1";
export function RecentlyViewed({ currentId }: { currentId: string }) {
  const [items, setItems] = useState<ProductLite[]>([]);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    let ids: string[] = [];
    try { ids = JSON.parse(localStorage.getItem(RV_KEY) || "[]"); } catch {}
    const others = ids.filter((i) => i !== currentId).slice(0, 4);
    try { localStorage.setItem(RV_KEY, JSON.stringify([currentId, ...others].slice(0, 12))); } catch {}
    if (others.length) api<{ items: ProductLite[] }>(`/api/products?ids=${others.join(",")}`).then((r) => setItems(r.items)).catch(() => {});
  }, [currentId]);
  if (!items.length) return null;
  return (
    <section className="mt-20 border-t border-[#EFE8DE] pt-16 md:mt-24">
      <SectionHead eyebrow="Your journey" title="Recently viewed" />
      <ProductGrid items={items} />
    </section>
  );
}
