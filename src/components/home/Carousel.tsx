"use client";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const GAP = 20; // matches gap-5

/**
 * Generic swipeable scroll-snap carousel with arrows, progress dots and autoplay
 * (pauses on hover/touch/focus, loops back to the start, off for reduced-motion users).
 * `itemClass` sets the width of each slide, e.g. "w-[80%] sm:w-[calc((100%-1.25rem)/2)]".
 * `center` keeps the slides centred on screen: a short row sits in the middle, and slides snap to the centre while scrolling.
 */
export function Carousel({ children, itemClass, label, interval = 4000, center = false, trackClass = "" }: { children: ReactNode; itemClass: string; label: string; interval?: number; center?: boolean; trackClass?: string }) {
  const items = Children.toArray(children);
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
    const slide = el.firstElementChild as HTMLElement | null;
    if (slide) setActive(Math.round(el.scrollLeft / (slide.offsetWidth + GAP)));
  }, []);

  const by = useCallback((dir: 1 | -1) => {
    const el = track.current;
    const slide = el?.firstElementChild as HTMLElement | null;
    if (!el || !slide) return;
    el.scrollBy({ left: dir * (slide.offsetWidth + GAP), behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [update, items.length]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = track.current;
      if (!el || paused.current || el.scrollWidth <= el.clientWidth + 4) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) el.scrollTo({ left: 0, behavior: "smooth" });
      else by(1);
    }, interval);
    return () => clearInterval(t);
  }, [by, interval]);

  const hold = (v: boolean) => () => { paused.current = v; };
  const arrow = "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg ring-1 ring-black/5 transition hover:bg-[#7A184E] hover:text-white disabled:pointer-events-none disabled:opacity-0 md:flex";

  return (
    <div className="relative" onMouseEnter={hold(true)} onMouseLeave={hold(false)} onTouchStart={hold(true)} onTouchEnd={hold(false)} onFocus={hold(true)} onBlur={hold(false)}>
      <button aria-label={`Previous: ${label}`} disabled={!canPrev} onClick={() => by(-1)} className={`${arrow} -left-3 lg:-left-5`}><ChevronLeft size={20} /></button>
      <button aria-label={`Next: ${label}`} disabled={!canNext} onClick={() => by(1)} className={`${arrow} -right-3 lg:-right-5`}><ChevronRight size={20} /></button>

      <div
        ref={track}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={`no-scrollbar [&::-webkit-scrollbar]:hidden -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 py-1 ${center ? "[&>*:first-child]:ml-auto [&>*:last-child]:mr-auto" : ""} ${trackClass}`}
      >
        {items.map((child, i) => (
          <div key={i} role="group" aria-roledescription="slide" className={`shrink-0 ${center ? "snap-center" : "snap-start"} ${itemClass}`}>{child}</div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-1.5" aria-hidden>
        {items.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-7 bg-[#7A184E]" : "w-1.5 bg-neutral-300"}`} />
        ))}
      </div>
    </div>
  );
}
