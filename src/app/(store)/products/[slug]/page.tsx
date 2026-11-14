import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getProductBySlug, listProducts } from "@/services/catalog";
import { Gallery, Purchase, RecentlyViewed, Reviews, SectionHead, type Product } from "@/components/products/ProductDetail";
import { ProductGrid } from "@/components/products/ProductCard";
import { effectivePrice } from "@/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: String(p.description).slice(0, 160),
    openGraph: { title: p.name, description: String(p.description).slice(0, 160), images: p.images[0] ? [p.images[0]] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  await connectDB();
  const p = (await getProductBySlug(slug)) as (Product & { category: { name: string; slug: string } }) | null;
  if (!p) notFound();
  const related = (await listProducts({ category: p.category.slug, limit: 5 })).items.filter((r: { _id: string }) => r._id !== p._id).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description, image: p.images,
    offers: { "@type": "Offer", priceCurrency: "INR", price: effectivePrice(p), availability: p.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };

  return (
    <div className="container-x pb-24 pt-5 md:py-10 lg:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="no-scrollbar mb-5 flex items-center gap-x-2 overflow-x-auto whitespace-nowrap text-xs text-neutral-500 md:mb-8 md:text-sm" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-[#7A184E]">Home</Link><span className="text-[#C5A880]">/</span>
        <Link href="/shop" className="transition hover:text-[#7A184E]">Shop</Link><span className="text-[#C5A880]">/</span>
        <Link href={`/shop?category=${p.category.slug}`} className="transition hover:text-[#7A184E]">{p.category.name}</Link><span className="text-[#C5A880]">/</span>
        <span className="font-medium text-ink">{p.name}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-14 xl:gap-20">
        <Gallery images={p.images} name={p.name} />
        <Purchase product={p} />
      </div>
      <Reviews productId={p._id} />
      {related.length > 0 && (
        <section className="mt-20 border-t border-[#EFE8DE] pt-16 md:mt-24">
          <SectionHead eyebrow="Complete the look" title="You may also like" />
          <ProductGrid items={related} />
        </section>
      )}
      <RecentlyViewed currentId={p._id} />
    </div>
  );
}
