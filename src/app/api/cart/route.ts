import { z } from "zod";
import { route, body, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { Cart } from "@/models";
import { cartLineSchema } from "@/validations";

// Persisted cart for signed-in customers. Guests keep their cart in localStorage.
export const GET = route(async () => {
  const u = await requireUser();
  const cart = await Cart.findOne({ user: u._id }).lean();
  return ok({ items: cart?.items ?? [] });
});

export const PUT = route(async (req) => {
  const u = await requireUser();
  const { items } = await body(req, z.object({ items: z.array(cartLineSchema).max(50) }));
  await Cart.findOneAndUpdate({ user: u._id }, { items }, { upsert: true });
  return ok();
});
