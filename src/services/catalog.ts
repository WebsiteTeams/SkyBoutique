import { Types } from "mongoose";
import { Product, Category } from "@/models";
import { escapeRegex } from "@/lib/api";
import { toJSON } from "@/utils";

export type ShopQuery = {
  q?: string; category?: string; minPrice?: number; maxPrice?: number; size?: string; color?: string;
  availability?: string; sort?: string; page?: number; limit?: number; flag?: "featured" | "bestseller" | "trending" | "new";
};

export async function listProducts(sp: ShopQuery, opts: { includeUnpublished?: boolean } = {}) {
  const page = Math.max(1, sp.page ?? 1);
  const limit = Math.min(60, sp.limit ?? 12);
  const filter: Record<string, unknown> = opts.includeUnpublished ? {} : { published: true };
  const and: Record<string, unknown>[] = [];

  if (sp.q) {
    const rx = new RegExp(escapeRegex(sp.q.slice(0, 60)), "i");
    and.push({ $or: [{ name: rx }, { description: rx }, { fabric: rx }, { "variants.sku": rx }] });
  }
  if (sp.category && sp.category !== "new-arrivals") {
    const cat = await Category.findOne({ slug: sp.category });
    and.push({ category: cat?._id ?? new Types.ObjectId() });
  }
  if (sp.minPrice != null || sp.maxPrice != null) {
    // filter on the effective price
    const eff = { $cond: [{ $and: [{ $gt: ["$salePrice", 0] }, { $lt: ["$salePrice", "$price"] }] }, "$salePrice", "$price"] };
    const r: Record<string, number> = {};
    if (sp.minPrice != null) r.$gte = sp.minPrice;
    if (sp.maxPrice != null) r.$lte = sp.maxPrice;
    and.push({ $expr: { $and: [...(r.$gte != null ? [{ $gte: [eff, r.$gte] }] : []), ...(r.$lte != null ? [{ $lte: [eff, r.$lte] }] : [])] } });
  }
  const vm: Record<string, unknown> = {};
  if (sp.size) vm.size = sp.size;
  if (sp.color) vm.color = sp.color;
  if (sp.availability === "in-stock") vm.stock = { $gt: 0 };
  if (Object.keys(vm).length) and.push({ variants: { $elemMatch: vm } });
  if (sp.availability === "out-of-stock") and.push({ variants: { $not: { $elemMatch: { stock: { $gt: 0 } } } } });
  if (sp.flag && sp.flag !== "new") filter[sp.flag] = true;
  if (and.length) filter.$and = and;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 }, "price-asc": { price: 1 }, "price-desc": { price: -1 }, popularity: { soldCount: -1, createdAt: -1 },
  };
  const sort = sortMap[sp.sort ?? (sp.category === "new-arrivals" ? "newest" : "newest")] ?? sortMap.newest;

  const [items, total] = await Promise.all([
    Product.find(filter).populate("category", "name slug").sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  const now = Date.now();
  const withNew = items.map((p) => ({ ...p, isNew: now - new Date(p.createdAt).getTime() < 14 * 86400000 }));
  return toJSON({ items: withNew, total, page, pages: Math.ceil(total / limit) });
}

export async function getProductBySlug(slug: string) {
  const p = await Product.findOne({ slug, published: true }).populate("category", "name slug").lean();
  return p ? toJSON(p) : null;
}

export async function getFilterOptions() {
  const [sizes, colors, price] = await Promise.all([
    Product.distinct("variants.size", { published: true }),
    Product.aggregate([{ $match: { published: true } }, { $unwind: "$colors" }, { $group: { _id: "$colors.name", hex: { $first: "$colors.hex" } } }, { $sort: { _id: 1 } }]),
    Product.aggregate([{ $match: { published: true } }, { $group: { _id: null, max: { $max: "$price" } } }]),
  ]);
  return { sizes: sizes as string[], colors: colors.map((c) => ({ name: c._id as string, hex: c.hex as string })), maxPrice: (price[0]?.max as number) ?? 20000 };
}

export async function getCategories(onlyVisible = true) {
  const cats = await Category.find(onlyVisible ? { visible: true } : {}).sort({ sortOrder: 1, name: 1 }).lean();
  return toJSON(cats);
}
