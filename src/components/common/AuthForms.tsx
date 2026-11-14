"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { api } from "@/utils";
import { useAuth } from "@/hooks/providers";
import { passwordSchema, phoneSchema } from "@/validations";

function safeNext(n: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : null;
}

/* Demo customer account shown on the customer login page in development only (seeded by scripts/seed.ts).
   Admin credentials are shown only on the admin login page. */
const DEMO = { email: "customer@skyboutique.in", password: "Customer@123" };
const SHOW_DEMO = process.env.NODE_ENV !== "production";

const AUTH_CSS = `
.ax{--g:#C9AE86;--gd:#8C6A32;--plum:#7A184E;--ink:#110E15;min-height:100vh;display:grid;grid-template-columns:1fr;background:#EFE8DE;color:var(--ink)}
@media(min-width:960px){.ax{grid-template-columns:1fr 1fr}}

/* ── Art: half-circle with logo + vertical brand letters ── */
.ax-art{position:relative;display:none;overflow:hidden;background:#F6F1E9}
@media(min-width:960px){.ax-art{display:block;position:sticky;top:0;height:100vh}}
.ax-art svg{position:absolute;inset:0;width:100%;height:100%}
.ax-letter{font-family:var(--font-serif);font-weight:300;fill:none;stroke:#7A184E;stroke-width:1.1;opacity:0;animation:ax-letter .9s ease-out forwards}
@keyframes ax-letter{to{opacity:1}}
.ax-disc-in{animation:ax-disc 1.4s cubic-bezier(.16,1,.3,1) both}
@keyframes ax-disc{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}
.ax-logo-ring{transform-origin:200px 400px;animation:ax-spin 60s linear infinite}
@keyframes ax-spin{to{transform:rotate(360deg)}}

/* ── Form side ── */
.ax-main{display:flex;flex-direction:column;min-height:100vh;padding:28px clamp(24px,6vw,72px) 32px}
.ax-bar{display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#7d746b}
.ax-bar a{transition:color .3s}.ax-bar a:hover{color:var(--plum)}
.ax-mlogo{display:flex;align-items:center;gap:.7rem}.ax-mlogo img{width:34px;height:34px;border-radius:9px;border:1px solid var(--g)}
@media(min-width:960px){.ax-mlogo{display:none}}
.ax-form-wrap{margin:auto;width:100%;max-width:400px;padding:40px 0;animation:ax-in .9s cubic-bezier(.16,1,.3,1) both}
@keyframes ax-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.ax-title{margin:0;text-align:center;font-family:var(--font-serif);font-size:clamp(2.4rem,4.4vw,3.2rem);line-height:1;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.ax-title em{font-style:normal;color:var(--plum)}
.ax-lead{margin-top:.9rem;text-align:center;font-size:.88rem;line-height:1.6;color:#6e665f;font-weight:300}
.ax-fields{margin-top:2rem;display:flex;flex-direction:column;gap:1.15rem}
.ax-field label{display:block;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--gd);margin-bottom:.4rem;font-weight:600}
.ax-in{position:relative}
.ax-in input{width:100%;background:#FBF8F3;border:1px solid transparent;padding:1rem 1.1rem;font-size:1rem;color:var(--ink);outline:none;border-radius:2px;box-shadow:0 1px 0 rgba(17,14,21,.04);transition:border-color .3s,box-shadow .3s,background .3s}
.ax-in input::placeholder{color:#aaa196;font-weight:300}
.ax-in input:focus{border-color:var(--g);background:#fff;box-shadow:0 0 0 4px rgba(201,174,134,.22)}
.ax-in input[aria-invalid="true"]{border-color:#B3261E}
.ax-eye{position:absolute;right:.5rem;top:50%;transform:translateY(-50%);color:#8a8179;padding:8px}
.ax-eye:hover{color:var(--plum)}
.ax-err{margin-top:.4rem;font-size:.75rem;color:#B3261E}
.ax-alert{border-left:2px solid #B3261E;background:rgba(179,38,30,.06);padding:.7rem .9rem;font-size:.82rem;color:#8f1d17}
.ax-forgot{margin-top:-.5rem;text-align:right;font-size:.78rem}
.ax-btn{position:relative;display:flex;align-items:center;justify-content:center;gap:.8rem;width:100%;margin-top:.4rem;padding:1.1rem 1.4rem;background:linear-gradient(135deg,#D9BF94,#C9AE86 55%,#B8975F);color:#1a1020;font-size:12px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;border-radius:2px;overflow:hidden;box-shadow:0 14px 28px -12px rgba(140,106,50,.55);transition:transform .25s,box-shadow .3s}
.ax-btn::before{content:"";position:absolute;inset:0;background:var(--plum);transform:translateY(101%);transition:transform .5s cubic-bezier(.16,1,.3,1)}
.ax-btn:hover:not(:disabled){color:#F4EBDD;box-shadow:0 16px 30px -12px rgba(122,24,78,.6)}
.ax-btn:hover:not(:disabled)::before{transform:none}
.ax-btn>*{position:relative}
.ax-btn svg{transition:transform .4s}.ax-btn:hover:not(:disabled) svg{transform:translateX(4px)}
.ax-btn:active:not(:disabled){transform:scale(.985)}
.ax-btn:disabled{opacity:.7;cursor:wait}
.ax-links{margin-top:1.6rem;display:flex;flex-direction:column;align-items:center;gap:.7rem;font-size:.85rem;color:#6e665f;font-weight:300;text-align:center}
.ax a.ax-a,.ax-links a,.ax-forgot a{color:var(--plum);font-weight:500;background:linear-gradient(currentColor,currentColor) 0 100%/100% 1px no-repeat;padding-bottom:1px;transition:background-size .4s}
.ax-links a:hover,.ax-forgot a:hover{background-size:0 1px}
.ax-links .ax-quiet{font-size:.75rem;color:#9b9289}
.ax-or{display:flex;align-items:center;gap:1rem;width:100%;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#9b9289}
.ax-or::before,.ax-or::after{content:"";flex:1;height:1px;background:rgba(17,14,21,.14)}
.ax-demo{width:100%;margin-top:1.6rem;border:1px dashed rgba(140,106,50,.6);background:rgba(251,248,243,.7);padding:1rem 1.1rem;text-align:left}
.ax-demo h3{display:flex;align-items:center;gap:.5rem;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--gd);font-weight:600;margin:0 0 .6rem}
.ax-demo dl{display:grid;grid-template-columns:auto 1fr;gap:.25rem 1rem;font-size:.82rem;margin:0}
.ax-demo dt{color:#8a8179}.ax-demo dd{margin:0;font-family:ui-monospace,Consolas,monospace;color:var(--ink);word-break:break-all}
.ax-demo button{margin-top:.8rem;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--plum);font-weight:600;border-bottom:1px solid currentColor;padding-bottom:1px}
.ax-hint{font-size:.72rem;color:#9b9289;font-weight:300;margin-top:-.5rem}
.ax-meter{display:flex;gap:4px;margin-top:.6rem}.ax-meter i{flex:1;height:2px;background:rgba(17,14,21,.12);transition:background .3s}
.ax-devbox{word-break:break-all;border:1px solid rgba(201,174,134,.5);padding:1rem;font-size:.75rem}
@media(prefers-reduced-motion:reduce){.ax *{animation:none!important;transition:none!important}.ax-letter{opacity:1}}
`;

const BRAND = "SKYBOUTIQUE".split("");

/** Half-circle with the logo and the brand name set vertically along its edge. */
function Art() {
  const cx = 150, cy = 400, R = 372;
  return (
    <aside className="ax-art" aria-hidden>
      <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="axd" cx="35%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#3a0f33" />
            <stop offset="55%" stopColor="#1C1030" />
            <stop offset="100%" stopColor="#0B0710" />
          </radialGradient>
          <pattern id="axp" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M18 4 32 18 18 32 4 18Z" fill="none" stroke="#C9AE86" strokeWidth=".6" opacity=".5" />
            <circle cx="18" cy="18" r="1.2" fill="#C9AE86" opacity=".7" />
          </pattern>
          <clipPath id="axc"><circle cx={cx} cy={cy} r={330} /></clipPath>
          <linearGradient id="axg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E6CFA2" /><stop offset="1" stopColor="#B8975F" />
          </linearGradient>
        </defs>
        <g className="ax-disc-in">
          <circle cx={cx} cy={cy} r={330} fill="url(#axd)" />
          <rect x="0" y="0" width="600" height="800" fill="url(#axp)" opacity=".22" clipPath="url(#axc)" />
          <circle cx={cx} cy={cy} r={316} fill="none" stroke="#C9AE86" strokeWidth=".8" opacity=".5" />
          <circle cx={cx} cy={cy} r={330} fill="none" stroke="url(#axg)" strokeWidth="1.5" />
          {/* logo */}
          <g>
            <circle className="ax-logo-ring" cx={200} cy={cy} r={128} fill="none" stroke="#C9AE86" strokeWidth=".8" strokeDasharray="3 7" />
            <circle cx={200} cy={cy} r={108} fill="#0B0710" stroke="url(#axg)" strokeWidth="1.4" />
            <image href="/icon.png" x={200 - 84} y={cy - 84} width={168} height={168} preserveAspectRatio="xMidYMid meet" />
          </g>
        </g>
        {/* vertical brand letters following the arc */}
        {BRAND.map((ch, i) => {
          const a = ((-40 + i * 8) * Math.PI) / 180;
          const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
          return (
            <text key={i} className="ax-letter" x={x} y={y} fontSize="62" textAnchor="middle" dominantBaseline="central" style={{ animationDelay: `${0.5 + i * 0.09}s` }}>
              {ch}
            </text>
          );
        })}
      </svg>
    </aside>
  );
}

function Shell({ title, em, sub, children }: { title: string; em?: string; sub?: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="ax">
      <style>{AUTH_CSS}</style>
      <Art />
      <main className="ax-main">
        <div className="ax-bar">
          <Link href="/" className="ax-mlogo"><img src="/icon.png" alt="Sky Boutique" /></Link>
          <Link href="/" style={{ marginLeft: "auto" }}>← Return to boutique</Link>
        </div>
        <div className="ax-form-wrap">
          <h1 className="ax-title">{title}{em && <> <em>{em}</em></>}</h1>
          {sub && <p className="ax-lead">{sub}</p>}
          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}

type FieldProps = { id: string; label: string; ac?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>;
const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field({ id, label, type = "text", ac, error, ...rest }, ref) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div className="ax-field">
      <label htmlFor={id}>{label}</label>
      <div className="ax-in">
        <input id={id} ref={ref} type={isPw && show ? "text" : type} autoComplete={ac} aria-invalid={!!error} {...rest} />
        {isPw && (
          <button type="button" className="ax-eye" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="ax-err">{error}</p>}
    </div>
  );
});

const Submit = ({ busy, children }: { busy: boolean; children: React.ReactNode }) => (
  <button disabled={busy} className="ax-btn">
    <span>{children}</span>
    {busy ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
  </button>
);

const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });

function LoginInner({ admin }: { admin?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { refresh } = useAuth();
  const [error, setError] = useState("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (v: z.infer<typeof loginSchema>) => {
    setError("");
    try {
      const r = await api<{ user: { role: string } }>("/api/auth/login", { method: "POST", json: v });
      if (admin && r.user.role !== "admin") { await api("/api/auth/logout", { method: "POST" }); throw new Error("This account does not have administrator access"); }
      await refresh();
      router.push(safeNext(sp.get("next")) ?? (r.user.role === "admin" && admin ? "/admin" : "/account"));
      router.refresh();
    } catch (e) { setError((e as Error).message); }
  };

  return (
    <Shell title="Log" em="in" sub={admin ? "Restricted administrative access." : undefined}>
      <form onSubmit={handleSubmit(onSubmit)} className="ax-fields" noValidate>
        <Field id="email" label="Email address" type="email" ac="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
        <Field id="password" label="Password" type="password" ac="current-password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
        {!admin && <p className="ax-forgot"><Link href="/forgot-password">Forgot your password?</Link></p>}
        {error && <p className="ax-alert" role="alert">{error}</p>}
        <Submit busy={isSubmitting}>Submit</Submit>
      </form>
      <div className="ax-links">
        {!admin && (
          <>
            <p>New here? <Link href={`/register${sp.get("next") ? `?next=${encodeURIComponent(sp.get("next")!)}` : ""}`}>Create an account</Link></p>
            <div className="ax-or">Or</div>
            <p className="ax-quiet"><Link href="/shop">Continue as guest</Link> — guest checkout is always available.</p>
          </>
        )}
        {SHOW_DEMO && !admin && (
          <div className="ax-demo">
            <h3><KeyRound size={13} /> Demo login</h3>
            <dl><dt>Email</dt><dd>{DEMO.email}</dd><dt>Password</dt><dd>{DEMO.password}</dd></dl>
            <button type="button" onClick={() => { setValue("email", DEMO.email, { shouldValidate: true }); setValue("password", DEMO.password, { shouldValidate: true }); }}>Use these credentials</button>
          </div>
        )}
      </div>
    </Shell>
  );
}
export const LoginForm =({ admin }: { admin?: boolean }) => <Suspense><LoginInner admin={admin} /></Suspense>;

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"), email: z.string().trim().email("Enter a valid email"),
  phone: phoneSchema.optional().or(z.literal("")), password: passwordSchema,
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { message: "Passwords do not match", path: ["confirm"] });

function RegisterInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { refresh } = useAuth();
  const [error, setError] = useState("");
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (v: z.infer<typeof registerSchema>) => {
    setError("");
    try {
      await api("/api/auth/register", { method: "POST", json: { name: v.name, email: v.email, phone: v.phone, password: v.password } });
      await refresh();
      router.push(safeNext(sp.get("next")) ?? "/account");
      router.refresh();
    } catch (e) { setError((e as Error).message); }
  };

  const pw = useWatch({ control, name: "password" }) ?? "";
  const strength = [pw.length >= 8, /[A-Za-z]/.test(pw) && /\d/.test(pw), pw.length >= 12, /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;

  const F = (n: "name" | "email" | "phone" | "password" | "confirm", label: string, type = "text", ac?: string, ph?: string) => (
    <Field id={n} label={label} type={type} ac={ac} placeholder={ph} error={errors[n]?.message} {...register(n)} />
  );

  return (
    <Shell title="Join the" em="atelier" sub="A curated wishlist, insured order tracking and invitations to private salons.">
      <form onSubmit={handleSubmit(onSubmit)} className="ax-fields" noValidate>
        {F("name", "Full name", "text", "name", "Your name")}
        {F("email", "Email address", "email", "email", "you@example.com")}
        {F("phone", "Mobile (optional)", "tel", "tel", "+91")}
        <div>
          {F("password", "Password", "password", "new-password", "••••••••")}
          <div className="ax-meter" aria-hidden>
            {[0, 1, 2, 3].map((i) => <i key={i} style={{ background: i < strength ? "#C9AE86" : undefined }} />)}
          </div>
        </div>
        {F("confirm", "Confirm password", "password", "new-password", "••••••••")}
        <p className="ax-hint">At least 8 characters, with a letter and a number.</p>
        {error && <p className="ax-alert" role="alert">{error}</p>}
        <Submit busy={isSubmitting}>Create account</Submit>
      </form>
      <div className="ax-links">
        <p>Already registered? <Link href="/login">Sign in</Link></p>
      </div>
    </Shell>
  );
}
export const RegisterForm = () => <Suspense><RegisterInner /></Suspense>;

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ message: string; devResetUrl?: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Shell title="Reset" em="password" sub="Enter your email and we will send you a secure reset link.">
      {msg ? (
        <div className="ax-fields">
          <p className="ax-lead" style={{ color: "#110E15" }}>{msg.message}</p>
          {msg.devResetUrl && (
            <p className="ax-devbox">
              Dev mode link: <a style={{ color: "#7A184E", textDecoration: "underline" }} href={msg.devResetUrl}>Open reset link</a>
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              setMsg(await api("/api/auth/forgot", { method: "POST", json: { email } }));
            } catch (er) {
              setError((er as Error).message);
            }
            setBusy(false);
          }}
          className="ax-fields"
        >
          <Field id="email" label="Email address" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="ax-alert">{error}</p>}
          <Submit busy={busy}>Send reset link</Submit>
        </form>
      )}
      <div className="ax-links"><p><Link href="/login">Return to sign in</Link></p></div>
    </Shell>
  );
}

function ResetInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Shell title="New" em="password" sub="Choose a new password for your account.">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api("/api/auth/reset", { method: "POST", json: { token: sp.get("token") ?? "", password } });
            router.push("/login");
          } catch (er) {
            setError((er as Error).message);
          }
          setBusy(false);
        }}
        className="ax-fields"
      >
        <Field id="new-password" label="New password" type="password" ac="new-password" required minLength={8} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="ax-hint">At least 8 characters, with a letter and a number.</p>
        {error && <p className="ax-alert" role="alert">{error}</p>}
        <Submit busy={busy}>Update password</Submit>
      </form>
    </Shell>
  );
}
export const ResetForm = () => <Suspense><ResetInner /></Suspense>;
