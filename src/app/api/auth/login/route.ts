import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { createSession, verifyPassword } from "@/lib/auth";
import { User } from "@/models";
import { loginSchema } from "@/validations";

export const POST = route(
  async (req) => {
    const { email, password } = await body(req, loginSchema);
    await connectDB();
    const user = await User.findOne({ email }).select("+password");
    // identical error for unknown email / wrong password to avoid account enumeration
    if (!user || !(await verifyPassword(password, user.password))) throw new ApiError(401, "Incorrect email or password");
    if (user.blocked) throw new ApiError(403, "This account has been suspended");
    await createSession(user);
    return ok({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  },
  { limit: 10 },
);
