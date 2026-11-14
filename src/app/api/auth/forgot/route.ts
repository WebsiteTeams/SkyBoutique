import crypto from "crypto";
import { route, body, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { forgotSchema } from "@/validations";

export const POST = route(
  async (req) => {
    const { email } = await body(req, forgotSchema);
    await connectDB();
    const user = await User.findOne({ email });
    let devResetUrl: string | undefined;
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.resetToken = crypto.createHash("sha256").update(token).digest("hex");
      user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const url = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password?token=${token}`;
      // TODO(deploy): plug an email provider (Resend / SES / SMTP) here. Until then the link is logged server-side.
      console.log(`[password-reset] ${email}: ${url}`);
      if (process.env.NODE_ENV !== "production") devResetUrl = url;
    }
    // Same response whether or not the account exists
    return ok({ message: "If an account exists for that email, a reset link has been sent.", devResetUrl });
  },
  { limit: 5 },
);
