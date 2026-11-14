import { fmtDate, inr } from "@/utils";
import { amountInWords } from "@/utils/words";

export type InvoiceItem = { name: string; size?: string; color?: string; sku?: string; image?: string; qty: number; price: number };
export type InvoiceOrder = {
  orderNumber: string; createdAt: string; status: string; paymentStatus: string; paymentMethod: string; trackingNumber?: string; couponCode?: string;
  customer: { name: string; email: string; phone: string };
  shippingAddress: { address: string; city: string; state: string; pincode: string };
  items: InvoiceItem[]; subtotal: number; discount: number; shipping: number; total: number;
};
export type InvoiceStore = { storeName: string; tagline: string; contact: { address: string; phone: string; email: string } };

const label = "text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8C6A32]";
const pretty = (s: string) => s.replace(/_/g, " ");

/** Print-ready A4 invoice. Presentational only — used by the admin invoice and the customer invoice page. */
export function InvoiceDocument({ order, store }: { order: InvoiceOrder; store: InvoiceStore }) {
  const paid = order.paymentStatus === "paid";
  const refunded = order.paymentStatus === "refunded";
  const cancelled = ["cancelled", "returned"].includes(order.status);
  const cod = order.paymentMethod === "cod";
  const units = order.items.reduce((n, i) => n + i.qty, 0);
  const stamp = refunded ? { t: "Refunded", c: "border-[#7A184E]/30 text-[#7A184E]/25" } : cancelled ? { t: order.status, c: "border-red-600/30 text-red-600/25" } : paid ? { t: "Paid", c: "border-emerald-600/30 text-emerald-600/25" } : null;
  const dueNote = paid ? null : cancelled || refunded ? null : cod ? "Amount payable in cash on delivery" : "Payment pending";

  return (
    <article className="invoice-sheet relative mx-auto w-full max-w-[820px] overflow-hidden bg-white shadow-[0_30px_80px_-40px_rgba(18,10,30,0.45)]">
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          html, body { background: #fff !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .invoice-sheet { box-shadow: none !important; max-width: none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tr, .avoid-break { break-inside: avoid; }
        }
      `}</style>

      <div className="h-2 bg-gradient-to-r from-[#7A184E] via-[#D4AF37] to-[#7A184E]" />
      {stamp && (
        <div aria-hidden className={`pointer-events-none absolute right-8 top-[19rem] -rotate-[14deg] rounded-md border-4 px-6 py-1 font-display text-6xl font-bold uppercase tracking-[0.2em] ${stamp.c}`}>{stamp.t}</div>
      )}

      <div className="p-8 sm:p-12 print:p-8">
        {/* letterhead */}
        <header className="flex flex-wrap items-start justify-between gap-8">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" className="h-14 w-14 rounded-xl border border-[#C5A880]/50 object-cover" />
            <div>
              <p className="font-display text-4xl font-semibold leading-none tracking-[0.26em] text-[#120A1E]">SKY</p>
              <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.5em] text-[#7A184E]">{store.storeName.replace(/^SKY\s*/i, "") || "Boutique"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-5xl font-medium leading-none tracking-wide text-[#120A1E]">Invoice</p>
            <p className="mt-2 text-sm font-semibold tracking-wider text-[#7A184E]">{order.orderNumber}</p>
          </div>
        </header>

        {/* meta strip */}
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-neutral-200 bg-neutral-200 text-sm sm:grid-cols-4">
          {[
            ["Invoice date", fmtDate(order.createdAt)],
            ["Order status", pretty(order.status)],
            ["Payment", cod ? "Cash on delivery" : "Online (Razorpay)"],
            ["Payment status", pretty(order.paymentStatus)],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#FCFAF7] px-4 py-3"><dt className={label}>{k}</dt><dd className="mt-1 font-medium capitalize text-[#120A1E]">{v}</dd></div>
          ))}
        </dl>

        {/* parties */}
        <section className="avoid-break mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className={label}>From</p>
            <p className="mt-2 font-display text-xl text-[#120A1E]">{store.storeName}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{store.contact.address}<br />{store.contact.phone}<br />{store.contact.email}</p>
          </div>
          <div className="sm:text-right">
            <p className={label}>Billed &amp; shipped to</p>
            <p className="mt-2 font-display text-xl text-[#120A1E]">{order.customer.name}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{order.shippingAddress.address}<br />{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}<br />{order.customer.phone} · {order.customer.email}</p>
          </div>
        </section>

        {/* items */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-[#120A1E] text-left text-[9px] uppercase tracking-[0.22em] text-[#F4E7CB]">
                <th className="px-3 py-3 font-semibold">#</th><th className="px-3 py-3 font-semibold">Item</th><th className="px-3 py-3 font-semibold">SKU</th>
                <th className="px-3 py-3 text-right font-semibold">Qty</th><th className="px-3 py-3 text-right font-semibold">Rate</th><th className="px-3 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i, k) => (
                <tr key={k} className={`align-middle ${k % 2 ? "bg-[#FCFAF7]" : ""}`}>
                  <td className="px-3 py-3 text-neutral-400">{k + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {i.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={i.image} alt="" className="h-12 w-9 shrink-0 rounded object-cover" />}
                      <div><p className="font-medium text-[#120A1E]">{i.name}</p><p className="text-xs text-neutral-500">{[i.size && `Size ${i.size}`, i.color].filter(Boolean).join(" · ")}</p></div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-neutral-500">{i.sku ?? "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{i.qty}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{inr(i.price)}</td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums">{inr(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* summary */}
        <section className="avoid-break mt-6 grid gap-8 sm:grid-cols-[1fr_17rem]">
          <div className="space-y-4">
            <div className="border-l-2 border-[#D4AF37] bg-[#FCFAF7] px-4 py-3">
              <p className={label}>Amount in words</p>
              <p className="mt-1 text-[13px] font-medium text-[#120A1E]">{amountInWords(order.total)}</p>
            </div>
            {dueNote && <p className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{dueNote}</p>}
            {order.trackingNumber && <p className="text-xs text-neutral-600">Shipment tracking: <b className="text-[#120A1E]">{order.trackingNumber}</b></p>}
            <p className="text-[11px] text-neutral-500">{units} item{units === 1 ? "" : "s"} · All prices are in INR and inclusive of applicable taxes.</p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600"><dt>Subtotal</dt><dd className="tabular-nums">{inr(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd className="tabular-nums">−{inr(order.discount)}</dd></div>}
            <div className="flex justify-between text-neutral-600"><dt>Shipping</dt><dd className="tabular-nums">{order.shipping ? inr(order.shipping) : "Free"}</dd></div>
            <div className="mt-3 flex items-center justify-between bg-[#120A1E] px-4 py-3.5 text-white">
              <dt className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]">Grand total</dt><dd className="font-display text-3xl tabular-nums">{inr(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* footer */}
        <footer className="avoid-break mt-12 grid items-end gap-8 border-t border-neutral-200 pt-6 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="font-display text-2xl italic text-[#7A184E]">{store.tagline}</p>
            <p className="mt-2 max-w-md text-[11px] leading-relaxed text-neutral-500">Thank you for shopping with {store.storeName}. For any help with this order, write to {store.contact.email} or call {store.contact.phone}, quoting {order.orderNumber}.</p>
          </div>
          <div className="text-center">
            <div className="mb-1 h-px w-40 bg-neutral-400" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">Authorised signatory</p>
          </div>
        </footer>
        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.25em] text-neutral-400">This is a computer-generated invoice</p>
      </div>
      <div className="h-2 bg-gradient-to-r from-[#7A184E] via-[#D4AF37] to-[#7A184E]" />
    </article>
  );
}
