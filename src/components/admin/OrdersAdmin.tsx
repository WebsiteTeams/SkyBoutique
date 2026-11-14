"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Check, ChevronLeft, ChevronRight, Clock, Copy, CreditCard, Download, IndianRupee, Loader2, Mail, MapPin, PackageCheck, Phone, Printer, ReceiptText, Truck, X, XCircle } from "lucide-react";
import { api, fmtDateTime, inr, whatsappLink } from "@/utils";
import { useToast } from "@/hooks/providers";
import { Badge, SearchBox, Stat, useList } from "./kit";
import { StatusBadge, STATUS_LABEL, type OrderT } from "@/components/checkout/OrderView";
import { EmptyState, SmartImage, Skeleton, WhatsAppIcon } from "@/components/common/ui";

type O = OrderT & { refundAmount?: number; refundNote?: string };
type Counts = Record<string, number>;
type Stats = { all: number; revenue: number; paidOrders: number; todayOrders: number; todayRevenue: number };

const STATUSES = Object.keys(STATUS_LABEL);
const PAY = ["pending", "paid", "failed", "refund_pending", "refunded"];
const FLOW = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];
const NEXT: Record<string, { to: string; label: string }> = {
  pending: { to: "confirmed", label: "Confirm order" }, confirmed: { to: "processing", label: "Start processing" }, processing: { to: "shipped", label: "Mark as shipped" },
  shipped: { to: "out_for_delivery", label: "Out for delivery" }, out_for_delivery: { to: "delivered", label: "Mark delivered" },
};
const PRESETS = [["", "All time"], ["today", "Today"], ["7", "7 days"], ["30", "30 days"]] as const;

const ymd = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const ago = (d: string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
const waPhone = (p: string) => { const d = p.replace(/\D/g, ""); return d.length === 10 ? "91" + d : d; };

function PayChip({ o }: { o: O }) {
  const tone = o.paymentStatus === "paid" ? "green" : o.paymentStatus === "pending" ? "amber" : o.paymentStatus === "refunded" ? "purple" : "red";
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge tone={tone}>{o.paymentStatus.replace("_", " ")}</Badge>
      <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-neutral-500">{o.paymentMethod === "cod" ? <Banknote size={12} /> : <CreditCard size={12} />}{o.paymentMethod === "cod" ? "COD" : "Online"}</span>
    </div>
  );
}

function Thumbs({ o }: { o: O }) {
  const shown = o.items.slice(0, 3);
  return (
    <div className="flex items-center">
      <div className="flex -space-x-3">{shown.map((i, k) => <div key={k} className="h-11 w-9 overflow-hidden rounded-md border-2 border-white bg-lavender shadow-sm"><SmartImage src={i.image} alt="" className="h-full w-full" /></div>)}</div>
      <span className="ml-3 text-xs text-neutral-500">{o.items.reduce((s, i) => s + i.qty, 0)} item{o.items.reduce((s, i) => s + i.qty, 0) > 1 ? "s" : ""}</span>
    </div>
  );
}

function Block({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-t border-neutral-100 px-4 py-4 sm:px-6 sm:py-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">{title}</h3>{action}</div>{children}</section>
  );
}

/* ------------------------- detail panel ------------------------- */
function OrderPanel({ order, onClose, onChanged }: { order: O; onClose: () => void; onChanged: (o: O) => void }) {
  const { toast } = useToast();
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [note, setNote] = useState("");
  const [refund, setRefund] = useState(String(order.refundAmount || order.total));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);

  const final = ["cancelled", "returned"].includes(order.status);
  const next = NEXT[order.status];
  const idx = FLOW.indexOf(order.status);
  const dirty = status !== order.status || tracking !== (order.trackingNumber ?? "") || note.trim() !== "";

  const patch = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try {
      const r = await api<{ item: O }>(`/api/admin/orders/${order._id}`, { method: "PATCH", json: body });
      toast(msg); onChanged(r.item); setStatus(r.item.status); setNote("");
    } catch (e) { toast((e as Error).message, "err"); }
    setBusy(false);
  };
  const copy = (t: string, m: string) => navigator.clipboard?.writeText(t).then(() => toast(m)).catch(() => toast("Could not copy", "err"));
  const addr = `${order.customer.name}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}. Ph: ${order.customer.phone}`;
  const waMsg = `Hello ${order.customer.name.split(" ")[0]}, this is an update on your SKY BOUTIQUE order ${order.orderNumber}: it is now ${STATUS_LABEL[order.status]?.toLowerCase()}.${order.trackingNumber ? ` Tracking: ${order.trackingNumber}.` : ""} Thank you!`;

  return (
    <motion.div className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="absolute inset-0 bg-[#120A1E]/55 backdrop-blur-[2px]" onClick={onClose} />
      <motion.aside role="dialog" aria-modal aria-label={`Order ${order.orderNumber}`} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }}
        className="absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col bg-white shadow-2xl">
        {/* header */}
        <header className="flex items-start justify-between gap-4 bg-[#120A1E] px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] text-white sm:px-6 sm:py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Order</p>
            <div className="mt-1 flex items-center gap-2"><h2 className="break-all font-display text-2xl leading-none sm:text-3xl">{order.orderNumber}</h2>
              <button onClick={() => copy(order.orderNumber, "Order number copied")} aria-label="Copy order number" className="rounded p-1.5 text-white/60 hover:bg-white/10 hover:text-white"><Copy size={14} /></button></div>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60"><span className="flex items-center gap-1"><Clock size={12} /> {fmtDateTime(order.createdAt)}</span><StatusBadge status={order.status} /></p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* progress */}
          <section className="px-4 py-5 sm:px-6 sm:py-6">
            {final ? (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"><XCircle size={18} /> This order was <b>{order.status}</b>{order.paymentStatus === "refund_pending" && ". A refund is pending."}</div>
            ) : (
              <ol className="relative grid grid-cols-6 gap-1 text-center">
                <div aria-hidden className="absolute left-[8.33%] right-[8.33%] top-[13px] h-0.5 bg-neutral-200"><div className="h-full bg-gradient-to-r from-[#7A184E] to-[#D4AF37] transition-all duration-500" style={{ width: `${(Math.max(idx, 0) / 5) * 100}%` }} /></div>
                {FLOW.map((s, i) => (
                  <li key={s} className="relative flex flex-col items-center gap-1.5">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] ${i < idx ? "border-[#7A184E] bg-[#7A184E] text-white" : i === idx ? "border-[#D4AF37] bg-white text-[#7A184E] ring-4 ring-[#D4AF37]/20" : "border-neutral-200 bg-white text-neutral-300"}`}>{i < idx ? <Check size={13} /> : i + 1}</span>
                    <span className={`hidden text-[10px] font-medium uppercase leading-tight tracking-wide sm:block ${i <= idx ? "text-[#120A1E]" : "text-neutral-400"}`}>{STATUS_LABEL[s]}</span>
                  </li>
                ))}
              </ol>
            )}
            {!final && <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#7A184E] sm:hidden">{STATUS_LABEL[order.status]}</p>}
            {next && !final && (
              <button disabled={busy} onClick={() => patch({ status: next.to }, `Order ${STATUS_LABEL[next.to].toLowerCase()}`)} className="btn btn-primary mt-6 w-full !rounded-lg !py-3.5">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />} {next.label}
              </button>
            )}
          </section>

          <Block title="Customer" action={<div className="flex gap-1">
            <a href={`tel:${order.customer.phone}`} aria-label="Call" className="rounded-lg border p-2 text-neutral-600 hover:bg-neutral-50"><Phone size={14} /></a>
            <a href={`mailto:${order.customer.email}`} aria-label="Email" className="rounded-lg border p-2 text-neutral-600 hover:bg-neutral-50"><Mail size={14} /></a>
            <a href={whatsappLink(waPhone(order.customer.phone), waMsg)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp the customer" className="rounded-lg border border-[#25D366]/40 p-2 text-[#128C4A] hover:bg-[#25D366]/10"><WhatsAppIcon size={14} /></a></div>}>
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7A184E] text-sm font-semibold text-white">{initials(order.customer.name)}</span>
              <div className="text-sm"><p className="font-medium text-[#120A1E]">{order.customer.name}</p><p className="text-neutral-500">{order.customer.email} · {order.customer.phone}</p></div></div>
          </Block>

          <Block title="Delivery address" action={<button onClick={() => copy(addr, "Address copied")} className="flex items-center gap-1 text-xs text-[#7A184E] hover:underline"><Copy size={12} /> Copy</button>}>
            <p className="flex gap-3 text-sm text-neutral-700"><MapPin size={16} className="mt-0.5 shrink-0 text-[#8C6A32]" />{order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
          </Block>

          <Block title={`Items (${order.items.reduce((s, i) => s + i.qty, 0)})`}>
            <ul className="divide-y divide-neutral-100">
              {order.items.map((i, k) => (
                <li key={k} className="flex gap-4 py-3 text-sm first:pt-0">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-lavender"><SmartImage src={i.image} alt="" className="h-full w-full" /></div>
                  <div className="min-w-0 flex-1"><p className="font-medium text-[#120A1E]">{i.name}</p><p className="mt-0.5 text-xs text-neutral-500">Size {i.size} · {i.color}</p><p className="mt-1 text-xs text-neutral-500">{inr(i.price)} × {i.qty}</p></div>
                  <p className="font-medium tabular-nums">{inr(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 rounded-xl bg-neutral-50 p-4 text-sm">
              <div className="flex justify-between text-neutral-600"><dt>Subtotal</dt><dd className="tabular-nums">{inr(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {order.couponCode && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold">{order.couponCode}</span>}</dt><dd className="tabular-nums">−{inr(order.discount)}</dd></div>}
              <div className="flex justify-between text-neutral-600"><dt>Shipping</dt><dd className="tabular-nums">{order.shipping ? inr(order.shipping) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-[#120A1E]"><dt>Total</dt><dd className="tabular-nums">{inr(order.total)}</dd></div>
            </dl>
          </Block>

          <Block title="Payment">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><PayChip o={order} />
              {order.refundAmount ? <span className="text-xs text-neutral-500">Refunded {inr(order.refundAmount)}</span> : null}</div>
            {(order.paymentStatus === "paid" || order.paymentStatus === "refund_pending") && (
              <div className="mt-4 rounded-xl border border-neutral-200 p-4">
                <p className="text-xs text-neutral-500">Issue the actual refund in your Razorpay dashboard, then record it here.</p>
                <div className="mt-3 flex gap-2"><div className="relative flex-1"><IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input type="number" min={0} className="input !rounded-lg !pl-8" value={refund} onChange={(e) => setRefund(e.target.value)} aria-label="Refund amount" /></div>
                  <button disabled={busy} className="btn btn-dark !rounded-lg !py-2.5 whitespace-nowrap" onClick={() => patch({ paymentStatus: "refunded", refundAmount: Number(refund), note: note || "Refund processed" }, "Refund recorded")}>Mark refunded</button></div>
              </div>
            )}
          </Block>

          <Block title="Update order">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Status</label><select disabled={final} className="input !rounded-lg" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
              <div><label className="label">Tracking / AWB</label><div className="relative"><Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input className="input !rounded-lg !pl-9" placeholder="e.g. DTDC123456" value={tracking} onChange={(e) => setTracking(e.target.value)} /></div></div>
              <div className="sm:col-span-2"><label className="label">Note (added to timeline)</label><input className="input !rounded-lg" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} /></div>
            </div>
          </Block>

          <Block title="Activity">
            <ol className="relative space-y-4 border-l border-neutral-200 pl-5">
              {[...order.timeline].reverse().map((t, i) => (
                <li key={i} className="relative text-sm"><span className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${i === 0 ? "bg-[#7A184E]" : "bg-neutral-300"}`} />
                  <p className="font-medium text-[#120A1E]">{STATUS_LABEL[t.status] ?? t.status}</p><p className="text-xs text-neutral-500">{fmtDateTime(t.at)}{t.note && ` · ${t.note}`}</p></li>
              ))}
            </ol>
          </Block>
        </div>

        {/* footer actions */}
        <footer className="flex flex-wrap items-center gap-2 border-t border-neutral-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
          <Link href={`/admin/orders/${order._id}/invoice`} target="_blank" className="btn btn-outline !rounded-lg !py-2.5"><Printer size={14} /> Invoice</Link>
          {!final && <button disabled={busy} onClick={() => confirm("Cancel this order and restock the items?") && patch({ status: "cancelled", note: note || "Cancelled by admin" }, "Order cancelled")} className="btn !rounded-lg !py-2.5 border-red-200 text-red-700 hover:bg-red-50"><XCircle size={14} /> Cancel</button>}
          <button disabled={busy || !dirty || final} onClick={() => patch({ status: status !== order.status ? status : undefined, trackingNumber: tracking, note: note || undefined }, "Order updated")} className="btn btn-primary ml-auto !rounded-lg !py-2.5">
            {busy ? <Loader2 size={15} className="animate-spin" /> : null} Save changes
          </button>
        </footer>
      </motion.aside>
    </motion.div>
  );
}

/* ------------------------- page ------------------------- */
export function OrdersAdmin() {
  const [f, setF] = useState({ q: "", status: "", paymentStatus: "", method: "", from: "", to: "", sort: "newest", page: 1 });
  const [preset, setPreset] = useState("");
  const { data, loading, error, reload } = useList<O>("/api/admin/orders", f);
  const meta = data as unknown as { counts?: Counts; stats?: Stats } | null;
  const counts = useMemo<Counts>(() => meta?.counts ?? {}, [meta?.counts]);
  const stats = meta?.stats;
  const [sel, setSel] = useState<O | null>(null);
  const up = (p: Partial<typeof f>) => setF((x) => ({ ...x, page: 1, ...p }));

  const applyPreset = (v: string) => {
    setPreset(v);
    if (!v) return up({ from: "", to: "" });
    const now = new Date(), start = new Date();
    if (v !== "today") start.setDate(now.getDate() - Number(v) + 1);
    up({ from: ymd(start), to: ymd(now) });
  };
  const closePanel = useCallback(() => setSel(null), []);
  const changed = useCallback((o: O) => { setSel(o); reload(); }, [reload]);

  const needsAction = (counts.pending ?? 0) + (counts.confirmed ?? 0);
  const inTransit = (counts.processing ?? 0) + (counts.shipped ?? 0) + (counts.out_for_delivery ?? 0);
  const csv = `/api/admin/reports?format=csv${f.from ? `&from=${f.from}` : ""}${f.to ? `&to=${f.to}` : ""}${f.status ? `&status=${f.status}` : ""}`;
  const filtered = !!(f.q || f.status || f.paymentStatus || f.method || f.from || f.to);
  const tabs = useMemo(() => [["", "All", stats?.all ?? 0], ...STATUSES.map((s) => [s, STATUS_LABEL[s], counts[s] ?? 0] as const)] as [string, string, number][], [counts, stats]);

  const pager = data && data.total > 0 && (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-neutral-500">Showing <b className="font-medium text-neutral-700">{(data.page - 1) * 10 + 1}–{Math.min(data.page * 10, data.total)}</b> of <b className="font-medium text-neutral-700">{data.total}</b> orders</p>
      {data.pages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40" disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })} aria-label="Previous"><ChevronLeft size={14} /></button>
          <span className="px-3 text-xs text-neutral-600">Page {data.page} of {data.pages}</span>
          <button className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40" disabled={f.page >= data.pages} onClick={() => setF({ ...f, page: f.page + 1 })} aria-label="Next"><ChevronRight size={14} /></button>
        </nav>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight text-[#120A1E] md:text-3xl">Orders</h1><p className="mt-1 text-sm text-neutral-500">Track, fulfil and manage every customer order.</p></div>
        <a href={csv} className="btn btn-outline !rounded-lg !py-3"><Download size={15} /> Export CSV</a>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
        <Stat label="Needs your action" value={stats ? needsAction : "–"} icon={Clock} tone={needsAction ? "warn" : undefined} sub="Pending + confirmed orders" />
        <Stat label="In fulfilment" value={stats ? inTransit : "–"} icon={Truck} sub="Processing, shipped, out for delivery" />
        <Stat label="Today" value={stats ? stats.todayOrders : "–"} icon={ReceiptText} sub={stats ? `${inr(stats.todayRevenue)} in sales` : undefined} />
        <Stat label="Total revenue" value={stats ? inr(stats.revenue) : "–"} icon={IndianRupee} sub={stats ? `${stats.paidOrders} paid / COD orders` : undefined} />
      </div>

      {/* status tabs */}
      <div className="mb-4 overflow-x-auto rounded-xl border border-neutral-200/80 bg-white p-1.5 shadow-[0_1px_2px_rgba(18,10,30,0.04)]">
        <div className="flex min-w-max gap-1">
          {tabs.map(([v, l, n]) => (
            <button key={v || "all"} onClick={() => up({ status: v })} aria-pressed={f.status === v}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition ${f.status === v ? "bg-[#120A1E] text-white" : "text-neutral-600 hover:bg-neutral-50"}`}>
              {l}<span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${f.status === v ? "bg-white/20" : v === "pending" && n ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-500"}`}>{n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(18,10,30,0.04)] sm:p-4">
        <SearchBox value={f.q} onChange={(q) => up({ q })} placeholder="Order no., name, email, phone" />
        <select className="input !w-auto !rounded-lg !py-2.5" aria-label="Payment status" value={f.paymentStatus} onChange={(e) => up({ paymentStatus: e.target.value })}><option value="">Any payment</option>{PAY.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
        <select className="input !w-auto !rounded-lg !py-2.5" aria-label="Payment method" value={f.method} onChange={(e) => up({ method: e.target.value })}><option value="">Online + COD</option><option value="razorpay">Online</option><option value="cod">Cash on delivery</option></select>
        <select className="input !w-auto !rounded-lg !py-2.5" aria-label="Sort" value={f.sort} onChange={(e) => up({ sort: e.target.value })}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="total-desc">Highest value</option><option value="total-asc">Lowest value</option></select>
        <div className="flex overflow-hidden rounded-lg border border-neutral-200" role="group" aria-label="Date range">
          {PRESETS.map(([v, l]) => <button key={v} onClick={() => applyPreset(v)} aria-pressed={preset === v && (!!f.from || v === "")} className={`px-3 py-2.5 text-xs font-medium transition ${preset === v && (!!f.from || v === "") ? "bg-[#7A184E] text-white" : "text-neutral-600 hover:bg-neutral-50"}`}>{l}</button>)}
        </div>
        {filtered && <button onClick={() => { setPreset(""); setF({ q: "", status: "", paymentStatus: "", method: "", from: "", to: "", sort: "newest", page: 1 }); }} className="ml-auto text-xs text-[#7A184E] underline">Clear filters</button>}
      </div>

      {error ? (
        <div className="rounded-xl border bg-white p-10 text-center text-sm text-red-700">{error} <button onClick={reload} className="ml-2 underline">Retry</button></div>
      ) : loading && !data ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : data && data.items.length === 0 ? (
        <div className="rounded-xl border bg-white"><EmptyState title={filtered ? "No orders match your filters" : "No orders yet"} text={filtered ? "Try changing the status, dates or search." : "New orders will appear here as customers check out."} action={filtered ? <button onClick={() => { setPreset(""); setF({ q: "", status: "", paymentStatus: "", method: "", from: "", to: "", sort: "newest", page: 1 }); }} className="btn btn-outline">Clear filters</button> : undefined} /></div>
      ) : data && (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {/* desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(18,10,30,0.04)] md:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"><tr>{["Order", "Customer", "Items", "Total", "Payment", "Status", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {data.items.map((o) => {
                  const nx = NEXT[o.status];
                  return (
                    <tr key={o._id} onClick={() => setSel(o)} className="cursor-pointer transition hover:bg-[#7A184E]/[0.03]">
                      <td className="px-4 py-3.5"><p className="font-semibold text-[#120A1E]">{o.orderNumber}</p><p className="text-xs text-neutral-500" title={fmtDateTime(o.createdAt)}>{ago(o.createdAt)}</p></td>
                      <td className="px-4 py-3.5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A184E]/10 text-xs font-semibold text-[#7A184E]">{initials(o.customer.name)}</span><div className="min-w-0"><p className="truncate font-medium">{o.customer.name}</p><p className="truncate text-xs text-neutral-500">{o.shippingAddress.city}</p></div></div></td>
                      <td className="px-4 py-3.5"><Thumbs o={o} /></td>
                      <td className="px-4 py-3.5 font-semibold tabular-nums">{inr(o.total)}</td>
                      <td className="px-4 py-3.5"><PayChip o={o} /></td>
                      <td className="px-4 py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3.5 text-right">{nx ? <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#7A184E]/30 px-3 py-1.5 text-[11px] font-medium text-[#7A184E]">{nx.label} <ChevronRight size={12} /></span> : <ChevronRight size={16} className="ml-auto text-neutral-300" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <ul className="space-y-3 md:hidden">
            {data.items.map((o) => (
              <li key={o._id}><button onClick={() => setSel(o)} className="w-full rounded-xl border border-neutral-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(18,10,30,0.04)]">
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#120A1E]">{o.orderNumber}</p><p className="text-xs text-neutral-500">{o.customer.name} · {ago(o.createdAt)}</p></div><StatusBadge status={o.status} /></div>
                <div className="mt-3 flex items-center justify-between"><Thumbs o={o} /><div className="text-right"><p className="font-semibold tabular-nums">{inr(o.total)}</p><p className="text-[11px] uppercase text-neutral-500">{o.paymentMethod === "cod" ? "COD" : "Online"} · {o.paymentStatus.replace("_", " ")}</p></div></div>
              </button></li>
            ))}
          </ul>
          {pager}
        </div>
      )}

      <AnimatePresence>{sel && <OrderPanel key={sel._id} order={sel} onClose={closePanel} onChanged={changed} />}</AnimatePresence>
    </div>
  );
}
