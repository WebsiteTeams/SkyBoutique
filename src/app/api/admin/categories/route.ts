import { adminCrud } from "@/lib/admin-crud";
import { route, ok, paging, query } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { Category, Product } from "@/models";
import { categorySchema } from "@/validations";
import { slugify, toJSON } from "@/utils";

const crud = adminCrud({
  model: Category,
  schema: categorySchema,
  sort: { sortOrder: 1, name: 1 },
  prepare: (d) => ({ ...d, slug: (d.slug as string) || slugify(d.name as string) }),
});

// List with per-category product counts (total / published) for the admin overview.
export const GET = route(async (req) => {
  await requireAdmin();
  await connectDB();
  const { page, limit, skip } = paging(query(req), 50);
  const [items, total, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments(),
    Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 }, published: { $sum: { $cond: ["$published", 1, 0] } } } }]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c]));
  const withCounts = items.map((c) => ({ ...c, productCount: map.get(String(c._id))?.count ?? 0, publishedCount: map.get(String(c._id))?.published ?? 0 }));
  return ok({ items: toJSON(withCounts), total, page, pages: Math.ceil(total / limit) });
});

export const { POST } = crud.collection;
