"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Hash, Mail, Search, Truck, PackageCheck, ReceiptText } from "lucide-react";
import { useAuth } from "@/hooks/providers";
import { OrderLoader } from "./OrderView";

const HOW: { icon: typeof Hash; title: string; text: string }[] = [
  { icon: ReceiptText, title: "Find your order number", text: "It's in your order confirmation email and starts with SKY-." },
  { icon: Mail, title: "Use your checkout email", text: "Enter the same email address you used when placing the order." },
  { icon: Truck, title: "See live progress", text: "View each step from confirmation to delivery, with updates." },
];

export function TrackForm() {
  const { user } = useAuth();
  const [no, setNo] = useState("");
  const [email, setEmail] = useState("");
  const [q, setQ] = useState<{ no: string; email: string } | null>(null);
  const result = useRef<HTMLDivElement>(null);

  // pre-fill the email for signed-in customers (without overwriting anything they've typed)
  useEffect(() => { if (user?.email) setEmail((e) => e || user.email); }, [user?.email]);
  useEffect(() => { if (q) result.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [q]);

  return (
    <div className="mt-8 md:mt-10">
      <form
        onSubmit={(e) => { e.preventDefault(); setQ({ no: no.trim().toUpperCase(), email: email.trim() }); }}
        className="mx-auto max-w-2xl rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(18,10,30,0.06)] sm:p-7"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="track-no" className="label">Order number</label>
            <div className="relative">
              <Hash size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input id="track-no" required autoComplete="off" className="input !pl-10 uppercase" placeholder="e.g. SKY-10234" value={no} onChange={(e) => setNo(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="track-email" className="label">Email address</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input id="track-email" required type="email" autoComplete="email" className="input !pl-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </div>
        <button className="btn btn-primary mt-5 w-full !py-3.5"><Search size={16} /> Track order</button>
        {user && (
          <p className="mt-4 text-center text-sm text-neutral-500">
            Signed in? <Link href="/account/orders" className="inline-flex items-center gap-1 font-medium text-[#7A184E] hover:underline">See all your orders <ArrowRight size={13} /></Link>
          </p>
        )}
      </form>

      {!q && (
        <ul className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {HOW.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3.5 rounded-xl border border-neutral-200/70 bg-white/60 p-4 sm:flex-col sm:gap-3">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7A184E]/8 text-[#7A184E]">
                <Icon size={19} />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7A184E] text-[10px] font-bold text-white">{i + 1}</span>
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {q && (
        <div ref={result} className="mx-auto mt-10 max-w-5xl scroll-mt-32">
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
            <PackageCheck size={16} className="text-[#7A184E]" /> Showing results for <b className="font-semibold text-ink">{q.no}</b>
          </div>
          <OrderLoader key={q.no + q.email} orderNumber={q.no} email={q.email} />
        </div>
      )}
    </div>
  );
}
