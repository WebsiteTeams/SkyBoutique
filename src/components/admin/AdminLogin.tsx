"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, BarChart3, Boxes, Eye, EyeOff, Fingerprint, Loader2, Lock, Mail, ShieldCheck, ShoppingBag } from "lucide-react";
import { api } from "@/utils";
import { useAuth } from "@/hooks/providers";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type Form = z.infer<typeof schema>;
type Slide = { src: string; name: string };

/* Shown in development only (seed defaults). */
const DEMO_ADMIN = { email: "admin@skyboutique.in", password: "ChangeMe@123" };

const safeNext = (n: string | null) => (n && n.startsWith("/admin") && !n.startsWith("//") ? n : null);
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } } };
const rise: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } } };

const CHIPS = [{ icon: ShoppingBag, t: "Orders" }, { icon: Boxes, t: "Inventory" }, { icon: BarChart3, t: "Reports" }];

function Showcase({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);
  const s = slides[i];

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden lg:right-[48%] xl:right-[44%]">
      {s ? (
        <AnimatePresence mode="sync">
          <motion.img key={s.src} src={s.src} alt="" initial={{ opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.4 }, scale: { duration: 9, ease: "linear" } }} className="absolute inset-0 h-full w-full object-cover" />
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_30%_20%,rgba(122,24,78,0.7),transparent_60%),#1A0F2B]" />
      )}
      {/* tonal overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#120A1E] via-[#120A1E]/55 to-[#120A1E]/30 lg:bg-gradient-to-tr" />
      <div className="absolute inset-0 bg-[#7A184E]/20 mix-blend-multiply" />
      <div className="absolute inset-y-0 right-0 hidden w-40 bg-gradient-to-r from-transparent to-[#120A1E] lg:block" />
      <div className="absolute inset-0 bg-[#120A1E]/55 lg:bg-transparent" />

      {/* editorial caption — desktop only */}
      <div className="absolute inset-x-0 bottom-0 hidden p-10 text-white lg:block xl:p-14">
        <div className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#D4AF37]"><span className="h-px w-10 bg-[#D4AF37]" /> The Atelier Dashboard</div>
        <h2 className="max-w-xl font-display text-5xl xl:text-[3.4rem] font-medium leading-[1.02]">Every thread tells <em className="italic text-[#F4E7CB]">a story.</em><br />Every order, a promise.</h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {CHIPS.map(({ icon: Icon, t }) => (
            <span key={t} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] backdrop-blur-md"><Icon size={14} className="text-[#D4AF37]" /> {t}</span>
          ))}
        </div>
        {slides.length > 1 && (
          <div className="mt-10 flex items-center gap-4">
            <div className="flex gap-2">{slides.map((_, k) => <span key={k} className={`h-px transition-all duration-500 ${k === i ? "w-12 bg-[#D4AF37]" : "w-6 bg-white/35"}`} />)}</div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/55">Featuring · {s?.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Inner({ slides }: { slides: Slide[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { refresh } = useAuth();
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Form) => {
    setError("");
    try {
      const r = await api<{ user: { role: string } }>("/api/auth/login", { method: "POST", json: v });
      if (r.user.role !== "admin") {
        await api("/api/auth/logout", { method: "POST" });
        throw new Error("This account does not have administrator access.");
      }
      await refresh();
      router.push(safeNext(sp.get("next")) ?? "/admin");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const field = "w-full rounded-xl border border-white/15 bg-white/[0.06] py-3 pl-11 pr-4 text-[15px] text-white placeholder-white/35 outline-none transition focus:border-[#D4AF37]/70 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgba(212,175,55,0.12)]";
  const lab = "mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F4E7CB]/70";

  return (
    <div data-fit-screen className="relative h-svh w-full overflow-hidden bg-[#120A1E] text-white">
      <style>{`@keyframes sky-spin{to{transform:rotate(360deg)}}@keyframes sky-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <Showcase slides={slides} />

      {/* ambient glow behind form */}
      <div aria-hidden className="pointer-events-none absolute -right-40 top-1/4 h-[34rem] w-[34rem] rounded-full bg-[#7A184E]/35 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-1/4 h-[26rem] w-[26rem] rounded-full bg-[#D4AF37]/12 blur-[130px]" />

      {/* brand */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="SKY BOUTIQUE">
          <img src="/icon.png" alt="" className="h-10 w-10 rounded-xl border border-[#D4AF37]/50 object-cover shadow-[0_0_24px_-4px_rgba(212,175,55,0.5)]" />
          <span className="leading-none"><span className="block font-display text-2xl font-semibold tracking-[0.26em]">SKY</span><span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.5em] text-[#D4AF37]">Boutique</span></span>
        </Link>
        <Link href="/" className="link-u hidden items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-white/60 hover:text-white sm:inline-flex"><ArrowLeft size={13} /> Back to store</Link>
      </header>

      {/* form column */}
      <main className="relative z-10 flex h-svh items-center justify-center overflow-y-auto overscroll-contain px-4 pb-8 pt-24 [@media(max-height:760px)]:pt-20 lg:ml-auto lg:w-[48%] lg:px-8 xl:w-[44%] xl:px-14">
        <motion.div variants={stagger} initial="hidden" animate="show" className="my-auto w-full max-w-[27rem]">
          {/* animated gold border */}
          <div className="relative overflow-hidden rounded-[1.75rem] p-px shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9)]">
            <div aria-hidden className="absolute -inset-[60%] opacity-90" style={{ background: "conic-gradient(from 0deg, transparent 0 55%, #D4AF37 72%, #F4E7CB 80%, transparent 90%)", animation: "sky-spin 7s linear infinite" }} />
            <div className="relative rounded-[calc(1.75rem-1px)] bg-[#17102A]/90 p-6 backdrop-blur-2xl sm:p-9 [@media(max-height:760px)]:!p-6">
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(500px_220px_at_50%_-10%,rgba(212,175,55,0.14),transparent_70%)]" />

              <motion.div variants={rise} className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.32em] text-[#F4E7CB]"><Fingerprint size={12} className="text-[#D4AF37]" /> Restricted · Staff only</span>
                <h1 className="mt-4 font-display text-4xl font-medium leading-[1.02] tracking-tight sm:text-[2.7rem] [@media(max-height:760px)]:!text-4xl">Welcome <em className="italic text-[#F4E7CB]">back.</em></h1>
                <p className="mt-2 text-sm font-light leading-relaxed text-white/55 [@media(max-height:680px)]:hidden">Sign in to manage orders, inventory and the storefront.</p>
              </motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="relative mt-6 space-y-4 [@media(max-height:760px)]:mt-5" noValidate>
                <motion.div variants={rise}>
                  <label htmlFor="admin-email" className={lab}>Email address</label>
                  <div className="relative">
                    <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]/80" />
                    <input id="admin-email" type="email" autoComplete="username" autoFocus placeholder="admin@skyboutique.in" className={field} aria-invalid={!!errors.email} {...register("email")} />
                  </div>
                  {errors.email && <p className="mt-1.5 text-xs text-red-300">{errors.email.message}</p>}
                </motion.div>

                <motion.div variants={rise}>
                  <label htmlFor="admin-password" className={lab}>Password</label>
                  <div className="relative">
                    <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]/80" />
                    <input id="admin-password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••••" className={`${field} !pr-12`} aria-invalid={!!errors.password}
                      onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))} {...register("password")} />
                    <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-[#D4AF37]">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-red-300">{errors.password.message}</p>}
                  {caps && <p className="mt-1.5 text-xs text-amber-300">Caps Lock is on.</p>}
                </motion.div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" /> <span>{error}</span>
                  </motion.div>
                )}

                <motion.div variants={rise} className="pt-1">
                  <button disabled={isSubmitting} className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#F4E7CB] via-[#D4AF37] to-[#B88928] px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.26em] text-[#120A1E] shadow-[0_12px_40px_-10px_rgba(212,175,55,0.6)] transition hover:shadow-[0_18px_50px_-8px_rgba(212,175,55,0.8)] disabled:opacity-60">
                    <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.55)_50%,transparent_70%)] bg-[length:200%_100%]" style={{ animation: "sky-shimmer 3.2s linear infinite" }} />
                    {isSubmitting ? <><Loader2 size={17} className="relative animate-spin" /> <span className="relative">Verifying…</span></> : <><span className="relative">Enter the dashboard</span><ArrowRight size={16} className="relative transition-transform group-hover:translate-x-1" /></>}
                  </button>
                </motion.div>
              </form>

              {process.env.NODE_ENV !== "production" && (
                <motion.div variants={rise} className="relative mt-5 rounded-xl border border-dashed border-[#D4AF37]/50 bg-[#D4AF37]/5 px-4 py-3 text-left">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#D4AF37]">Demo admin login</div>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
                    <dt className="text-white/45">Email</dt><dd className="break-all font-mono text-white/90">{DEMO_ADMIN.email}</dd>
                    <dt className="text-white/45">Password</dt><dd className="break-all font-mono text-white/90">{DEMO_ADMIN.password}</dd>
                  </dl>
                  <button type="button" onClick={() => { setValue("email", DEMO_ADMIN.email, { shouldValidate: true }); setValue("password", DEMO_ADMIN.password, { shouldValidate: true }); }}
                    className="mt-2.5 border-b border-current pb-px text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F4E7CB] hover:text-[#D4AF37]">Use these credentials</button>
                </motion.div>
              )}

              <motion.div variants={rise} className="relative mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 [@media(max-height:760px)]:hidden text-[10px] uppercase tracking-[0.18em] text-white/50">
                <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#D4AF37]" /> Encrypted session</span>
                <span className="flex items-center gap-2"><Fingerprint size={15} className="text-[#D4AF37]" /> Activity logged</span>
              </motion.div>
            </div>
          </div>

          <motion.p variants={rise} className="mt-5 text-center text-[10px] uppercase tracking-[0.25em] text-white/35 [@media(max-height:680px)]:hidden">
            Lost access? Contact the store owner · <Link href="/" className="link-u text-white/60 hover:text-white">Back to store</Link>
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}

export function AdminLogin({ slides = [] }: { slides?: Slide[] }) {
  return <Suspense><Inner slides={slides} /></Suspense>;
}
