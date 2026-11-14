import { route, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export const GET = route(async () => {
  const u = await getCurrentUser();
  return ok({ user: u ? { id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role } : null });
});
