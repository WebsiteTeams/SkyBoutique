import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { Address } from "@/models";
import { addressSchema } from "@/validations";

export const PUT = route(async (req, ctx) => {
  const u = await requireUser();
  const { id } = await ctx.params;
  const d = await body(req, addressSchema);
  await connectDB();
  if (d.isDefault) await Address.updateMany({ user: u._id }, { isDefault: false });
  const a = await Address.findOneAndUpdate({ _id: id, user: u._id }, d, { returnDocument: "after" });
  if (!a) throw new ApiError(404, "Address not found");
  return ok();
});

export const DELETE = route(async (_req, ctx) => {
  const u = await requireUser();
  const { id } = await ctx.params;
  await connectDB();
  await Address.deleteOne({ _id: id, user: u._id });
  return ok();
});
