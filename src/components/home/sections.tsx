import Link from "next/link";
import { ArrowRight, Gem, Truck, ShieldCheck, MessageCircle, Quote, Sparkles, Star } from "lucide-react";
import { Reveal, SmartImage } from "@/components/common/ui";
import { ProductGrid, type ProductLite } from "@/components/products/ProductCard";
import { CategoryCarousel } from "./CategoryCarousel";
import { Carousel } from "./Carousel";
import { NewsletterForm } from "@/components/layout/Footer";

export function SectionHead({ eyebrow, title, href, cta = "Explore All" }: { eyebrow?: string; title: string; href?: string; cta?: string }) {
  return (
    <Reveal className="mb-12 flex flex-col items-center text-center md:mb-16">
      {eyebrow && <span className="eyebrow both mb-3.5 !text-[#8C6A32]">{eyebrow}</span>}
      <h2 className="font-display text-[2.75rem] font-medium leading-[1.05] tracking-tight text-ink md:text-6xl lg:text-[4.25rem]">
        {title}
      </h2>
      {href && (
        <Link href={href} className="link-u mt-5 hidden items-center gap-1.5 pb-1 text-[11px] uppercase tracking-[0.25em] text-[#7A184E] hover:text-[#520B32] sm:inline-flex">
          {cta} <ArrowRight size={13} />
        </Link>
      )}
    </Reveal>
  );
}

export function ProductSection({ eyebrow, title, href, products, tone }: { eyebrow?: string; title: string; href: string; products: ProductLite[]; tone?: "lavender" }) {
  if (!products.length) return null;
  return (
    <section className={tone === "lavender" ? "bg-[#FAF7F2] py-20 md:py-28 border-y border-[#EFE8DE]" : "py-20 md:py-28"}>
      <div className="container-x">
        <SectionHead eyebrow={eyebrow} title={title} href={href} />
        <ProductGrid items={products} dense />
        <div className="mt-10 text-center sm:hidden">
          <Link href={href} className="btn btn-outline-gold w-full">View All Collections</Link>
        </div>
      </div>
    </section>
  );
}

type Cat = { _id: string; name: string; slug: string; image?: string; description?: string };
export function CategoryGrid({ categories }: { categories: Cat[] }) {
  const cats = categories.filter((c) => c.slug !== "new-arrivals");
  return (
    <section className="py-20 md:py-28 bg-[#FCFAF7]">
      <div className="container-x">
        <SectionHead eyebrow="Curated Collections" title="Shop by Category" href="/shop" />
        <CategoryCarousel categories={cats} />
      </div>
    </section>
  );
}

export function Collections({ categories }: { categories: Cat[] }) {
  const featured = ["bridal-collection", "designer-wear", "sarees"];
  const pool = categories.filter((c) => c.slug !== "new-arrivals");
  // featured lines first, then the rest, so the carousel always has something to scroll through
  const picks = [...pool.filter((c) => featured.includes(c.slug)), ...pool.filter((c) => !featured.includes(c.slug))];
  if (!picks.length) return null;
  return (
    <section className="bg-[#FAF7F2] py-16 md:py-20 border-y border-[#EFE8DE]">
      <div className="container-x">
        <SectionHead eyebrow="Atelier Highlights" title="Featured Collections" />
        <Carousel label="Featured collections" itemClass="w-[82%] sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]">
          {picks.map((c) => (
            <Link key={c._id} href={`/shop?category=${c.slug}`} className="group block h-full overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="aspect-[16/10] overflow-hidden bg-[#F5EFEB]">
                <SmartImage src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8C6A32]">Bespoke Curation</span>
                <h3 className="mt-0.5 font-display text-2xl text-ink transition-colors group-hover:text-[#7A184E]">{c.name}</h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-600">{c.description}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#7A184E] transition-all group-hover:gap-2.5">
                  Explore The Line <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

export function PromoBanner({ banner }: { banner?: { title: string; subtitle?: string; image: string; ctaLabel?: string; ctaLink?: string } }) {
  if (!banner) return null;
  return (
    <section className="py-12 md:py-20">
      <div className="container-x">
        <Reveal>
          <div className="relative grid overflow-hidden bg-[#120A1E] text-white border border-[#C5A880]/30 shadow-luxury md:grid-cols-2">
            <div className="z-10 flex flex-col justify-center p-8 md:p-16 lg:p-20">
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#C5A880]/40 bg-[#1A0F2B]/90 px-3.5 py-1 text-[9px] uppercase tracking-[0.3em] text-[#F4E7CB] mb-5">
                <Sparkles size={11} className="text-[#D4AF37]" />
                <span>Limited Atelier Campaign</span>
              </div>
              <h2 className="font-display text-4xl leading-[1.08] tracking-tight text-white md:text-6xl">
                {banner.title}
              </h2>
              {banner.subtitle && <p className="mt-5 max-w-md text-[#EDE5D8]/80 leading-relaxed text-sm md:text-base">{banner.subtitle}</p>}
              <Link href={banner.ctaLink || "/shop"} className="btn btn-gold mt-9 self-start">
                {banner.ctaLabel || "Shop The Edit"} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="relative min-h-80 md:min-h-[28rem] bg-[#180E26]">
              <SmartImage src={banner.image} alt={banner.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#120A1E] via-transparent to-transparent hidden md:block" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function WhyChoose() {
  const items = [
    { icon: Gem, t: "Certified Heritage Silks", d: "Pure mulberry silk, authentic Kanchipuram and Banarasi zari hand-loomed to heirloom perfection." },
    { icon: Truck, t: "Pan-India White-Glove Dispatch", d: "Insured express delivery in custom keepsake packaging, tracked every step of the journey." },
    { icon: ShieldCheck, t: "Secure Atelier Payments", d: "Protected online transactions via Razorpay, UPI, cards, or convenient Pay-on-Delivery." },
    { icon: MessageCircle, t: "Bespoke Styling Concierge", d: "Direct 1-on-1 WhatsApp consultations with our master stylists for sizing and bridal ensembles." },
  ];
  return (
    <section className="py-20 md:py-28 bg-[#FCFAF7]">
      <div className="container-x">
        <SectionHead eyebrow="The Atelier Promise" title="Why Choose SKY BOUTIQUE" />
        <Carousel label="Why choose us" itemClass="w-[82%] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]">
          {items.map(({ icon: Icon, t, d }) => (
            <div key={t} className="h-full rounded-xl border border-neutral-200 bg-white p-7 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF7F2] border border-[#C5A880]/40 text-[#7A184E]">
                <Icon strokeWidth={1.4} size={28} />
              </div>
              <h3 className="mt-5 font-display text-2xl text-ink leading-tight">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500 font-light">{d}</p>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

type Testimonial = { name: string; city?: string; text: string; rating: number };

export function Testimonials({ items }: { items: Testimonial[] }) {
  const list = items;
  if (!list.length) return null;
  return (
    <section className="bg-[#FAF7F2] py-16 md:py-20 border-y border-[#EFE8DE]">
      <div className="container-x ">
        <SectionHead eyebrow="Customer Love" title="What Our Customers Say" />
        <Carousel label="Customer testimonials" interval={5000} center trackClass="px-[6%] sm:px-1" itemClass="w-[88%] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]">
          {list.map((t, i) => (
            <figure key={i} className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-6 transition-shadow duration-300 hover:shadow-lg">
              <Quote size={26} className="text-[#D4AF37]/70" aria-hidden />
              <div className="mt-3 flex items-center gap-0.5" role="img" aria-label={`${t.rating} out of 5 stars`}>
                {[...Array(5)].map((_, k) => (
                  <Star key={k} size={14} className={k < t.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-neutral-200"} />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-neutral-700">“{t.text}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7A184E] text-sm font-semibold text-white">{t.name.trim().charAt(0).toUpperCase()}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{t.name}</span>
                  {t.city && <span className="block truncate text-xs text-neutral-500">{t.city}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

export function Gallery({ images, instagram }: { images: { src: string; alt: string; href: string }[]; instagram: string }) {
  if (!images.length) return null;
  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <SectionHead eyebrow="@skyboutique" title="Styled by You" href={instagram || undefined} cta="Follow The Atelier" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 md:gap-4">
          {images.slice(0, 6).map((g, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <Link href={g.href} className="group relative block aspect-square overflow-hidden bg-[#FAF7F2] border border-[#C5A880]/20">
                <SmartImage src={g.src} alt={g.alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-center justify-center bg-[#120A1E]/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#F4E7CB] border border-[#C5A880]/60 px-3 py-1">View Piece</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Newsletter() {
  return (
    <section className="bg-[#120A1E] py-20 text-white md:py-28 border-t border-[#C5A880]/30 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_70%)]" />
      <div className="container-x relative z-10 flex flex-col items-center text-center">
        <span className="mb-3 text-[10px] uppercase tracking-[0.38em] text-[#D4AF37] font-semibold flex items-center gap-2">
          <Sparkles size={12} /> The Atelier Circle
        </span>
        <h2 className="font-display text-4xl md:text-6xl text-white tracking-tight">Privileged Access to Private Archives</h2>
        <p className="mt-4 max-w-lg text-[#EDE5D8]/80 text-sm md:text-base leading-relaxed font-light">
          Receive confidential previews of rare handlooms, bespoke bridal consultations, and private seasonal invitations.
        </p>
        <div className="mt-9 flex w-full justify-center">
          <NewsletterForm dark />
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const words = [
    "Handcrafted Heritage", 
    "Pure Mulberry Silk", 
    "Authentic Zari Weaves", 
    "Pan-India Insured Dispatch", 
    "Bespoke Bridal Consultations", 
    "Master Karigar Artistry"
  ];
  const row = [...words, ...words];
  return (
    <div className="overflow-hidden border-y border-[#C5A880]/25 bg-[#FAF7F2] py-4" aria-hidden>
      <div className="marquee flex w-max items-center gap-12 whitespace-nowrap">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-xl tracking-wide italic text-ink/80 md:text-2xl">
            {w}
            <Sparkles size={13} className="text-[#D4AF37]" />
          </span>
        ))}
      </div>
    </div>
  );
}
