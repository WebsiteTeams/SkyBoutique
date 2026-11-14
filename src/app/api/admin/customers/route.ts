import { route, ok, query, paging, escapeRegex } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { User, Order } from "@/models";
import { toJSON } from "@/utils";

export const GET = route(async (req) => {
  await requireAdmin();
  await connectDB();
  const sp = query(req);
  const { page, limit, skip } = paging(sp, 20);
  const f: Record<string, unknown> = { role: "customer" };
  const q = sp.get("q")?.trim();
  if (q) f.$or = [{ name: new RegExp(escapeRegex(q), "i") }, { email: new RegExp(escapeRegex(q), "i") }, { phone: new RegExp(escapeRegex(q), "i") }];
  const [users, total] = await Promise.all([User.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(f)]);
  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $nin: ["cancelled", "returned"] } } },
    { $group: { _id: "$user", orders: { $sum: 1 }, spent: { $sum: "$total" } } },
  ]);
  const sm = new Map(stats.map((s) => [String(s._id), s]));
  const items = users.map((u) => ({ ...u, orders: sm.get(String(u._id))?.orders ?? 0, spent: sm.get(String(u._id))?.spent ?? 0 }));
  return ok({ items: toJSON(items), total, page, pages: Math.ceil(total / limit) });
});
