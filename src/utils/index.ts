export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const discountPct = (regular: number, sale?: number | null) =>
  sale && sale < regular ? Math.round(((regular - sale) / regular) * 100) : 0;
export const effectivePrice = (p: { price: number; salePrice?: number | null }) =>
  p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
export const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data as T;
}

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export const toJSON = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
