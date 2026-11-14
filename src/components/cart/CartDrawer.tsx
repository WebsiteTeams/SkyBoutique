"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Trash2, Sparkles, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/providers";
import { useCartPricing } from "@/hooks/useCartPricing";
import { SmartImage, Skeleton } from "@/components/common/ui";
import { inr } from "@/utils";
import { useEffect } from "react";

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, items, setQty, remove } = useCart();
  const { data, loading } = useCartPricing(undefined, drawerOpen);
  useEffect(() => { document.body.style.overflow = drawerOpen ? "hidden" : ""; }, [drawerOpen]);

  const freeShippingThreshold = 2500;
  const subtotal = data?.subtotal ?? 0;
  const progress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const diff = freeShippingThreshold - subtotal;

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} 
            className="fixed inset-0 z-[60] bg-[#120A1E]/60 backdrop-blur-sm" />
          <motion.aside role="dialog" aria-label="Atelier Shopping Bag" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col bg-[#FCFAF7] border-l border-[#C5A880]/30 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EFE8DE] px-6 py-5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#D4AF37]" />
                <h2 className="font-display text-2xl text-ink">Your Atelier Bag</h2>
              </div>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close cart" className="text-neutral-500 hover:text-ink"><X size={22} /></button>
            </div>

            {/* Free Shipping Progress Indicator */}
            {items.length > 0 && (
              <div className="bg-[#FAF7F2] border-b border-[#EFE8DE] px-6 py-3 text-xs">
                {diff > 0 ? (
                  <p className="text-neutral-600 font-light">
                    Add <span className="font-semibold text-[#7A184E]">{inr(diff)}</span> more for <span className="font-semibold text-ink">Complimentary White-Glove Shipping</span>
                  </p>
                ) : (
                  <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#D4AF37]" /> Qualified for Complimentary White-Glove Dispatch
                  </p>
                )}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E5DFD7]">
                  <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#7A184E] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF7F2] border border-[#C5A880]/30 text-[#7A184E] mb-2">
                  <ShoppingBag size={32} strokeWidth={1.3} />
                </div>
                <p className="font-display text-2xl text-ink">Your bag is currently empty</p>
                <p className="text-xs text-neutral-500 font-light max-w-xs">Explore our latest arrivals of handwoven silks and bridal couture.</p>
                <Link href="/shop" onClick={() => setDrawerOpen(false)} className="btn btn-gold mt-4">
                  Discover Collections
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-6 overflow-y-auto p-6 divide-y divide-[#EFE8DE]">
                  {loading && !data ? Array.from({ length: items.length }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />) :
                    data?.items.map((l) => (
                      <div key={l.sku} className="flex gap-4 pt-4 first:pt-0">
                        <Link href={`/products/${l.slug}`} onClick={() => setDrawerOpen(false)} className="h-28 w-22 shrink-0 overflow-hidden bg-[#FAF7F2] border border-[#C5A880]/30">
                          <SmartImage src={l.image} alt={l.name} className="h-full w-full object-cover" />
                        </Link>
                        <div className="flex-1 text-sm flex flex-col justify-between">
                          <div>
                            <Link href={`/products/${l.slug}`} onClick={() => setDrawerOpen(false)} className="font-medium text-ink hover:text-[#7A184E] transition leading-snug line-clamp-1">
                              {l.name}
                            </Link>
                            <p className="text-xs text-neutral-500 mt-0.5 font-light">Size: {l.size} · Color: {l.color}</p>
                            {l.issue && <p className="mt-1 text-xs text-red-600 font-medium">{l.issue}</p>}
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center border border-[#C5A880]/40 bg-white">
                              <button aria-label="Decrease" className="p-1.5 text-neutral-600 hover:text-ink" onClick={() => setQty(l.sku, l.qty - 1)}><Minus size={13} /></button>
                              <span className="w-8 text-center text-xs font-semibold">{l.qty}</span>
                              <button aria-label="Increase" className="p-1.5 text-neutral-600 hover:text-ink" onClick={() => setQty(l.sku, l.qty + 1)} disabled={l.qty >= l.stock}><Plus size={13} /></button>
                            </div>
                            <span className="font-semibold text-ink">{inr(l.price * l.qty)}</span>
                          </div>
                        </div>
                        <button aria-label="Remove" onClick={() => remove(l.sku)} className="self-start p-1 text-neutral-400 hover:text-[#A82424] transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                </div>

                {/* Footer Totals */}
                <div className="space-y-3.5 border-t border-[#EFE8DE] bg-[#FAF7F2] p-6 shadow-inner">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 font-light">Estimated Subtotal</span>
                    <span className="font-semibold text-ink text-base">{data ? inr(data.subtotal) : "—"}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-light">Insured packaging &amp; applicable promo codes computed at checkout.</p>
                  
                  <div className="grid gap-2.5 pt-2">
                    <Link href="/checkout" onClick={() => setDrawerOpen(false)} className="btn btn-gold w-full">
                      Proceed to Secure Checkout <ArrowRight size={14} />
                    </Link>
                    <Link href="/cart" onClick={() => setDrawerOpen(false)} className="btn btn-outline-gold w-full text-xs">
                      View Full Bag Details
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
