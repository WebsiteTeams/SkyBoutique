import { z } from "zod";
import { route, body, ok, query, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { Order } from "@/models";
import { releaseOrderStock } from "@/services/orders";

async function load(orderNumber: string, email: string | null) {
  await connectDB();
  const order = await Order.findOne({ orderNumber });
  if (!order) throw new ApiError(404, "Order not found");
  const s = await getSession();
  const owner = s && order.user && String(order.user) === s.id;
  const emailMatch = !!email && email.trim().toLowerCase() === order.customer?.email;
  if (!owner && !emailMatch && s?.role !== "admin") throw new ApiError(404, "Order not found");
  return order;
}

// Owner (signed in) or anyone who knows the order number AND the email on it (guest tracking).
export const GET = route(async (req, ctx) => {
  const { orderNumber } = await ctx.params;
  const order = await load(orderNumber, query(req).get("email"));
  return ok({ order: JSON.parse(JSON.stringify(order)) });
}, { limit: 30 });

// Customer-initiated cancellation: only before the order is shipped, and only if unpaid or COD.
export const PATCH = route(async (req, ctx) => {
  const { orderNumber } = await ctx.params;
  const { email } = await body(req, z.object({ action: z.literal("cancel"), email: z.string().optional() }).transform((v) => ({ email: v.email ?? null })));
  const order = await load(orderNumber, email);
  const cancellable = ["pending", "confirmed"].includes(order.status);
  if (!cancellable) throw new ApiError(400, "This order can no longer be cancelled online. Please contact support.");
  if (order.paymentStatus === "paid") throw new ApiError(400, "This order is already paid. Please contact support to cancel and refund.");
  const r = await Order.updateOne(
    { _id: order._id, status: { $in: ["pending", "confirmed"] } },
    { $set: { status: "cancelled", paymentStatus: order.paymentStatus === "pending" ? "failed" : order.paymentStatus }, $push: { timeline: { status: "cancelled", note: "Cancelled by customer", at: new Date() } } },
  );
  if (r.modifiedCount) await releaseOrderStock(order._id, "cancel", "Cancelled by customer");
  return ok();
});
