/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { route, body, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { requireUser } from "@/lib/auth";
import { Wishlist, Product } from "@/models";
import { toJSON } from "@/utils";

export const GET = route(async (req) => {
  const s = await getSession();
  if (!s) return ok({ ids: [], items: [] });
  await connectDB();
  const w = await Wishlist.findOne({ user: s.id }).lean();
  const ids = (w?.products ?? []).map(String);
  if (new URL(req.url).searchParams.get("full")) {
    const items = await Product.find({ _id: { $in: ids }, published: true }).populate("category", "name slug").lean();
    return ok({ ids, items: toJSON(items) });
  }
  return ok({ ids });
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const { productId } = await body(req, z.object({ productId: z.string().min(1) }));
  await connectDB();
  const w = await Wishlist.findOne({ user: u._id });
  const has = w?.products.some((p: any) => String(p) === productId);
  if (has) await Wishlist.updateOne({ user: u._id }, { $pull: { products: productId } });
  else {
    if (!(await Product.exists({ _id: productId }))) return ok({ error: "Product not found" }, 404);
    await Wishlist.updateOne({ user: u._id }, { $addToSet: { products: productId } }, { upsert: true });
  }
  return ok({ wished: !has });
});
