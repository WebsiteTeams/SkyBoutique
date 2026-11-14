"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, CreditCard, Loader2, MapPin, Package, PackageCheck, PackageOpen, Receipt, SearchX, Star, Truck, XCircle, type LucideIcon } from "lucide-react";
import { api, fmtDateTime, inr, whatsappLink } from "@/utils";
import { useSettings, useToast } from "@/hooks/providers";
import { ErrorState, SmartImage, Skeleton, WhatsAppIcon } from "@/components/common/ui";

export type OrderT = {
  _id: string; orderNumber: string; createdAt: string; status: string; paymentStatus: string; paymentMethod: string;
  customer: { name: string; email: string; phone: string }; shippingAddress: { address: string; city: string; state: string; pincode: string };
  items: { product?: string; name: string; slug: string; image: string; size: string; color: string; price: number; qty: number }[];
  subtotal: number; discount: number; shipping: number; total: number; couponCode?: string; trackingNumber?: string;
  timeline: { status: string; note?: string; at: string }[];
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
};

/** Progress steps shown on the tracker (the first, "Order placed", is always reached). */
const STEPS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "placed", label: "Order placed", icon: Receipt },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "processing", label: "Processing", icon: PackageOpen },
  { key: "shipped", label: "Shipped", icon: Package },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];
const stepIndex = (status: string) => (status === "pending" ? 0 : Math.max(0, STEPS.findIndex((s) => s.key === status)));

export function StatusBadge({ status }: { status: string }) {
  const c = status === "delivered"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    : status === "cancelled" || status === "returned"
    ? "bg-red-50 text-red-700 ring-red-600/20"
    : status === "pending"
    ? "bg-amber-50 text-amber-700 ring-amber-600/20"
    : "bg-[#7A184E]/8 text-[#7A184E] ring-[#7A184E]/20";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${c}`}>{STATUS_LABEL[status] ?? status}</span>;
}

/** Horizontal stepper on tablets/desktops, vertical on phones. */
export function Tracker({ order }: { order: OrderT }) {
  if (["cancelled", "returned"].includes(order.status)) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="status">
        <XCircle size={20} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">This order was {order.status}.</p>
          <p className="mt-0.5 text-sm text-red-700/80">If you have questions, please contact us and quote your order number.</p>
        </div>
      </div>
    );
  }
  const idx = stepIndex(order.status);
  const pct = (idx / (STEPS.length - 1)) * 100;

  return (
    <>
      {/* sm+ : horizontal */}
      <div className="relative hidden sm:block" role="list" aria-label="Order progress">
        <div className="absolute left-[8.33%] right-[8.33%] top-5 h-1 rounded-full bg-neutral-200" aria-hidden />
        <div className="absolute left-[8.33%] top-5 h-1 rounded-full bg-[#7A184E] transition-all duration-700" style={{ width: `${pct * 0.8333}%` }} aria-hidden />
        <ol className="relative grid grid-cols-6">
          {STEPS.map((s, i) => {
            const done = i < idx, current = i === idx, Icon = s.icon;
            return (
              <li key={s.key} className="flex flex-col items-center gap-2.5 text-center" aria-current={current ? "step" : undefined}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${done ? "border-[#7A184E] bg-[#7A184E] text-white" : current ? "border-[#7A184E] bg-white text-[#7A184E] ring-4 ring-[#7A184E]/15" : "border-neutral-200 bg-white text-neutral-300"}`}>
                  {done ? <Check size={18} /> : <Icon size={18} />}
                </span>
                <span className={`px-1 text-xs leading-tight ${done || current ? "font-semibold text-ink" : "text-neutral-400"}`}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* phones : vertical */}
      <ol className="sm:hidden" aria-label="Order progress">
        {STEPS.map((s, i) => {
          const done = i < idx, current = i === idx, Icon = s.icon;
          return (
            <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0" aria-current={current ? "step" : undefined}>
              {i < STEPS.length - 1 && <span className={`absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 ${i < idx ? "bg-[#7A184E]" : "bg-neutral-200"}`} aria-hidden />}
              <span className={`z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${done ? "border-[#7A184E] bg-[#7A184E] text-white" : current ? "border-[#7A184E] bg-white text-[#7A184E] ring-4 ring-[#7A184E]/15" : "border-neutral-200 bg-white text-neutral-300"}`}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </span>
              <span className={`self-center text-sm ${done || current ? "font-semibold text-ink" : "text-neutral-400"}`}>{s.label}{current && <span className="ml-2 rounded-full bg-[#7A184E]/10 px-2 py-0.5 text-[11px] font-medium text-[#7A184E]">Current</span>}</span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Write-a-review box, shown under each item only once the order is delivered. */
function ReviewBox({ productId, name }: { productId: string; name: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await api(`/api/reviews?product=${productId}`, { method: "POST", json: { rating, comment } });
      toast("Thank you for your review!"); setDone(true); setOpen(false);
    } catch (err) { toast((err as Error).message, "err"); }
    setBusy(false);
  };
  if (done) return <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"><Check size={14} /> Review submitted — thank you!</p>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#C5A880] px-4 py-2 text-xs font-semibold text-[#8C6A32] transition hover:bg-[#C5A880]/10"><Star size={13} /> Write a review</button>;
  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-[#EFE8DE] bg-[#FDFBF8] p-4">
      <p className="text-xs font-medium text-neutral-600">How was <b className="text-ink">{name}</b>?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="p-0.5 transition hover:scale-110">
            <Star size={24} className={n <= rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-neutral-300"} />
          </button>
        ))}
      </div>
      <textarea className="input !bg-white" rows={3} maxLength={1500} placeholder="How was the fabric, fit and finish?" value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="flex gap-2">
        <button disabled={busy} className="btn btn-dark !px-5 !py-2.5 text-sm">{busy ? "Submitting…" : "Submit review"}</button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 text-sm text-neutral-500 hover:text-ink">Cancel</button>
      </div>
    </form>
  );
}

const panel = "rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(18,10,30,0.04)]";

export function OrderDetails({ order, onChanged }: { order: OrderT; onChanged?: () => void }) {
  const s = useSettings();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const canCancel = ["pending", "confirmed"].includes(order.status) && order.paymentStatus !== "paid";
  const cancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setBusy(true);
    try { await api(`/api/orders/${order.orderNumber}`, { method: "PATCH", json: { action: "cancel", email: order.customer.email } }); toast("Order cancelled"); onChanged?.(); }
    catch (e) { toast((e as Error).message, "err"); }
    setBusy(false);
  };
  const events = [...(order.timeline ?? [])].reverse();

  return (
    <div className="space-y-5 text-left">
      {/* Summary header */}
      <section className={`${panel} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500">Order number</p>
            <p className="mt-0.5 break-all text-2xl font-semibold tracking-tight text-ink">{order.orderNumber}</p>
            <p className="mt-1 text-sm text-neutral-500">Placed on {fmtDateTime(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium capitalize text-neutral-700">
              <CreditCard size={12} /> {order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"} · {order.paymentStatus.replace("_", " ")}
            </span>
          </div>
        </div>
        {order.trackingNumber && (
          <p className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-[#F6F4F1] px-3.5 py-2.5 text-sm text-neutral-600">
            <Truck size={15} className="text-[#7A184E]" /> Tracking number: <b className="font-semibold text-ink">{order.trackingNumber}</b>
          </p>
        )}
      </section>

      {/* Progress */}
      <section className={`${panel} p-5 sm:p-6`}>
        <h3 className="mb-5 text-base font-semibold text-ink">Delivery progress</h3>
        <Tracker order={order} />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {/* Items */}
          <section className={`${panel} p-5 sm:p-6`}>
            <h3 className="mb-1 text-base font-semibold text-ink">Items in this order <span className="font-normal text-neutral-400">({order.items.length})</span></h3>
            <ul className="divide-y divide-neutral-100">
              {order.items.map((i, k) => (
                <li key={k} className="py-4 text-sm">
                  <div className="flex gap-4">
                  <Link href={`/products/${i.slug}`} className="h-24 w-[4.75rem] shrink-0 overflow-hidden rounded-lg bg-[#F5F1EC]">
                    <SmartImage src={i.image} alt={i.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${i.slug}`} className="line-clamp-2 font-medium leading-snug text-ink hover:text-[#7A184E]">{i.name}</Link>
                    <p className="mt-1 text-xs text-neutral-500">Size {i.size} · {i.color}</p>
                    <p className="mt-1 text-xs text-neutral-500">Qty {i.qty} × {inr(i.price)}</p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{inr(i.price * i.qty)}</span>
                  </div>
                  {order.status === "delivered" && i.product && <ReviewBox productId={i.product} name={i.name} />}
                </li>
              ))}
            </ul>
          </section>

          {/* Updates */}
          {events.length > 0 && (
            <section className={`${panel} p-5 sm:p-6`}>
              <h3 className="mb-4 text-base font-semibold text-ink">Order updates</h3>
              <ol className="space-y-0">
                {events.map((e, k) => (
                  <li key={k} className="relative flex gap-3 pb-5 last:pb-0">
                    {k < events.length - 1 && <span className="absolute left-[5px] top-4 h-[calc(100%-0.5rem)] w-px bg-neutral-200" aria-hidden />}
                    <span className={`z-[1] mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${k === 0 ? "bg-[#7A184E] ring-4 ring-[#7A184E]/15" : "bg-neutral-300"}`} />
                    <div className="min-w-0 text-sm">
                      <p className={k === 0 ? "font-semibold text-ink" : "font-medium text-neutral-700"}>{STATUS_LABEL[e.status] ?? e.status}</p>
                      {e.note && <p className="text-neutral-500">{e.note}</p>}
                      <p className="mt-0.5 text-xs text-neutral-400">{fmtDateTime(e.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <section className={`${panel} p-5 sm:p-6`}>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink"><MapPin size={16} className="text-[#7A184E]" /> Delivery address</h3>
            <p className="text-sm leading-relaxed text-neutral-600">
              <span className="font-medium text-ink">{order.customer.name}</span><br />
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
              {order.customer.phone}
            </p>
          </section>

          <section className={`${panel} p-5 sm:p-6`}>
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink"><Receipt size={16} className="text-[#7A184E]" /> Order summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600"><dt>Subtotal</dt><dd className="tabular-nums">{inr(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between font-medium text-emerald-700"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd className="tabular-nums">-{inr(order.discount)}</dd></div>}
              <div className="flex justify-between text-neutral-600"><dt>Shipping</dt><dd className="tabular-nums">{order.shipping === 0 ? "Free" : inr(order.shipping)}</dd></div>
              <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-semibold text-ink"><dt>Total</dt><dd className="tabular-nums text-[#7A184E]">{inr(order.total)}</dd></div>
            </dl>
            <div className="mt-5 space-y-2.5">
              <Link href={`/invoice/${order.orderNumber}?email=${encodeURIComponent(order.customer.email)}`} target="_blank" className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-[#7A184E]/40 hover:text-[#7A184E]">
                <Receipt size={15} /> View / download invoice
              </Link>
              {canCancel && (
                <button disabled={busy} onClick={cancel} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : "Cancel order"}
                </button>
              )}
              <a href={whatsappLink(s.whatsappNumber, `Hello ${s.storeName}! I need help with order ${order.orderNumber}.`)} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#25D366]/50 bg-[#25D366]/5 px-4 py-2.5 text-sm font-medium text-[#128C4A] transition hover:bg-[#25D366] hover:text-white">
                <WhatsAppIcon size={16} /> Need help? Chat with us
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function OrderViewByNumber({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderT | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => api<{ order: OrderT }>(`/api/orders/${orderNumber}`).then((r) => setOrder(r.order)).catch((e) => setError(e.message)), [orderNumber]);
  useEffect(() => { load(); }, [load]);
  if (error) return <ErrorState message={error} retry={load} />;
  if (!order) return <Skeleton className="h-64 w-full" />;
  return <OrderDetails order={order} onChanged={load} />;
}

export function OrderLoader({ orderNumber, email }: { orderNumber: string; email?: string }) {
  const [order, setOrder] = useState<OrderT | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => api<{ order: OrderT }>(`/api/orders/${orderNumber}${email ? `?email=${encodeURIComponent(email)}` : ""}`).then((r) => setOrder(r.order)).catch((e) => setError(e.message)), [orderNumber, email]);
  useEffect(() => { load(); }, [load]);
  if (error) {
    const notFound = /not found/i.test(error);
    return (
      <div className={`${panel} px-6 py-12 text-center`} role="alert">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"><SearchX size={24} /></span>
        <p className="mt-4 text-base font-semibold text-ink">{notFound ? "We couldn't find that order" : "Something went wrong"}</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-neutral-500">
          {notFound ? "Please check that the order number and the email address match the ones in your confirmation email, then try again." : error}
        </p>
        {!notFound && <button onClick={load} className="btn btn-outline mt-5 !py-2.5">Try again</button>}
      </div>
    );
  }
  if (!order) return <Skeleton className="h-64 w-full rounded-2xl" />;
  return <OrderDetails order={order} onChanged={load} />;
}
