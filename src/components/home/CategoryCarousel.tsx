"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/common/ui";

type Cat = { _id: string; name: string; slug: string; image?: string; description?: string };

/** Swipeable scroll-snap carousel with arrows, progress dots and gentle autoplay (pauses on hover/touch/focus). */
export function CategoryCarousel({ categories }: { categories: Cat[] }) {
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [active, setActive] = useState(0);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    const card = el.querySelector<HTMLElement>("[data-card]");
    if (card) setActive(Math.round(el.scrollLeft / (card.offsetWidth + 20)));
  }, []);

  const by = useCallback((dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>("[data-card]");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [update, categories.length]);

  // autoplay: advance every 4s, loop back to start at the end
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = track.current;
      if (!el || paused.current) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: "smooth" });
      else by(1);
    }, 4000);
    return () => clearInterval(t);
  }, [by]);

  const hold = (v: boolean) => () => { paused.current = v; };
  const arrow = "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg ring-1 ring-black/5 transition hover:bg-[#7A184E] hover:text-white disabled:pointer-events-none disabled:opacity-0 md:flex";

  return (
    <div className="relative" onMouseEnter={hold(true)} onMouseLeave={hold(false)} onTouchStart={hold(true)} onTouchEnd={hold(false)} onFocus={hold(true)} onBlur={hold(false)}>
      <button aria-label="Previous categories" disabled={!canPrev} onClick={() => by(-1)} className={`${arrow} -left-3 lg:-left-5`}><ChevronLeft size={20} /></button>
      <button aria-label="Next categories" disabled={!canNext} onClick={() => by(1)} className={`${arrow} -right-3 lg:-right-5`}><ChevronRight size={20} /></button>

      <div
        ref={track}
        role="region"
        aria-roledescription="carousel"
        aria-label="Shop by category"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="no-scrollbar [&::-webkit-scrollbar]:hidden -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-2"
      >
        {categories.map((c, i) => (
          <Link
            key={c._id}
            data-card
            href={`/shop?category=${c.slug}`}
            className="group relative aspect-[4/5] w-[calc((100%-1.25rem)/2.3)] shrink-0 snap-start overflow-hidden rounded-xl bg-[#F5F1EC] sm:w-[calc((100%-2.5rem)/3)] md:w-[calc((100%-3.75rem)/4)] lg:w-[calc((100%-5rem)/5)]"
          >
            <SmartImage src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120A1E]/85 via-[#120A1E]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-0.5 font-display text-xl leading-tight md:text-[1.35rem]">{c.name}</h3>
              <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#F4E7CB] transition-all group-hover:gap-3">
                Shop now <ArrowRight size={12} className="text-[#D4AF37]" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-1.5" aria-hidden>
        {categories.map((c, i) => (
          <span key={c._id} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-7 bg-[#7A184E]" : "w-1.5 bg-neutral-300"}`} />
        ))}
      </div>
    </div>
  );
}
