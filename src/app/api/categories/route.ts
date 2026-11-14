import { route, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { getCategories } from "@/services/catalog";

export const GET = route(async () => {
  await connectDB();
  return ok({ items: await getCategories() });
});
