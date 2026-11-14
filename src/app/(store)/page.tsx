import { connectDB } from "@/lib/mongodb";
import { Banner } from "@/models";
import { listProducts, getCategories } from "@/services/catalog";
import { listApprovedTestimonials } from "@/services/testimonials";
import { toJSON } from "@/utils";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid, ProductSection, Testimonials } from "@/components/home/sections";

export default async function Home() {
  await connectDB();
  const [banners, newest, best, trending, categories, testimonials] = await Promise.all([
    Banner.find({ active: true, type: "hero" }).sort({ sortOrder: 1 }).lean(),
    listProducts({ sort: "newest", limit: 10 }),
    listProducts({ flag: "bestseller", sort: "popularity", limit: 5 }),
    listProducts({ flag: "trending", limit: 5 }),
    getCategories(),
    listApprovedTestimonials(),
  ]);
  const hero = toJSON(banners) as { _id: string; type: string; title: string; subtitle?: string; image: string; ctaLabel?: string; ctaLink?: string }[];

  return (
    <>
      <Hero slides={hero} />
      <ProductSection eyebrow="Just landed" title="New Arrivals" href="/shop?category=new-arrivals" products={newest.items} />
      <CategoryGrid categories={categories} />
      <ProductSection eyebrow="Loved by many" title="Best Sellers" href="/shop?flag=bestseller&sort=popularity" products={best.items} />
      <ProductSection eyebrow="Right now" title="Trending Products" href="/shop?flag=trending" products={trending.items} tone="lavender" />
      <Testimonials items={testimonials} />
    </>
  );
}
