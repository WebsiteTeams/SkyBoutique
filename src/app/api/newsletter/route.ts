import { route, body, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { Subscriber } from "@/models";
import { newsletterSchema } from "@/validations";

export const POST = route(
  async (req) => {
    const { email } = await body(req, newsletterSchema);
    await connectDB();
    await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    return ok({ message: "Thank you for subscribing!" });
  },
  { limit: 8 },
);
