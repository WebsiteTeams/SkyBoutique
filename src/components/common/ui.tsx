"use client";
import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { Star, PackageOpen, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { inr } from "@/utils";

/* eslint-disable @next/next/no-img-element */
export function SmartImage({ src, alt, className, priority, style }: { src?: string; alt: string; className?: string; priority?: boolean; style?: React.CSSProperties }) {
  if (!src) return <div className={clsx("bg-[#FAF7F2]", className)} aria-label={alt} />;
  return <img src={src} alt={alt} style={style} loading={priority ? "eager" : "lazy"} decoding="async" className={clsx("object-cover", className)} />;
}

export function Reveal({ children, delay = 0, className, y = 24 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

export function Price({ price, salePrice, size = "md" }: { price: number; salePrice?: number | null; size?: "sm" | "md" | "lg" }) {
  const onSale = !!salePrice && salePrice < price;
  const cls = { sm: "text-sm", md: "text-base", lg: "text-2xl" }[size];
  return (
    <div className={clsx("flex flex-wrap items-baseline gap-2", cls)}>
      <span className={clsx("font-semibold text-ink tracking-tight", onSale && "!text-[#7A184E]")}>
        {inr(onSale ? salePrice! : price)}
      </span>
      {onSale && <span className="text-[0.8em] text-neutral-400 line-through font-normal">{inr(price)}</span>}
    </div>
  );
}

export function Stars({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-neutral-200"} />
      ))}
      {count !== undefined && <span className="ml-1 text-xs text-neutral-500 font-light">({count})</span>}
    </div>
  );
}

export const Skeleton = ({ className }: { className?: string }) => <div className={clsx("skeleton", className)} />;

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 md:gap-y-12 xl:grid-cols-4 xl:gap-x-8">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <Skeleton className="aspect-[3/4] w-full border border-[#C5A880]/20" />
          <Skeleton className="mt-3.5 h-3 w-1/3 mx-auto" />
          <Skeleton className="mt-2 h-4 w-3/4 mx-auto" />
          <Skeleton className="mt-2 h-4 w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF7F2] border border-[#C5A880]/40 text-[#7A184E] mb-5">
        <PackageOpen size={32} strokeWidth={1.3} />
      </div>
      <h3 className="font-display text-3xl text-ink">{title}</h3>
      {text && <p className="mt-2.5 max-w-sm text-sm text-neutral-500 font-light">{text}</p>}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-4 py-20 text-center">
      <AlertTriangle size={36} strokeWidth={1.3} className="mb-3 text-[#A82424]" />
      <p className="text-sm text-neutral-600">{message}</p>
      {retry && <button onClick={retry} className="btn btn-outline mt-6">Try again</button>}
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  return (
    <nav className="mt-14 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button className="btn btn-outline-gold !px-4 !py-2 text-xs" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && list[i - 1] !== p - 1 && <span className="px-1 text-neutral-400">…</span>}
          <button 
            onClick={() => onChange(p)} 
            aria-current={p === page} 
            className={clsx("h-10 w-10 text-xs font-medium transition", p === page ? "bg-[#120A1E] text-[#F4E7CB] border border-[#C5A880]/60 shadow-sm" : "border border-neutral-200 hover:border-[#C5A880] hover:text-[#7A184E]")}
          >
            {p}
          </button>
        </span>
      ))}
      <button className="btn btn-outline-gold !px-4 !py-2 text-xs" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}

export function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z" />
    </svg>
  );
}

/** Dark editorial page banner used at the top of inner pages. */
export function PageHero({ eyebrow, title, sub, children }: { eyebrow?: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <section className="hero-bg grain relative overflow-hidden text-white border-b border-[#C5A880]/20">
      <div className="container-x py-16 text-center md:py-24">
        {eyebrow && <span className="eyebrow both mb-3.5 !text-[#D4AF37]">{eyebrow}</span>}
        <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">{title}</h1>
        {sub && <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#EDE5D8]/80 md:text-base font-light">{sub}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

/** Bag → Details → Done progress indicator. */
export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Shopping Bag", "Secure Checkout", "Order Confirmation"];
  return (
    <ol className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.24em] md:gap-6 md:text-[11px]">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-3 md:gap-6">
          <span className={clsx("flex items-center gap-2.5", i + 1 <= current ? "text-[#F4E7CB] font-medium" : "text-white/40 font-light")}>
            <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full border text-[10px]", i + 1 <= current ? "border-[#D4AF37] bg-[#D4AF37] text-[#120A1E] font-semibold" : "border-white/20")}>
              {i + 1}
            </span>
            <span className="hidden sm:inline">{s}</span>
          </span>
          {i < 2 && <span className="h-px w-6 bg-[#C5A880]/30 md:w-12" />}
        </li>
      ))}
    </ol>
  );
}
