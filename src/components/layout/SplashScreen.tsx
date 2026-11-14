"use client";

import { useEffect, useState } from "react";

/**
 * Luxury splash — restrained, editorial.
 * Sequence: hairline draws → monogram fades in → wordmark rises from a mask
 * → tagline → thin progress line fills → curtain lifts.
 */
const TOTAL = 3400; // ms until the curtain starts lifting
const EXIT = 1100; // ms curtain-lift duration

export function SplashScreen() {
  const [phase, setPhase] = useState<"show" | "exit" | "done">("show");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    let raf = 0;
    let start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / TOTAL, 1);
      // ease-out so the last stretch feels unhurried
      setProgress(Math.round((1 - Math.pow(1 - t, 2.2)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const exit = setTimeout(() => setPhase("exit"), TOTAL);
    const done = setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = "";
    }, TOTAL + EXIT);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(exit);
      clearTimeout(done);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`sx-root ${phase === "exit" ? "sx-exit" : ""}`}
    >
      <div className="sx-grain" />
      <div className="sx-glow" />

      {/* Fine inset frame */}
      <span className="sx-frame" />

      {/* Top editorial line */}
      <div className="sx-top">
        <span>Maison de Couture</span>
        <span>N° 01</span>
      </div>

      <div className="sx-center">
        {/* Monogram */}
        <div className="sx-mono">
          <svg viewBox="0 0 80 80" width="64" height="64" fill="none">
            <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="0.7" className="sx-mono-ring" />
            <text
              x="40"
              y="49"
              textAnchor="middle"
              fontFamily="Cormorant Garamond, serif"
              fontStyle="italic"
              fontSize="28"
              fill="currentColor"
            >
              SB
            </text>
          </svg>
        </div>

        {/* Wordmark */}
        <h1 className="sx-word">
          <span className="sx-mask">
            <span className="sx-line sx-line-1">Sky</span>
          </span>
          <span className="sx-mask">
            <span className="sx-line sx-line-2">Boutique</span>
          </span>
        </h1>

        <span className="sx-rule" />

        <p className="sx-tag">Haute Couture &amp; Heritage Weaves</p>
      </div>

      {/* Bottom: progress */}
      <div className="sx-bottom">
        <span className="sx-label">Est. 2024</span>
        <div className="sx-track">
          <div className="sx-fill" style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <span className="sx-count">{String(progress).padStart(3, "0")}</span>
      </div>

      <style>{`
        .sx-root {
          --sx-gold: #C9AE86;
          --sx-gold-soft: rgba(201,174,134,.55);
          --sx-ivory: #F4EBDD;
          position: fixed; inset: 0; z-index: 9999;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #0B0710;
          color: var(--sx-gold);
          overflow: hidden;
          font-family: var(--font-sans);
          clip-path: inset(0 0 0 0);
        }
        .sx-exit {
          animation: sx-curtain ${EXIT}ms cubic-bezier(.76,0,.24,1) forwards;
        }
        @keyframes sx-curtain { to { clip-path: inset(0 0 100% 0); } }

        .sx-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 50% 42% at 50% 46%, rgba(122,24,78,.32), transparent 70%),
            radial-gradient(ellipse 80% 50% at 50% 110%, rgba(201,174,134,.10), transparent 70%);
          animation: sx-fade 1.6s ease-out both;
        }
        .sx-grain {
          position: absolute; inset: 0; opacity: .07; mix-blend-mode: overlay; pointer-events: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
        }
        .sx-frame {
          position: absolute; inset: clamp(14px, 2.4vw, 28px);
          border: 1px solid var(--sx-gold-soft);
          opacity: 0; animation: sx-fade 1.4s ease-out .2s forwards;
        }

        .sx-top, .sx-bottom {
          position: absolute; left: clamp(32px, 5vw, 64px); right: clamp(32px, 5vw, 64px);
          display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
          font-size: 10px; letter-spacing: .32em; text-transform: uppercase;
          color: var(--sx-gold-soft);
          opacity: 0; animation: sx-fade 1.2s ease-out 1.6s forwards;
        }
        .sx-top { top: clamp(36px, 5vw, 64px); }
        .sx-bottom { bottom: clamp(36px, 5vw, 64px); }

        .sx-center {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 0 1.5rem;
        }

        .sx-mono { color: var(--sx-gold); margin-bottom: 2.25rem; opacity: 0; animation: sx-fade 1.2s ease-out .5s forwards; }
        .sx-mono-ring { stroke-dasharray: 240; stroke-dashoffset: 240; animation: sx-draw 1.8s cubic-bezier(.65,0,.35,1) .4s forwards; }
        @keyframes sx-draw { to { stroke-dashoffset: 0; } }

        .sx-word {
          margin: 0; font-family: var(--font-serif); font-weight: 400;
          color: var(--sx-ivory); line-height: .95;
          display: flex; flex-direction: column; align-items: center;
        }
        .sx-mask { display: block; overflow: hidden; padding: .06em .2em; }
        .sx-line {
          display: block; transform: translateY(110%);
          animation: sx-rise 1.3s cubic-bezier(.16,1,.3,1) forwards;
        }
        .sx-line-1 { font-size: clamp(2.6rem, 8vw, 5.5rem); letter-spacing: .5em; margin-right: -.5em; font-weight: 300; animation-delay: .9s; }
        .sx-line-2 { font-size: clamp(3.4rem, 11vw, 8rem); font-style: italic; letter-spacing: .01em; animation-delay: 1.1s;
          background: linear-gradient(100deg, #E9D7B4 20%, #C9AE86 45%, #F4EBDD 55%, #B8975F 80%);
          background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: sx-rise 1.3s cubic-bezier(.16,1,.3,1) 1.1s forwards, sx-sheen 3.2s ease-in-out 2s infinite;
        }
        @keyframes sx-rise { to { transform: translateY(0); } }
        @keyframes sx-sheen { 0% { background-position: 100% 0; } 100% { background-position: -20% 0; } }

        .sx-rule {
          display: block; width: min(220px, 40vw); height: 1px; margin: 2rem 0 1.4rem;
          background: linear-gradient(90deg, transparent, var(--sx-gold), transparent);
          transform: scaleX(0); animation: sx-grow 1.4s cubic-bezier(.65,0,.35,1) 1.8s forwards;
        }
        @keyframes sx-grow { to { transform: scaleX(1); } }

        .sx-tag {
          margin: 0; font-size: 11px; letter-spacing: .42em; text-transform: uppercase;
          color: var(--sx-gold); opacity: 0; transform: translateY(8px);
          animation: sx-up 1.2s ease-out 2.1s forwards;
        }
        @keyframes sx-up { to { opacity: .9; transform: none; } }

        .sx-track { flex: 1; max-width: 360px; height: 1px; background: rgba(201,174,134,.2); position: relative; }
        .sx-fill { position: absolute; inset: 0; background: var(--sx-gold); transform-origin: left; transform: scaleX(0); }
        .sx-count { font-variant-numeric: tabular-nums; min-width: 3ch; text-align: right; }

        @keyframes sx-fade { to { opacity: 1; } }

        @media (max-width: 520px) {
          .sx-top span:last-child, .sx-label { display: none; }
          .sx-top { justify-content: center; }
          .sx-bottom { justify-content: center; }
          .sx-tag { letter-spacing: .28em; font-size: 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sx-root *, .sx-root { animation-duration: .01s !important; animation-delay: 0s !important; }
          .sx-line { transform: none; }
          .sx-rule { transform: none; }
        }
      `}</style>
    </div>
  );
}
