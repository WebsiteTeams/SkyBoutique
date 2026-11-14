import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { Order } from "@/models";
import { orderUpdateSchema } from "@/validations";
import { releaseOrderStock } from "@/services/orders";
import { toJSON } from "@/utils";

export const GET = route(async (_req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  await connectDB();
  const o = await Order.findById(id).lean();
  if (!o) throw new ApiError(404, "Order not found");
  return ok({ item: toJSON(o) });
});

export const PATCH = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const d = await body(req, orderUpdateSchema);
  await connectDB();
  const o = await Order.findById(id);
  if (!o) throw new ApiError(404, "Order not found");

  const prev = o.status;
  if (d.status && d.status !== prev) {
    if (["cancelled", "returned"].includes(prev)) throw new ApiError(400, `A ${prev} order cannot be changed`);
    o.status = d.status;
    o.timeline.push({ status: d.status, note: d.note || undefined, at: new Date() });
    if (d.status === "delivered" && o.paymentMethod === "cod") o.paymentStatus = "paid"; // COD collected on delivery
    if (d.status === "cancelled") {
      if (o.paymentStatus === "paid") o.paymentStatus = "refund_pending";
      else if (o.paymentStatus === "pending") o.paymentStatus = "failed";
    }
    if (d.status === "returned" && o.paymentStatus === "paid") o.paymentStatus = "refund_pending";
  }
  if (d.paymentStatus) o.paymentStatus = d.paymentStatus;
  if (d.trackingNumber !== undefined) o.trackingNumber = d.trackingNumber;
  if (d.refundAmount !== undefined) { o.refundAmount = d.refundAmount; o.refundNote = d.note; }
  await o.save();

  if (d.status === "cancelled" && prev !== "cancelled") await releaseOrderStock(o._id, "cancel", "Cancelled by admin", admin._id);
  if (d.status === "returned" && prev !== "returned") await releaseOrderStock(o._id, "return", "Returned by customer", admin._id);
  return ok({ item: toJSON(await Order.findById(id).lean()) });
});
