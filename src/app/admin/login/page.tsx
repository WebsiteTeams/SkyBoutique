import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const metadata: Metadata = { title: "Staff Sign In" };

/** Showcase imagery comes from the live catalogue (public product photos only). */
async function getSlides() {
  try {
    await connectDB();
    const products = await Product.find({ published: true, "images.0": { $exists: true } }).sort({ featured: -1, soldCount: -1 }).limit(5).select("name images").lean();
    return products.map((p: { name: string; images: string[] }) => ({ src: p.images[0], name: p.name }));
  } catch {
    return [];
  }
}

export default async function Page() {
  return <AdminLogin slides={await getSlides()} />;
}
