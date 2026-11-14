import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { createSession, hashPassword } from "@/lib/auth";
import { User } from "@/models";
import { registerSchema } from "@/validations";

export const POST = route(
  async (req) => {
    const data = await body(req, registerSchema);
    await connectDB();
    if (await User.exists({ email: data.email })) throw new ApiError(409, "An account with this email already exists");
    const user = await User.create({ name: data.name, email: data.email, phone: data.phone || undefined, password: await hashPassword(data.password) });
    await createSession(user);
    return ok({ user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 201);
  },
  { limit: 10 },
);
