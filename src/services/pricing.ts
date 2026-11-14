/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { Product, Coupon, getSettings } from "@/models";
import { ApiError } from "@/lib/api";
import { effectivePrice } from "@/utils";

export type Line = { productId: string; sku: string; qty: number };

export type PricedLine = {
  productId: string;
  sku: string;
  qty: number;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  price: number;
  regularPrice: number;
  stock: number;
  available: boolean;
  issue?: string;
};

export async function validateCoupon(code: string, subtotal: number) {
  const c = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!c || !c.active) throw new ApiError(400, "Invalid coupon code");
  if (c.expiresAt && c.expiresAt < new Date()) throw new ApiError(400, "This coupon has expired");
  if (c.usageLimit && c.usedCount >= c.usageLimit) throw new ApiError(400, "This coupon has reached its usage limit");
  if (subtotal < c.minOrder) throw new ApiError(400, `Minimum order of ₹${c.minOrder} required for this coupon`);
  let discount = c.type === "percent" ? (subtotal * c.value) / 100 : c.value;
  if (c.type === "percent" && c.maxDiscount > 0) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(Math.round(discount), subtotal);
  return { coupon: c, discount };
}

/** The ONLY place prices are computed. Client-supplied prices are never trusted. */
export async function priceCart(lines: Line[], couponCode?: string) {
  const ids = [...new Set(lines.map((l) => l.productId))].filter((id) => Types.ObjectId.isValid(id));
  const products = await Product.find({ _id: { $in: ids }, published: true });
  const map = new Map(products.map((p) => [String(p._id), p]));
  const settings = await getSettings();

  // merge duplicate lines
  const merged = new Map<string, Line>();
  for (const l of lines) {
    const k = `${l.productId}:${l.sku}`;
    const prev = merged.get(k);
    merged.set(k, prev ? { ...prev, qty: Math.min(20, prev.qty + l.qty) } : { ...l });
  }

  const items: PricedLine[] = [];
  for (const l of merged.values()) {
    const p = map.get(l.productId);
    const v = p?.variants.find((x: any) => x.sku === l.sku.toUpperCase());
    if (!p || !v) {
      items.push({ productId: l.productId, sku: l.sku, qty: l.qty, name: "Unavailable item", slug: "", image: "", size: "", color: "", price: 0, regularPrice: 0, stock: 0, available: false, issue: "This item is no longer available" });
      continue;
    }
    const price = effectivePrice(p);
    const available = v.stock >= l.qty;
    items.push({
      productId: String(p._id), sku: v.sku, qty: l.qty, name: p.name, slug: p.slug, image: p.images[0] ?? "", size: v.size, color: v.color,
      price, regularPrice: p.price, stock: v.stock, available,
      issue: v.stock <= 0 ? "Out of stock" : available ? undefined : `Only ${v.stock} left`,
    });
  }

  const valid = items.filter((i) => i.available);
  const subtotal = valid.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  let couponApplied: string | null = null;
  let couponError: string | null = null;
  if (couponCode) {
    try {
      const r = await validateCoupon(couponCode, subtotal);
      discount = r.discount;
      couponApplied = r.coupon.code;
    } catch (e) {
      couponError = e instanceof ApiError ? e.message : "Invalid coupon";
    }
  }
  const afterDiscount = subtotal - discount;
  const { flatRate, freeAbove } = settings.shipping!;
  const shipping = valid.length === 0 || afterDiscount >= freeAbove ? 0 : flatRate;
  const total = afterDiscount + shipping;
  return {
    items, subtotal, discount, shipping, total, couponApplied, couponError,
    freeShippingAbove: freeAbove,
    hasIssues: items.some((i) => !i.available),
    codEnabled: settings.codEnabled,
  };
}
