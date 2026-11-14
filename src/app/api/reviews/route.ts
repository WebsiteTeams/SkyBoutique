import { route, body, ok, query, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { Review, Product, Order } from "@/models";
import { reviewSchema } from "@/validations";
import { Types } from "mongoose";
import { toJSON } from "@/utils";

export const GET = route(async (req) => {
  const product = query(req).get("product");
  if (!product || !Types.ObjectId.isValid(product)) throw new ApiError(400, "product is required");
  await connectDB();
  const items = await Review.find({ product, approved: true }).sort({ createdAt: -1 }).limit(50).select("name rating comment createdAt").lean();
  return ok({ items: toJSON(items) });
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const sp = query(req);
  const product = sp.get("product");
  if (!product || !Types.ObjectId.isValid(product)) throw new ApiError(400, "product is required");
  const data = await body(req, reviewSchema);
  await connectDB();
  const bought = await Order.exists({ user: u._id, "items.product": product, status: { $in: ["delivered"] } });
  if (!bought) throw new ApiError(403, "Only customers who received this product can review it");
  await Review.findOneAndUpdate({ product, user: u._id }, { ...data, name: u.name }, { upsert: true, setDefaultsOnInsert: true });
  const agg = await Review.aggregate([{ $match: { product: new Types.ObjectId(product), approved: true } }, { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } }]);
  await Product.updateOne({ _id: product }, { ratingAvg: Math.round((agg[0]?.avg ?? 0) * 10) / 10, ratingCount: agg[0]?.n ?? 0 });
  return ok({}, 201);
});
