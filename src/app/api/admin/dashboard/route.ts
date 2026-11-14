import { route, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/models";
import { overview, salesSeries, topProducts } from "@/services/reports";
import { expireStaleOrders } from "@/services/orders";
import { toJSON } from "@/utils";

export const GET = route(async () => {
  await requireAdmin();
  await connectDB();
  await expireStaleOrders();
  const s = await getSettings();
  const [o, monthly, top] = await Promise.all([overview(s.lowStockThreshold), salesSeries("monthly"), topProducts(5)]);
  return ok(toJSON({ ...o, monthly, top, threshold: s.lowStockThreshold }));
});
