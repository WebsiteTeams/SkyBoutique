"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, ShieldCheck } from "lucide-react";
import { SmartImage } from "@/components/common/ui";

type Slide = { _id: string; title: string; subtitle?: string; image: string; ctaLabel?: string; ctaLink?: string };

/** Renders the last word(s) of the headline in italic serif for an editorial feel. */
function Headline({ text }: { text: string }) {
  const words = text.split(" ");
  if (words.length < 3) return <>{text}</>;
  const cut = Math.ceil(words.length / 2);
  return (
    <>
      {words.slice(0, cut).join(" ")}{" "}
      <em className="font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-[#F4E7CB] via-[#D4AF37] to-[#E5C378]">
        {words.slice(cut).join(" ")}
      </em>
    </>
  );
}

/** Drop your clip at public/videos/hero.mp4 (and optionally hero.webm). Falls back to the gradient if it is missing. */
const HERO_VIDEO = { mp4: "/videos/hero.mp4", webm: "/videos/hero.webm", poster: "/seed/hero-1.png" };

function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { v.pause(); return; }
    v.play().catch(() => {});
  }, []);
  if (failed) return null;
  return (
    <>
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay muted loop playsInline preload="metadata"
        poster={HERO_VIDEO.poster}
        aria-hidden
        onError={() => setFailed(true)}
      >
        <source src={HERO_VIDEO.webm} type="video/webm" onError={() => {}} />
        <source src={HERO_VIDEO.mp4} type="video/mp4" onError={() => setFailed(true)} />
      </video>
      {/* Readability overlay: darker on the text side, lighter on the right */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#120A1E]/85 via-[#120A1E]/55 to-[#120A1E]/25" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#120A1E]/70 to-transparent" />
    </>
  );
}

export function Hero({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 7500);
    return () => clearInterval(t);
  }, [n]);
  const s = slides[i];
  if (!s) return null;

  return (
    <section className="hero-bg grain relative overflow-hidden text-white border-b border-[#C5A880]/20">
      <HeroVideo />
      <div className="container-x container-full relative z-10 grid w-full max-w-none min-h-[calc(100svh-5.5rem)] items-center gap-12 py-8 md:py-8 lg:py-1">
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div key={s._id + "t"} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A880]/40 bg-[#1A0F2B]/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-[#F4E7CB] backdrop-blur-md">
                <Sparkles size={11} className="text-[#D4AF37]" />
                <span>Haute Couture · Autumn / Winter 2026</span>
              </div>

              <h1 className="mt-6 font-display text-[3.4rem] font-medium leading-[0.98] tracking-tight text-white md:text-[5.2rem] xl:text-[6.5rem]">
                <Headline text={s.title} />
              </h1>

              {s.subtitle && (
                <p className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-[#EDE5D8]/85 md:text-base">
                  {s.subtitle}
                </p>
              )}

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href={s.ctaLink || "/shop"} className="btn btn-gold">
                  {s.ctaLabel || "Explore The Collection"} <ArrowRight size={15} />
                </Link>
                <Link href="/shop?category=bridal-collection" className="btn border border-[#C5A880]/50 text-[#F4E7CB] hover:bg-[#F4E7CB] hover:text-[#120A1E]">
                  Bridal Trousseau
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          <dl className="mt-14 hidden max-w-3xl grid-cols-3 gap-6 border-t border-[#C5A880]/25 pt-6 text-white md:grid">
            {[
              ["100%", "Pure Mulberry Silk & Zari"],
              ["Pan-India", "White-Glove Insured Delivery"],
              ["Personal", "Bespoke Styling Concierge"]
            ].map(([a, b]) => (
              <div key={a} className="relative pl-3 border-l border-[#C5A880]/40">
                <dt className="font-display text-2xl text-[#F4E7CB] font-semibold">{a}</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/70 leading-snug">{b}</dd>
              </div>
            ))}
          </dl>
        </div>

        
      </div>

      {n > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 z-10">
          <button aria-label="Previous slide" onClick={() => setI((i - 1 + n) % n)} className="text-[#F4E7CB]/60 hover:text-[#F4E7CB] transition">
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            {slides.map((x, k) => (
              <button key={x._id} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} 
                className={`h-1 rounded-full transition-all duration-500 ${k === i ? "w-10 bg-[#D4AF37]" : "w-4 bg-white/30 hover:bg-white/50"}`} />
            ))}
          </div>
          <button aria-label="Next slide" onClick={() => setI((i + 1) % n)} className="text-[#F4E7CB]/60 hover:text-[#F4E7CB] transition">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
}
