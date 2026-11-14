"use client";
import { useEffect, useState } from "react";

const KEY = "sky_coupon_v1";

/** Coupon code carried between cart and checkout. It is only a *code* — the discount is always computed by the server. */
export function useCoupon(): [string, (c: string) => void] {
  const [code, setCode] = useState("");
  useEffect(() => { try { setCode(sessionStorage.getItem(KEY) || ""); } catch {} }, []);
  const update = (c: string) => {
    setCode(c);
    try { c ? sessionStorage.setItem(KEY, c) : sessionStorage.removeItem(KEY); } catch {}
  };
  return [code, update];
}
