import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { User } from "@/models";
import { profileSchema } from "@/validations";

export const GET = route(async () => {
  const u = await requireUser();
  return ok({ user: { name: u.name, email: u.email, phone: u.phone } });
});

export const PUT = route(async (req) => {
  const u = await requireUser();
  const d = await body(req, profileSchema);
  await connectDB();
  const doc = await User.findById(u._id).select("+password");
  if (!doc) throw new ApiError(404, "Not found");
  doc.name = d.name;
  doc.phone = d.phone || undefined;
  if (d.newPassword) {
    if (!d.currentPassword || !(await verifyPassword(d.currentPassword, doc.password))) throw new ApiError(400, "Current password is incorrect");
    doc.password = await hashPassword(d.newPassword);
  }
  await doc.save();
  return ok({ user: { name: doc.name, email: doc.email, phone: doc.phone } });
});
