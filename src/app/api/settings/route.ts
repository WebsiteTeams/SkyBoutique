import { route, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { getPublicSettings } from "@/services/settings";

export const GET = route(async () => {
  await connectDB();
  return ok(await getPublicSettings());
});
