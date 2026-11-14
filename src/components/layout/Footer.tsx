"use client";
import Link from "next/link";
import { useState } from "react";
import { Mail, MapPin, Phone, Clock, Loader2 } from "lucide-react";
import { useSettings, useToast } from "@/hooks/providers";
import { api, whatsappLink } from "@/utils";
import { WhatsAppIcon } from "@/components/common/ui";

const InstaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);
const FbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 8V6.5c0-.7.3-1 1-1h2V2h-3c-2.8 0-4 1.8-4 4v2H7.5v3.5H10V22h4v-10.5h2.7L17 8z" />
  </svg>
);
const YtIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 002.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 001.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 001.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5 3z" />
  </svg>
);

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ message: string }>("/api/newsletter", { method: "POST", json: { email } });
      toast(r.message);
      setEmail("");
    } catch (err) { toast((err as Error).message, "err"); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
      <input 
        type="email" 
        required 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Enter your email for private salon access" 
        aria-label="Email address"
        className={`input flex-1 ${dark ? "!border-[#C5A880]/30 !bg-[#1A0F2B]/80 !text-[#F4E7CB] placeholder:text-[#EDE5D8]/50" : "!border-[#C5A880]/30"}`} 
      />
      <button disabled={busy} className={`btn ${dark ? "btn-gold" : "btn-primary"} shrink-0`}>
        {busy ? <Loader2 className="animate-spin" size={16} /> : "Join Atelier"}
      </button>
    </form>
  );
}

export function Footer({ categories }: { categories: { name: string; slug: string }[] }) {
  const s = useSettings();
  return (
    <footer className="mt-0 bg-[#120A1E] text-white border-t border-[#C5A880]/30 relative overflow-hidden">
      <div className="container-x grid gap-12 py-20 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand Column with Luxury PNG Logo */}
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#C5A880]/50 shadow-sm">
              <img src="/icon.png" alt="SKY BOUTIQUE" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-display text-2xl font-semibold tracking-[0.24em] text-white">SKY</p>
              <p className="text-[8.5px] uppercase tracking-[0.45em] text-[#D4AF37] font-semibold">Boutique · Haute Couture</p>
            </div>
          </div>
          <p className="mt-4 font-display text-lg italic text-[#EDE5D8]/75 leading-relaxed">
            {s.footerText || s.tagline || "Elegance woven into every thread — heirloom handlooms and bespoke bridal wear."}
          </p>
          <div className="mt-6 flex gap-3.5 text-[#F4E7CB]/80">
            {s.social.instagram && (
              <a href={s.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-full border border-[#C5A880]/30 hover:border-[#D4AF37] hover:text-[#D4AF37] transition">
                <InstaIcon />
              </a>
            )}
            {s.social.facebook && (
              <a href={s.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-full border border-[#C5A880]/30 hover:border-[#D4AF37] hover:text-[#D4AF37] transition">
                <FbIcon />
              </a>
            )}
            {s.social.youtube && (
              <a href={s.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 rounded-full border border-[#C5A880]/30 hover:border-[#D4AF37] hover:text-[#D4AF37] transition">
                <YtIcon />
              </a>
            )}
            <a href={whatsappLink(s.whatsappNumber, "Hello! I have a question about Sky Boutique.")} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="p-2 rounded-full border border-[#C5A880]/30 hover:border-[#25D366] hover:text-[#25D366] transition">
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        {/* Collections */}
        <div>
          <h4 className="mb-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">The Collections</h4>
          <ul className="space-y-2.5 text-sm text-[#EDE5D8]/80 font-light">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link className="transition hover:text-[#F4E7CB] hover:underline" href={`/shop?category=${c.slug}`}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Client Care & Concierge */}
        <div>
          <h4 className="mb-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Client Concierge</h4>
          <ul className="space-y-2.5 text-sm text-[#EDE5D8]/80 font-light">
            <li><Link className="transition hover:text-[#F4E7CB]" href="/track-order">Track Insured Dispatch</Link></li>
            <li><Link className="transition hover:text-[#F4E7CB]" href="/account/orders">My Atelier Orders</Link></li>
            <li><Link className="transition hover:text-[#F4E7CB]" href="/about">Heritage &amp; Karigars</Link></li>
            <li><Link className="transition hover:text-[#F4E7CB]" href="/contact">Bespoke Bridal Appointment</Link></li>
            <li><Link className="transition hover:text-[#F4E7CB]" href="/login">Patron Sign In</Link></li>
          </ul>
        </div>

        {/* Atelier Location & Contact */}
        <div>
          <h4 className="mb-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">The Atelier</h4>
          <ul className="space-y-3.5 text-sm text-[#EDE5D8]/80 font-light">
            <li className="flex gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-[#D4AF37]" /> {s.contact.address}</li>
            <li className="flex gap-2.5"><Phone size={16} className="mt-0.5 shrink-0 text-[#D4AF37]" /> {s.contact.phone}</li>
            <li className="flex gap-2.5"><Mail size={16} className="mt-0.5 shrink-0 text-[#D4AF37]" /> {s.contact.email}</li>
            <li className="flex gap-2.5"><Clock size={16} className="mt-0.5 shrink-0 text-[#D4AF37]" /> {s.contact.hours}</li>
          </ul>
        </div>
      </div>

      
    </footer>
  );
}
