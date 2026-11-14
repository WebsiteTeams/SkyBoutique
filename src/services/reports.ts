import { Order, Product, User } from "@/models";

/** Revenue = orders that are not cancelled/returned and are either paid online or COD. */
export const revenueMatch = {
  status: { $nin: ["cancelled", "returned"] },
  $or: [{ paymentStatus: "paid" }, { paymentMethod: "cod" }],
};

export type Range = "daily" | "weekly" | "monthly" | "yearly";

export async function salesSeries(range: Range) {
  const now = new Date();
  let start: Date, unit: string, fmt: string;
  if (range === "daily") { start = new Date(now.getTime() - 29 * 86400000); unit = "day"; fmt = "%Y-%m-%d"; }
  else if (range === "weekly") { start = new Date(now.getTime() - 12 * 7 * 86400000); unit = "week"; fmt = "%G-W%V"; }
  else if (range === "monthly") { start = new Date(now.getFullYear(), now.getMonth() - 11, 1); unit = "month"; fmt = "%Y-%m"; }
  else { start = new Date(now.getFullYear() - 4, 0, 1); unit = "year"; fmt = "%Y"; }
  void unit;
  const rows = await Order.aggregate([
    { $match: { ...revenueMatch, createdAt: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: fmt, date: "$createdAt", timezone: "Asia/Kolkata" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ label: r._id as string, revenue: r.revenue as number, orders: r.orders as number }));
}

export async function topProducts(limit = 5) {
  return Order.aggregate([
    { $match: revenueMatch },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", name: { $first: "$items.name" }, image: { $first: "$items.image" }, units: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
    { $sort: { units: -1 } },
    { $limit: limit },
  ]);
}

export async function categoryPerformance() {
  return Order.aggregate([
    { $match: revenueMatch },
    { $unwind: "$items" },
    { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "p" } },
    { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "categories", localField: "p.category", foreignField: "_id", as: "c" } },
    { $group: { _id: { $ifNull: [{ $arrayElemAt: ["$c.name", 0] }, "Uncategorised"] }, units: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
    { $sort: { revenue: -1 } },
  ]);
}

export async function customerReport(limit = 20) {
  return Order.aggregate([
    { $match: revenueMatch },
    { $group: { _id: "$customer.email", name: { $first: "$customer.name" }, orders: { $sum: 1 }, spent: { $sum: "$total" }, last: { $max: "$createdAt" } } },
    { $sort: { spent: -1 } },
    { $limit: limit },
  ]);
}

export async function overview(lowThreshold: number) {
  const [rev, totalOrders, products, customers, pending, completed, low, recent] = await Promise.all([
    Order.aggregate([{ $match: revenueMatch }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments({ role: "customer" }),
    Order.countDocuments({ status: { $in: ["pending", "confirmed", "processing"] } }),
    Order.countDocuments({ status: "delivered" }),
    Product.aggregate([{ $unwind: "$variants" }, { $match: { "variants.stock": { $lte: lowThreshold } } }, { $project: { name: 1, sku: "$variants.sku", size: "$variants.size", color: "$variants.color", stock: "$variants.stock" } }, { $sort: { stock: 1 } }, { $limit: 10 }]),
    Order.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  return { revenue: rev[0]?.total ?? 0, totalOrders, products, customers, pending, completed, lowStock: low, recent };
}
