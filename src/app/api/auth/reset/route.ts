import crypto from "crypto";
import { route, body, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import { User } from "@/models";
import { resetSchema } from "@/validations";

export const POST = route(
  async (req) => {
    const { token, password } = await body(req, resetSchema);
    await connectDB();
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ resetToken: hashed, resetExpires: { $gt: new Date() } }).select("+resetToken +resetExpires");
    if (!user) throw new ApiError(400, "This reset link is invalid or has expired");
    user.password = await hashPassword(password);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();
    return ok({ message: "Password updated. You can now sign in." });
  },
  { limit: 10 },
);
