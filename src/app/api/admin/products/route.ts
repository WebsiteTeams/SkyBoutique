/* eslint-disable @typescript-eslint/no-explicit-any */
import { route, body, ok, query, paging, ApiError, escapeRegex } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { Product, Category, InventoryLog } from "@/models";
import { productSchema } from "@/validations";
import { slugify, toJSON } from "@/utils";

export const GET = route(async (req) => {
  await requireAdmin();
  await connectDB();
  const sp = query(req);
  const { page, limit, skip } = paging(sp, 20);
  const f: Record<string, unknown> = {};
  const q = sp.get("q");
  if (q) f.$or = [{ name: new RegExp(escapeRegex(q), "i") }, { "variants.sku": new RegExp(escapeRegex(q), "i") }];
  if (sp.get("category")) f.category = sp.get("category");
  const status = sp.get("status");
  if (status === "published") f.published = true;
  else if (status === "draft") f.published = false;
  else if (status === "out") f.variants = { $not: { $elemMatch: { stock: { $gt: 0 } } } };
  else if (status === "featured") f.featured = true;
  const sorts: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 }, oldest: { createdAt: 1 }, "name-asc": { name: 1 }, "price-asc": { price: 1 }, "price-desc": { price: -1 }, popular: { soldCount: -1 },
  };
  const sort = sorts[sp.get("sort") ?? "newest"] ?? sorts.newest;
  const [items, total, counts] = await Promise.all([
    Product.find(f).populate("category", "name").sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(f),
    Product.aggregate([{ $group: { _id: null, total: { $sum: 1 }, published: { $sum: { $cond: ["$published", 1, 0] } }, featured: { $sum: { $cond: ["$featured", 1, 0] } },
      out: { $sum: { $cond: [{ $eq: [{ $sum: "$variants.stock" }, 0] }, 1, 0] } } } }]),
  ]);
  const c = counts[0] ?? { total: 0, published: 0, featured: 0, out: 0 };
  return ok({ items: toJSON(items), total, page, pages: Math.ceil(total / limit), stats: { total: c.total, published: c.published, draft: c.total - c.published, featured: c.featured, out: c.out } });
});

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base || "product", n = 1;
  while (await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) slug = `${base}-${++n}`;
  return slug;
}

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const d = await body(req, productSchema);
  await connectDB();
  if (!(await Category.exists({ _id: d.category }))) throw new ApiError(400, "Category not found");
  const slug = await uniqueSlug(d.slug || slugify(d.name));
  const skuTaken = await Product.exists({ "variants.sku": { $in: d.variants.map((v) => v.sku.toUpperCase()) } });
  if (skuTaken) throw new ApiError(409, "One of the SKUs is already used by another product");
  const p = await Product.create({ ...d, slug, salePrice: d.salePrice || undefined });
  await Promise.all(p.variants.map((v: any) => InventoryLog.create({ product: p._id, productName: p.name, sku: v.sku, change: v.stock, before: 0, after: v.stock, reason: "initial", by: admin._id })));
  return ok({ item: toJSON(p) }, 201);
});
