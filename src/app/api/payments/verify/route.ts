import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { verifyPaymentSchema } from "@/validations";
import { verifyPaymentSignature, razorpayConfigured } from "@/lib/razorpay";
import { markOrderPaid } from "@/services/orders";

// Client-side "success" is never trusted: the HMAC signature is verified here with the secret key.
export const POST = route(
  async (req) => {
    const d = await body(req, verifyPaymentSchema);
    if (!razorpayConfigured()) throw new ApiError(503, "Payments are not configured");
    await connectDB();
    const order = await Order.findOne({ orderNumber: d.orderNumber, razorpayOrderId: d.razorpay_order_id });
    if (!order) throw new ApiError(404, "Order not found");
    if (!verifyPaymentSignature(d.razorpay_order_id, d.razorpay_payment_id, d.razorpay_signature)) {
      throw new ApiError(400, "Payment verification failed");
    }
    await markOrderPaid(order._id, d.razorpay_payment_id);
    return ok({ orderNumber: order.orderNumber });
  },
  { limit: 20 },
);
