import { route, body, ok, paging, query } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { getSession, requireUser } from "@/lib/auth";
import { Order } from "@/models";
import { checkoutSchema } from "@/validations";
import { createOrder, expireStaleOrders } from "@/services/orders";
import { razorpayConfigured } from "@/lib/razorpay";

export const POST = route(
  async (req) => {
    const data = await body(req, checkoutSchema);
    await connectDB();
    await expireStaleOrders();
    const session = await getSession(); // guest checkout allowed
    const { order, razorpayOrderId } = await createOrder({ ...data, userId: session?.id });
    return ok(
      {
        orderNumber: order.orderNumber,
        total: order.total,
        paymentMethod: order.paymentMethod,
        razorpay: razorpayOrderId
          ? { orderId: razorpayOrderId, amount: Math.round(order.total! * 100), keyId: process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID }
          : null,
      },
      201,
    );
  },
  { limit: 15 },
);

export const GET = route(async (req) => {
  const u = await requireUser();
  await connectDB();
  const { page, limit, skip } = paging(query(req), 10);
  const [items, total] = await Promise.all([
    Order.find({ user: u._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments({ user: u._id }),
  ]);
  return ok({ items: JSON.parse(JSON.stringify(items)), total, page, pages: Math.ceil(total / limit), razorpay: razorpayConfigured() });
});
