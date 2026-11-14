import { Suspense } from "react";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import { getCategories, getFilterOptions } from "@/services/catalog";
import { ShopClient } from "@/components/products/ShopClient";
import { ProductGridSkeleton } from "@/components/common/ui";

export const metadata: Metadata = { title: "Shop All Collections", description: "Browse sarees, kurtis, chudidhars, western wear, bridal and designer collections." };

export default async function ShopPage() {
  await connectDB();
  const [categories, options] = await Promise.all([getCategories(), getFilterOptions()]);
  return (
    <Suspense fallback={<div className="container-x py-12"><ProductGridSkeleton /></div>}>
      <ShopClient categories={categories.map((c: { name: string; slug: string; description?: string }) => ({ name: c.name, slug: c.slug, description: c.description }))} options={options} />
    </Suspense>
  );
}
