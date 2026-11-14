import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock, Sparkles } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import { getPublicSettings } from "@/services/settings";
import { whatsappLink } from "@/utils";
import { PageHero, WhatsAppIcon } from "@/components/common/ui";

export const metadata: Metadata = { title: "Atelier Concierge & Inquiries" };

export default async function Page() {
  await connectDB();
  const s = await getPublicSettings();
  const rows = [
    { i: MapPin, t: "Visit The Boutique", v: s.contact.address }, 
    { i: Phone, t: "Telephone Concierge", v: s.contact.phone, href: `tel:${s.contact.phone.replace(/\s/g, "")}` },
    { i: Mail, t: "Private Correspondence", v: s.contact.email, href: `mailto:${s.contact.email}` }, 
    { i: Clock, t: "Atelier Salon Hours", v: s.contact.hours },
  ];

  return (
    <>
      <PageHero eyebrow="Personal Assistance" title="Client Concierge &amp; Inquiries" sub="Sizing, bespoke bridal consultations, or insured order tracking. We are at your service." />
      
      <div className="container-x max-w-6xl py-16 md:py-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map(({ i: Icon, t, v, href }) => (
            <div key={t} className="bg-white p-8 text-center border border-[#C5A880]/30 shadow-soft transition hover:border-[#C5A880]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#C5A880]/40 text-[#7A184E]">
                <Icon size={24} strokeWidth={1.3} />
              </div>
              <p className="mt-5 text-[9px] uppercase tracking-[0.3em] text-[#8C6A32] font-semibold">{t}</p>
              {href ? (
                <a href={href} className="mt-2 block font-display text-xl text-ink transition hover:text-[#7A184E]">{v}</a>
              ) : (
                <p className="mt-2 font-display text-xl text-ink">{v}</p>
              )}
            </div>
          ))}
        </div>

        <div className="hero-bg grain relative mt-14 overflow-hidden p-10 text-center text-white border border-[#C5A880]/30 shadow-luxury md:p-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A880]/40 bg-[#1A0F2B]/80 px-3.5 py-1 text-[9px] uppercase tracking-[0.3em] text-[#F4E7CB] mb-4">
            <Sparkles size={11} className="text-[#D4AF37]" /> Instant Styling Support
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-white">Prefer a 1-on-1 Consultation?</h2>
          <p className="mx-auto mt-4 max-w-lg text-[#EDE5D8]/80 text-sm md:text-base font-light leading-relaxed">
            Message our senior atelier stylists directly on WhatsApp for real-time guidance on drape, blouse customisation, and bridal fittings.
          </p>
          <a 
            href={whatsappLink(s.whatsappNumber, `Hello ${s.storeName}! I would like to book a private styling consultation.`)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn mt-8 bg-[#25D366] text-white hover:bg-[#128C4A] shadow-md hover:scale-102 transition"
          >
            <WhatsAppIcon size={16} /> Consult Stylist on WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
