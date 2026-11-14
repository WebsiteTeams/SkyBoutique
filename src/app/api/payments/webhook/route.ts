import { route, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/services/orders";

// Safety net for customers who close the tab after paying. Configure RAZORPAY_WEBHOOK_SECRET.
export const POST = route(
  async (req) => {
    const raw = await req.text();
    const sig = req.headers.get("x-razorpay-signature") ?? "";
    if (!verifyWebhookSignature(raw, sig)) throw new ApiError(400, "Invalid signature");
    const event = JSON.parse(raw);
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const pay = event.payload?.payment?.entity;
      if (pay?.order_id) {
        await connectDB();
        const order = await Order.findOne({ razorpayOrderId: pay.order_id });
        if (order) await markOrderPaid(order._id, pay.id);
      }
    }
    return ok();
  },
  { skipOrigin: true, limit: 120 },
);
