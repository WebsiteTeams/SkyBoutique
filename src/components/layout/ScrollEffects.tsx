"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

/* Elements that animate in as they scroll into view. Grid children are staggered. */
const TARGETS = "main section > *, main .grid > *, main article, main h1, main h2";

/**
 * Site-wide scroll animations:
 *  - fades/rises elements that start below the fold when they enter the viewport (staggered inside grids)
 *  - works for content that loads later (shop results, reviews, etc.) via a MutationObserver
 *  - back-to-top button after scrolling down
 * State lives in data-* attributes so React never overwrites it; skipped when the user prefers reduced motion.
 */
export function ScrollEffects() {
  const path = usePathname();
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 of the page scrolled

  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShowTop(window.scrollY > 300);
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).setAttribute("data-in", "");
        io.unobserve(e.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    const scan = (root: ParentNode = document) => {
      root.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
        if (seen.has(el) || el.closest("[data-no-reveal]")) return;
        seen.add(el);
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) return; // already on screen: leave untouched (no flash)
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
        el.style.setProperty("--reveal-delay", `${Math.min(siblings.indexOf(el) % 6, 5) * 70}ms`);
        el.setAttribute("data-reveal", "");
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver((muts) => { if (muts.some((m) => m.addedNodes.length)) scan(); });
    const main = document.querySelector("main") ?? document.body;
    mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [path]);

  const R = 20, C = 2 * Math.PI * R;
  return (
    <button
      type="button"
      aria-label="Scroll to top"
      title="Back to top"
      tabIndex={showTop ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`no-print group fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#120A1E] text-[#F4E7CB] shadow-xl transition duration-300 hover:-translate-y-0.5 hover:bg-[#7A184E] md:bottom-24 md:right-6 ${showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      {/* scroll-progress ring */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r={R} fill="none" stroke="rgba(244,231,203,0.18)" strokeWidth="2.5" />
        <circle cx="24" cy="24" r={R} fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
      </svg>
      <ArrowUp size={18} className="relative transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}
