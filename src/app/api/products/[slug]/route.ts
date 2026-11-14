import { route, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { getProductBySlug } from "@/services/catalog";

export const GET = route(async (_req, ctx) => {
  const { slug } = await ctx.params;
  await connectDB();
  const p = await getProductBySlug(slug);
  if (!p) throw new ApiError(404, "Product not found");
  return ok({ product: p });
});
