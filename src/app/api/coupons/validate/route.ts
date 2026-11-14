import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { priceCart } from "@/services/pricing";
import { pricingSchema } from "@/validations";

export const POST = route(
  async (req) => {
    const { items, coupon } = await body(req, pricingSchema);
    if (!coupon) throw new ApiError(400, "Enter a coupon code");
    await connectDB();
    const r = await priceCart(items, coupon);
    if (r.couponError) throw new ApiError(400, r.couponError);
    return ok({ code: r.couponApplied, discount: r.discount });
  },
  { limit: 20 },
);
