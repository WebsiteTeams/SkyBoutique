/* eslint-disable @typescript-eslint/no-explicit-any */
import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { Product, Category, InventoryLog } from "@/models";
import { productSchema } from "@/validations";
import { slugify, toJSON } from "@/utils";

async function uniqueSlug(base: string, excludeId: string) {
  let slug = base || "product", n = 1;
  while (await Product.exists({ slug, _id: { $ne: excludeId } })) slug = `${base}-${++n}`;
  return slug;
}

export const GET = route(async (_req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  await connectDB();
  const p = await Product.findById(id).lean();
  if (!p) throw new ApiError(404, "Product not found");
  return ok({ item: toJSON(p) });
});

export const PUT = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const d = await body(req, productSchema);
  await connectDB();
  const existing = await Product.findById(id);
  if (!existing) throw new ApiError(404, "Product not found");
  if (!(await Category.exists({ _id: d.category }))) throw new ApiError(400, "Category not found");
  const skus = d.variants.map((v) => v.sku.toUpperCase());
  if (await Product.exists({ _id: { $ne: id }, "variants.sku": { $in: skus } })) throw new ApiError(409, "One of the SKUs is already used by another product");

  const slug = await uniqueSlug(d.slug || slugify(d.name), id);
  const before = new Map<string, number>(existing.variants.map((v: any) => [v.sku, v.stock] as [string, number]));
  existing.set({ ...d, slug, salePrice: d.salePrice || undefined });
  await existing.save();
  for (const v of existing.variants as any[]) {
    const b = before.get(v.sku) ?? 0;
    if (b !== v.stock) await InventoryLog.create({ product: existing._id, productName: existing.name, sku: v.sku, change: v.stock - b, before: b, after: v.stock, reason: before.has(v.sku) ? "manual" : "initial", note: "Edited in product form", by: admin._id });
  }
  return ok({ item: toJSON(existing) });
});

export const DELETE = route(async (_req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  await connectDB();
  await Product.findByIdAndDelete(id);
  return ok();
});
