"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "./providers";
import { api } from "@/utils";
import type { PricedLine } from "@/services/pricing";

export type Pricing = {
  items: PricedLine[]; subtotal: number; discount: number; shipping: number; total: number;
  couponApplied: string | null; couponError: string | null; freeShippingAbove: number; hasIssues: boolean; codEnabled: boolean;
};

/** Always asks the server for prices — the client never computes money. */
export function useCartPricing(coupon?: string, enabled = true) {
  const { items, ready } = useCart();
  const [data, setData] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const key = JSON.stringify(items) + "|" + (coupon ?? "");

  const load = useCallback(async () => {
    if (!ready || !enabled) return;
    if (!items.length) { setData(null); setLoading(false); return; }
    const mine = ++seq.current;
    setLoading(true);
    try {
      const r = await api<Pricing>("/api/cart/price", { method: "POST", json: { items, coupon: coupon || undefined } });
      if (mine === seq.current) { setData(r); setError(null); }
    } catch (e) {
      if (mine === seq.current) setError((e as Error).message);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, enabled]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
