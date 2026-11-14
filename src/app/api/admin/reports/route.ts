/* eslint-disable @typescript-eslint/no-explicit-any */
import { route, ok, query } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { Order } from "@/models";
import { salesSeries, topProducts, categoryPerformance, customerReport, type Range } from "@/services/reports";

const csvCell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

export const GET = route(async (req) => {
  await requireAdmin();
  await connectDB();
  const sp = query(req);

  if (sp.get("format") === "csv") {
    const f: Record<string, unknown> = {};
    if (sp.get("from") || sp.get("to")) {
      f.createdAt = { ...(sp.get("from") ? { $gte: new Date(sp.get("from")!) } : {}), ...(sp.get("to") ? { $lte: new Date(new Date(sp.get("to")!).getTime() + 86_399_999) } : {}) };
    }
    if (sp.get("status")) f.status = sp.get("status");
    const orders = await Order.find(f).sort({ createdAt: -1 }).limit(10000).lean();
    const head = ["Order No", "Date", "Customer", "Email", "Phone", "City", "State", "PIN", "Items", "Subtotal", "Discount", "Shipping", "Total", "Coupon", "Payment Method", "Payment Status", "Order Status"];
    const lines = orders.map((o) =>
      [o.orderNumber, new Date(o.createdAt).toISOString(), o.customer?.name, o.customer?.email, o.customer?.phone, o.shippingAddress?.city, o.shippingAddress?.state, o.shippingAddress?.pincode,
        o.items.map((i: any) => `${i.name} (${i.size}/${i.color}) x${i.qty}`).join("; "), o.subtotal, o.discount, o.shipping, o.total, o.couponCode, o.paymentMethod, o.paymentStatus, o.status].map(csvCell).join(","),
    );
    return new Response("﻿" + [head.map(csvCell).join(","), ...lines].join("\r\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"` },
    });
  }

  const range = (["daily", "weekly", "monthly", "yearly"].includes(sp.get("range") ?? "") ? sp.get("range") : "monthly") as Range;
  const [series, top, categories, customers] = await Promise.all([salesSeries(range), topProducts(10), categoryPerformance(), customerReport(15)]);
  return ok(JSON.parse(JSON.stringify({ series, top, categories, customers })));
});
