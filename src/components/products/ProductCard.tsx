"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { SmartImage } from "@/components/common/ui";
import { useWishlist } from "@/hooks/providers";
import { discountPct, effectivePrice, inr } from "@/utils";

export type ProductLite = {
  _id: string; 
  name: string; 
  slug: string; 
  price: number; 
  salePrice?: number; 
  images: string[];
  category?: { name: string; slug: string } | string; 
  colors?: { name: string; hex: string }[];
  variants?: { stock: number }[]; 
  createdAt?: string; 
  isNew?: boolean; 
  bestseller?: boolean;
};

export function ProductCard({ p, index = 0 }: { p: ProductLite; index?: number }) {
  const wish = useWishlist();
  const [hover, setHover] = useState(false);
  const soldOut = !!p.variants && !p.variants.some((v) => v.stock > 0);
  const pct = discountPct(p.price, p.salePrice);
  const isNew = !!p.isNew;
  const wished = wish.has(p._id);
  const second = p.images[1];

  const now = effectivePrice(p);
  const onSale = now < p.price;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 7) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#F5F1EC]"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Link href={`/products/${p.slug}`} aria-label={p.name} className="block h-full w-full">
          <SmartImage
            src={p.images[0]}
            alt={p.name}
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-105 ${second && hover ? "opacity-0" : "opacity-100"} ${soldOut ? "grayscale-[40%]" : ""}`}
          />
          {second && (
            <SmartImage
              src={second}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-105 ${hover ? "opacity-100" : "opacity-0"}`}
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {soldOut ? (
            <span className="rounded bg-neutral-900/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Sold out</span>
          ) : (
            <>
              {pct > 0 && <span className="rounded bg-[#7A184E] px-2 py-0.5 text-[10px] font-semibold text-white">{pct}% OFF</span>}
              {isNew && <span className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink shadow-sm">New</span>}
            </>
          )}
        </div>

        <button
          onClick={() => wish.toggle(p._id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-105 ${wished ? "" : "md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"}`}
        >
          <Heart size={15} className={wished ? "fill-[#7A184E] text-[#7A184E]" : "text-neutral-700"} />
        </button>
      </div>

      <div className="mt-2.5 flex flex-1 flex-col">
        <p className="truncate text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          {typeof p.category === "object" ? p.category.name : ""}
        </p>
        <Link
          href={`/products/${p.slug}`}
          className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-ink transition-colors hover:text-[#7A184E]"
        >
          {p.name}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[15px] font-semibold tabular-nums text-ink">{inr(now)}</span>
          {onSale && <span className="text-xs tabular-nums text-neutral-400 line-through">{inr(p.price)}</span>}
        </div>
        {p.colors && p.colors.length > 1 && (
          <div className="mt-2 flex items-center gap-1">
            {p.colors.slice(0, 5).map((c) => (
              <span key={c.name} title={c.name} className="h-3 w-3 rounded-full ring-1 ring-neutral-300" style={{ background: c.hex }} />
            ))}
            {p.colors.length > 5 && <span className="text-[10px] text-neutral-500">+{p.colors.length - 5}</span>}
          </div>
        )}
      </div>
    </motion.article>
  );
}

/** `dense` = medium cards (up to 5 per row), used for the home page sections. */
export function ProductGrid({ items, dense }: { items: ProductLite[]; dense?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:gap-x-5 lg:gap-y-9 ${dense ? "lg:grid-cols-4 xl:grid-cols-5" : "lg:grid-cols-4 2xl:grid-cols-5"}`}>
      {items.map((p, i) => <ProductCard key={p._id} p={p} index={i} />)}
    </div>
  );
}
