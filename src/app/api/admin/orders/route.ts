import { route, ok, query, paging, escapeRegex } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { Order } from "@/models";
import { toJSON } from "@/utils";
import { expireStaleOrders } from "@/services/orders";
import { revenueMatch } from "@/services/reports";

export const GET = route(async (req) => {
  await requireAdmin();
  await connectDB();
  await expireStaleOrders();
  const sp = query(req);
  const { page, limit, skip } = paging(sp, 20);
  const f: Record<string, unknown> = {};
  const q = sp.get("q")?.trim();
  if (q) f.$or = [{ orderNumber: new RegExp(escapeRegex(q), "i") }, { "customer.name": new RegExp(escapeRegex(q), "i") }, { "customer.email": new RegExp(escapeRegex(q), "i") }, { "customer.phone": new RegExp(escapeRegex(q), "i") }];
  if (sp.get("status")) f.status = sp.get("status");
  if (sp.get("paymentStatus")) f.paymentStatus = sp.get("paymentStatus");
  if (sp.get("method")) f.paymentMethod = sp.get("method");
  const from = sp.get("from"), to = sp.get("to");
  if (from || to) {
    const r: Record<string, Date> = {};
    if (from) r.$gte = new Date(from);
    if (to) r.$lte = new Date(new Date(to).getTime() + 86_399_999);
    f.createdAt = r;
  }
  const sorts: Record<string, Record<string, 1 | -1>> = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, "total-desc": { total: -1 }, "total-asc": { total: 1 } };
  const sort = sorts[sp.get("sort") ?? "newest"] ?? sorts.newest;

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const [items, total, byStatus, rev, today] = await Promise.all([
    Order.find(f).sort(sort).skip(skip).limit(limit).lean(),
    Order.countDocuments(f),
    Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: revenueMatch }, { $group: { _id: null, revenue: { $sum: "$total" }, n: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: startOfToday } } }, { $group: { _id: null, n: { $sum: 1 }, revenue: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "returned"]] }, 0, "$total"] } } } }]),
  ]);
  const counts: Record<string, number> = {};
  let all = 0;
  for (const s of byStatus) { counts[s._id] = s.n; all += s.n; }
  const stats = { all, revenue: rev[0]?.revenue ?? 0, paidOrders: rev[0]?.n ?? 0, todayOrders: today[0]?.n ?? 0, todayRevenue: today[0]?.revenue ?? 0 };
  return ok({ items: toJSON(items), total, page, pages: Math.ceil(total / limit), counts, stats });
});
