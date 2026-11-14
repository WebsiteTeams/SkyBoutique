import type { Metadata } from "next";
import Link from "next/link";
import { Gem, HeartHandshake, Sparkles, Truck } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import { getPublicSettings } from "@/services/settings";
import { PageHero, Reveal } from "@/components/common/ui";

export const metadata: Metadata = { title: "Atelier Heritage & Craft" };

export default async function Page() {
  await connectDB();
  const s = await getPublicSettings();
  const values = [
    { i: Gem, t: "Master Karigars First", d: "Direct partnerships with generational weaver clusters across Varanasi, Kanchipuram, and Chanderi." },
    { i: Sparkles, t: "Heirloom, Never Fleeting", d: "Hand-loomed drapes designed to be cherished, preserved, and handed down across generations." },
    { i: HeartHandshake, t: "Private Styling Salon", d: "One-on-one personal styling consultations via WhatsApp with our senior fashion curators." },
    { i: Truck, t: "White-Glove Insured Delivery", d: "Carefully inspected, packaged in custom keepsake boutique gift boxes, and insured to your residence." },
  ];

  return (
    <>
      <PageHero eyebrow={`The Story of ${s.storeName}`} title={s.about.title || "Woven from Generations of Heritage"} sub={s.tagline} />
      
      <section className="container-x grid max-w-6xl gap-12 py-20 md:grid-cols-[1fr_1.2fr] md:py-28">
        <Reveal>
          <div className="border-l-2 border-[#C5A880] pl-6">
            <p className="font-display text-4xl leading-tight text-ink md:text-5xl">
              An atelier built on <em className="italic text-[#7A184E]">reverence for the craft.</em>
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-[#8C6A32]">Est. 2026 · Handcrafted in India</p>
          </div>
        </Reveal>
        
        <Reveal delay={0.1}>
          <div className="space-y-6 whitespace-pre-line text-lg leading-relaxed text-neutral-700 font-light">
            {s.about.body}
          </div>
        </Reveal>
      </section>

      <section className="bg-[#FAF7F2] py-20 md:py-28 border-y border-[#EFE8DE]">
        <div className="container-x">
          <div className="mb-14 text-center">
            <span className="eyebrow both !text-[#8C6A32]">The Atelier Pillars</span>
            <h2 className="mt-3 font-display text-4xl md:text-5xl text-ink">Our Uncompromising Standards</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ i: Icon, t, d }, k) => (
              <Reveal key={t} delay={k * 0.07} className="bg-white p-8 text-center border border-[#C5A880]/25 shadow-soft transition hover:border-[#C5A880]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#C5A880]/40 text-[#7A184E]">
                  <Icon strokeWidth={1.3} size={28} />
                </div>
                <h3 className="mt-5 font-display text-2xl text-ink">{t}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-neutral-500 font-light">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20 text-center md:py-28">
        <p className="font-display text-4xl italic text-[#7A184E] md:text-6xl max-w-3xl mx-auto leading-tight">
          “{s.tagline}”
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="btn btn-gold">Explore The Collection</Link>
          <Link href="/contact" className="btn btn-outline-gold">Book Atelier Appointment</Link>
        </div>
      </section>
    </>
  );
}
