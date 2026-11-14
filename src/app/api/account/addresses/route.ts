import { route, body, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { Address } from "@/models";
import { addressSchema } from "@/validations";
import { toJSON } from "@/utils";

export const GET = route(async () => {
  const u = await requireUser();
  await connectDB();
  return ok({ items: toJSON(await Address.find({ user: u._id }).sort({ isDefault: -1, createdAt: -1 }).lean()) });
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const d = await body(req, addressSchema);
  await connectDB();
  if (await Address.countDocuments({ user: u._id }) >= 10) return ok({ error: "You can save up to 10 addresses" }, 400);
  if (d.isDefault) await Address.updateMany({ user: u._id }, { isDefault: false });
  const a = await Address.create({ ...d, user: u._id });
  return ok({ item: toJSON(a) }, 201);
});
