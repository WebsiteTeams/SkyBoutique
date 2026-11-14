"use client";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, Trash2, Tag, X, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useCart, useToast } from "@/hooks/providers";
import { useCartPricing, type Pricing } from "@/hooks/useCartPricing";
import { useCoupon } from "@/hooks/useCoupon";
import { EmptyState, ErrorState, PageHero, SmartImage, Skeleton, Steps } from "@/components/common/ui";
import { inr } from "@/utils";

export function CouponBox({ code, setCode, data }: { code: string; setCode: (c: string) => void; data: Pricing | null }) {
  const [input, setInput] = useState("");
  const { toast } = useToast();
  // NOTE: no <form> here — this component is also rendered inside the checkout <form>, and nested forms are invalid HTML.
  const apply = () => { const c = input.trim().toUpperCase(); if (c) setCode(c); };
  if (code && data?.couponApplied) {
    return (
      <div className="flex items-center justify-between bg-[#FAF7F2] border border-[#C5A880]/50 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-[#7A184E]">
          <Tag size={16} className="text-[#D4AF37]" />
          <span><b>{data.couponApplied}</b> Atelier Privilege Applied</span>
        </span>
        <button type="button" onClick={() => { setCode(""); setInput(""); }} aria-label="Remove coupon" className="text-neutral-500 hover:text-ink"><X size={16} /></button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex gap-2">
        <input className="input uppercase !bg-white !py-2 text-xs" placeholder="Privilege Code (e.g. WELCOME10)" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }} aria-label="Coupon code" maxLength={30} />
        <button type="button" onClick={apply} className="btn btn-dark !px-5 !py-2 text-xs">Apply</button>
      </div>
      {code && data?.couponError && <p className="err" role="alert" onAnimationEnd={() => toast(data.couponError!, "err")}>{data.couponError}</p>}
    </div>
  );
}

export function Totals({ data }: { data: Pricing }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between text-neutral-600 font-light">
        <dt>Atelier Subtotal</dt>
        <dd className="font-medium text-ink">{inr(data.subtotal)}</dd>
      </div>
      {data.discount > 0 && (
        <div className="flex justify-between text-[#7A184E] font-medium">
          <dt>Privilege Discount ({data.couponApplied})</dt>
          <dd>-{inr(data.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between text-neutral-600 font-light">
        <dt>White-Glove Insured Delivery</dt>
        <dd className="font-medium text-ink">{data.shipping === 0 ? "Complimentary" : inr(data.shipping)}</dd>
      </div>
      {data.shipping > 0 && (
        <p className="text-xs text-[#8C6A32]">
          Add {inr(data.freeShippingAbove - (data.subtotal - data.discount))} more for complimentary shipping.
        </p>
      )}
      <div className="flex justify-between border-t border-[#EFE8DE] pt-4 text-xl font-display font-semibold text-ink">
        <dt>Total Payable</dt>
        <dd className="text-[#7A184E]">{inr(data.total)}</dd>
      </div>
    </dl>
  );
}

export function CartPage() {
  const { items, setQty, remove, ready } = useCart();
  const [code, setCode] = useCoupon();
  const { data, loading, error, reload } = useCartPricing(code);

  if (!ready) return <div className="container-x py-20"><Skeleton className="h-64 w-full" /></div>;
  if (!items.length) {
    return (
      <div className="container-x py-16">
        <EmptyState 
          title="Your bag is currently empty" 
          text="Discover timeless drapes and bridal heirloom pieces from our latest catalog." 
          action={<Link href="/shop" className="btn btn-gold">Explore The Atelier</Link>} 
        />
      </div>
    );
  }

  return (
    <>
      <PageHero eyebrow="Curated Selection" title="Your Shopping Bag">
        <Steps current={1} />
      </PageHero>
      
      <div className="container-x py-12 md:py-20">
        {error ? (
          <ErrorState message={error} retry={reload} />
        ) : (
          <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_400px]">
            <div className="divide-y divide-[#EFE8DE] border-y border-[#EFE8DE]">
              {loading && !data ? Array.from({ length: items.length }).map((_, i) => <Skeleton key={i} className="my-5 h-36 w-full" />) :
                data?.items.map((l) => (
                  <div key={l.sku} className={`flex gap-5 py-6 md:gap-7 ${l.available ? "" : "bg-red-50/40"}`}>
                    <Link href={`/products/${l.slug}`} className="h-36 w-28 shrink-0 overflow-hidden bg-[#FAF7F2] border border-[#C5A880]/30 md:h-44 md:w-34">
                      <SmartImage src={l.image} alt={l.name} className="h-full w-full object-cover" />
                    </Link>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link href={`/products/${l.slug}`} className="font-display text-2xl text-ink hover:text-[#7A184E] transition leading-tight">
                            {l.name}
                          </Link>
                          <p className="mt-1 text-xs uppercase tracking-wider text-[#8C6A32]">Size: {l.size} · Color: {l.color}</p>
                          {l.issue && <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{l.issue}</p>}
                        </div>
                        <p className="font-display text-2xl font-semibold text-ink">{inr(l.price * l.qty)}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center border border-[#C5A880]/40 bg-white">
                          <button aria-label="Decrease quantity" className="p-2.5 text-neutral-600 hover:text-ink" onClick={() => setQty(l.sku, l.qty - 1)} disabled={l.qty <= 1}>
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-xs font-semibold">{l.qty}</span>
                          <button aria-label="Increase quantity" className="p-2.5 text-neutral-600 hover:text-ink" onClick={() => setQty(l.sku, l.qty + 1)} disabled={l.qty >= l.stock}>
                            <Plus size={14} />
                          </button>
                        </div>
                        <button onClick={() => remove(l.sku)} className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-neutral-500 hover:text-[#A82424] transition">
                          <Trash2 size={14} /> Remove Piece
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Sidebar Summary */}
            <div className="h-fit space-y-6 bg-[#FAF7F2] border border-[#C5A880]/30 p-8 shadow-soft">
              <h2 className="font-display text-2xl text-ink">Order Summary</h2>
              <CouponBox code={code} setCode={setCode} data={data} />
              {data && <Totals data={data} />}
              <Link href="/checkout" className="btn btn-gold w-full">
                Proceed to Secure Checkout <ArrowRight size={15} />
              </Link>
              
              <div className="pt-4 border-t border-[#EFE8DE] space-y-2 text-xs text-neutral-500 font-light">
                <p className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#8C6A32]" /> 256-bit Encrypted Checkout Protection
                </p>
                <p className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#8C6A32]" /> Complimentary Luxury Gift Keepsake Packaging
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
