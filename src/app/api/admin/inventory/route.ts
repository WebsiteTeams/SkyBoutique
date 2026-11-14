/* eslint-disable @typescript-eslint/no-explicit-any */
import { route, body, ok, query, paging, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { Product, InventoryLog, getSettings } from "@/models";
import { stockAdjustSchema } from "@/validations";
import { toJSON } from "@/utils";

// GET ?view=stock (default) | logs
export const GET = route(async (req) => {
  await requireAdmin();
  await connectDB();
  const sp = query(req);
  const { page, limit, skip } = paging(sp, 30);
  if (sp.get("view") === "logs") {
    const [items, total] = await Promise.all([InventoryLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), InventoryLog.countDocuments()]);
    return ok({ items: toJSON(items), total, page, pages: Math.ceil(total / limit) });
  }
  const threshold = (await getSettings()).lowStockThreshold;
  const rows = await Product.aggregate([
    { $unwind: "$variants" },
    { $project: { _id: "$variants.sku", productId: "$_id", name: 1, image: { $arrayElemAt: ["$images", 0] }, sku: "$variants.sku", size: "$variants.size", color: "$variants.color", stock: "$variants.stock" } },
    ...(sp.get("filter") === "low" ? [{ $match: { stock: { $gt: 0, $lte: threshold } } }] : sp.get("filter") === "out" ? [{ $match: { stock: 0 } }] : []),
    ...(sp.get("q") ? [{ $match: { $or: [{ name: { $regex: sp.get("q")!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }, { sku: { $regex: sp.get("q")!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }] } }] : []),
    { $sort: { stock: 1, name: 1 } },
    { $facet: { rows: [{ $skip: skip }, { $limit: limit }], total: [{ $count: "n" }] } },
  ]);
  const total = rows[0].total[0]?.n ?? 0;
  return ok({ items: toJSON(rows[0].rows), total, page, pages: Math.ceil(total / limit), threshold });
});

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const d = await body(req, stockAdjustSchema);
  await connectDB();
  const p = await Product.findById(d.productId);
  const v = p?.variants.find((x: any) => x.sku === d.sku);
  if (!p || !v) throw new ApiError(404, "Variant not found");
  const before = v.stock;
  const after = d.mode === "set" ? d.quantity : before + d.quantity;
  if (after < 0) throw new ApiError(400, "Stock cannot go below zero");
  // atomic against concurrent orders: apply the delta, not an overwrite of a stale value
  const res = await Product.findOneAndUpdate(
    { _id: p._id, "variants.sku": d.sku },
    { $inc: { "variants.$[v].stock": after - before } },
    { arrayFilters: [{ "v.sku": d.sku }], returnDocument: "after" },
  );
  const final = res!.variants.find((x: any) => x.sku === d.sku)!.stock;
  if (final < 0) {
    await Product.updateOne({ _id: p._id }, { $inc: { "variants.$[v].stock": before - after } }, { arrayFilters: [{ "v.sku": d.sku }] });
    throw new ApiError(409, "Stock changed while updating. Please retry.");
  }
  await InventoryLog.create({ product: p._id, productName: p.name, sku: d.sku, change: after - before, before, after: final, reason: "manual", note: d.note, by: admin._id });
  return ok({ stock: final });
});
