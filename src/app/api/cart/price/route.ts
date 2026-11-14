import { route, body, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { priceCart } from "@/services/pricing";
import { pricingSchema } from "@/validations";

export const POST = route(async (req) => {
  const { items, coupon } = await body(req, pricingSchema);
  await connectDB();
  return ok(await priceCart(items, coupon));
});
