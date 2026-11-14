import { z } from "zod";
import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { User, Order, Address } from "@/models";
import { toJSON } from "@/utils";

export const GET = route(async (_req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user) throw new ApiError(404, "Customer not found");
  const [orders, addresses] = await Promise.all([Order.find({ user: id }).sort({ createdAt: -1 }).limit(100).lean(), Address.find({ user: id }).lean()]);
  const spent = orders.filter((o) => !["cancelled", "returned"].includes(o.status)).reduce((s, o) => s + (o.total ?? 0), 0);
  return ok({ user: toJSON(user), orders: toJSON(orders), addresses: toJSON(addresses), spent });
});

export const PATCH = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { blocked } = await body(req, z.object({ blocked: z.boolean() }));
  if (String(admin._id) === id) throw new ApiError(400, "You cannot block yourself");
  await connectDB();
  await User.updateOne({ _id: id, role: "customer" }, { blocked });
  return ok();
});
