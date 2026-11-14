/* eslint-disable @typescript-eslint/no-explicit-any */
import { Order, Product, Coupon, InventoryLog, Payment } from "@/models";
import { ApiError } from "@/lib/api";
import { priceCart, validateCoupon, type Line } from "./pricing";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";
import { getSettings } from "@/models";
import type { Types } from "mongoose";

function newOrderNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `SKY-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

type Reserved = { productId: string; sku: string; qty: number };

/** Atomically decrement stock only when enough exists. Rolls back already-reserved lines on failure. */
async function reserveStock(lines: Reserved[], ref: string) {
  const done: Reserved[] = [];
  try {
    for (const l of lines) {
      const res = await Product.findOneAndUpdate(
        { _id: l.productId, variants: { $elemMatch: { sku: l.sku, stock: { $gte: l.qty } } } },
        { $inc: { "variants.$[v].stock": -l.qty, soldCount: l.qty } },
        { arrayFilters: [{ "v.sku": l.sku }], returnDocument: "before" },
      );
      if (!res) throw new ApiError(409, "Some items just sold out or have limited stock. Please review your cart.");
      const before = res.variants.find((v: any) => v.sku === l.sku)!.stock;
      done.push(l);
      await InventoryLog.create({ product: res._id, productName: res.name, sku: l.sku, change: -l.qty, before, after: before - l.qty, reason: "order", ref });
    }
  } catch (e) {
    await restoreStock(done, ref, "cancel", "Rolled back failed order");
    throw e;
  }
}

export async function restoreStock(lines: Reserved[], ref: string, reason: "cancel" | "return", note: string, by?: unknown) {
  for (const l of lines) {
    const res = await Product.findOneAndUpdate(
      { _id: l.productId, "variants.sku": l.sku },
      { $inc: { "variants.$[v].stock": l.qty, soldCount: -l.qty } },
      { arrayFilters: [{ "v.sku": l.sku }], returnDocument: "before" },
    );
    if (!res) continue;
    const before = res.variants.find((v: any) => v.sku === l.sku)!.stock;
    await InventoryLog.create({ product: res._id, productName: res.name, sku: l.sku, change: l.qty, before, after: before + l.qty, reason, ref, note, by });
  }
}

export async function createOrder(input: {
  userId?: string;
  items: Line[];
  coupon?: string;
  paymentMethod: "razorpay" | "cod";
  customer: { name: string; email: string; phone: string };
  shippingAddress: { address: string; city: string; state: string; pincode: string };
}) {
  const settings = await getSettings();
  if (input.paymentMethod === "cod" && !settings.codEnabled) throw new ApiError(400, "Cash on Delivery is currently unavailable");
  if (input.paymentMethod === "razorpay" && !razorpayConfigured()) throw new ApiError(503, "Online payments are not configured yet. Please choose Cash on Delivery.");

  const priced = await priceCart(input.items, input.coupon);
  if (priced.items.length === 0 || priced.hasIssues) throw new ApiError(409, "Some items in your cart are unavailable. Please review your cart.");
  if (input.coupon && priced.couponError) throw new ApiError(400, priced.couponError);

  const orderNumber = newOrderNumber();
  const lines: Reserved[] = priced.items.map((i) => ({ productId: i.productId, sku: i.sku, qty: i.qty }));

  // Coupon usage: atomic increment respecting the limit
  if (priced.couponApplied) {
    const { coupon } = await validateCoupon(priced.couponApplied, priced.subtotal);
    const upd = await Coupon.updateOne(
      { _id: coupon._id, $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
      { $inc: { usedCount: 1 } },
    );
    if (!upd.modifiedCount) throw new ApiError(400, "This coupon has reached its usage limit");
  }

  let reserved = false;
  try {
    await reserveStock(lines, orderNumber); // rolls back its own partial reservations on failure
    reserved = true;
    let rzp: { id: string } | null = null;
    if (input.paymentMethod === "razorpay") rzp = await createRazorpayOrder(priced.total, orderNumber);

    const order = await Order.create({
      orderNumber,
      user: input.userId,
      customer: input.customer,
      shippingAddress: input.shippingAddress,
      items: priced.items.map((i) => ({ product: i.productId, name: i.name, slug: i.slug, image: i.image, sku: i.sku, size: i.size, color: i.color, price: i.price, qty: i.qty })),
      subtotal: priced.subtotal,
      discount: priced.discount,
      shipping: priced.shipping,
      total: priced.total,
      couponCode: priced.couponApplied ?? undefined,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      status: input.paymentMethod === "cod" ? "confirmed" : "pending",
      razorpayOrderId: rzp?.id,
      timeline: [{ status: input.paymentMethod === "cod" ? "confirmed" : "pending", note: "Order placed", at: new Date() }],
    });
    await Payment.create({ order: order._id, method: input.paymentMethod, amount: priced.total, razorpayOrderId: rzp?.id });
    return { order, razorpayOrderId: rzp?.id ?? null };
  } catch (e) {
    // only give stock back if it was actually reserved (reserveStock already rolled back its own failures)
    if (reserved) await restoreStock(lines, orderNumber, "cancel", "Order creation failed");
    if (priced.couponApplied) await Coupon.updateOne({ code: priced.couponApplied }, { $inc: { usedCount: -1 } });
    throw e;
  }
}

/** Release reserved stock exactly once (idempotent via stockReleased flag). */
export async function releaseOrderStock(orderId: Types.ObjectId | string, reason: "cancel" | "return", note: string, by?: unknown) {
  const o = await Order.findOneAndUpdate({ _id: orderId, stockReleased: false }, { $set: { stockReleased: true } }, { returnDocument: "after" });
  if (!o) return;
  await restoreStock(o.items.map((i: any) => ({ productId: String(i.product), sku: i.sku!, qty: i.qty! })), o.orderNumber, reason, note, by);
  if (o.couponCode) await Coupon.updateOne({ code: o.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

/** Release stock held by online-payment orders that were never paid (customer abandoned checkout). */
export async function expireStaleOrders(minutes = 30) {
  const cutoff = new Date(Date.now() - minutes * 60_000);
  const stale = await Order.find({ paymentMethod: "razorpay", paymentStatus: "pending", status: "pending", createdAt: { $lt: cutoff } }).limit(50);
  for (const o of stale) {
    const r = await Order.updateOne({ _id: o._id, status: "pending", paymentStatus: "pending" }, { $set: { status: "cancelled", paymentStatus: "failed" }, $push: { timeline: { status: "cancelled", note: "Payment not completed", at: new Date() } } });
    if (r.modifiedCount) await releaseOrderStock(o._id, "cancel", "Payment not completed");
  }
}

export async function markOrderPaid(orderId: Types.ObjectId | string, paymentId: string) {
  const o = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: "paid" } },
    { $set: { paymentStatus: "paid", status: "confirmed" }, $push: { timeline: { status: "confirmed", note: "Payment received", at: new Date() } } },
    { returnDocument: "after" },
  );
  if (o) await Payment.updateOne({ order: o._id }, { $set: { status: "paid", razorpayPaymentId: paymentId } });
  return o;
}
