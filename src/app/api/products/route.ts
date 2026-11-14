import { route, ok, query } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { listProducts } from "@/services/catalog";
import { Product } from "@/models";
import { Types } from "mongoose";
import { toJSON } from "@/utils";

export const GET = route(async (req) => {
  const sp = query(req);
  await connectDB();
  const ids = sp.get("ids");
  if (ids) {
    const list = ids.split(",").filter((i) => Types.ObjectId.isValid(i)).slice(0, 20);
    const items = await Product.find({ _id: { $in: list }, published: true }).populate("category", "name slug").lean();
    return ok({ items: toJSON(items) });
  }
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
  const flag = sp.get("flag") as "featured" | "bestseller" | "trending" | "new" | null;
  const data = await listProducts({
    q: sp.get("q") ?? undefined, category: sp.get("category") ?? undefined, minPrice: num("minPrice"), maxPrice: num("maxPrice"),
    size: sp.get("size") ?? undefined, color: sp.get("color") ?? undefined, availability: sp.get("availability") ?? undefined,
    sort: sp.get("sort") ?? undefined, page: num("page"), limit: num("limit"), flag: flag ?? undefined,
  });
  return ok(data);
});
