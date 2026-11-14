"use client";
import { MotionConfig, motion, useScroll, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades + lifts each page in on navigation. Honours the user's reduced-motion setting. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <MotionConfig reducedMotion="user">
      <motion.div key={path} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
        {children}
      </motion.div>
    </MotionConfig>
  );
}

/** Thin gold reading-progress bar fixed to the top of every page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="no-print pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] origin-left bg-gradient-to-r from-[#7A184E] via-[#D4AF37] to-[#7A184E]"
    />
  );
}
