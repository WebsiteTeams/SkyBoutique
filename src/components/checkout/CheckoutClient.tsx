"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, CreditCard, Banknote, ShieldCheck } from "lucide-react";
import { useAuth, useCart, useToast } from "@/hooks/providers";
import { useCartPricing } from "@/hooks/useCartPricing";
import { useCoupon } from "@/hooks/useCoupon";
import { CouponBox, Totals } from "@/components/cart/CartPage";
import { EmptyState, ErrorState, PageHero, SmartImage, Skeleton, Steps } from "@/components/common/ui";
import { api, inr } from "@/utils";
import { phoneSchema, pinSchema } from "@/validations";

const formSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: phoneSchema,
  address: z.string().trim().min(5, "Enter your address"),
  city: z.string().trim().min(2, "Enter your city"),
  state: z.string().trim().min(2, "Enter your state"),
  pincode: pinSchema,
  paymentMethod: z.enum(["razorpay", "cod"]),
});
type Form = z.infer<typeof formSchema>;

const STATES = ["Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu", "Telangana", "Maharashtra", "Gujarat", "Delhi", "Uttar Pradesh", "West Bengal", "Rajasthan", "Punjab", "Haryana", "Madhya Pradesh", "Bihar", "Odisha", "Assam", "Goa", "Other"];

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } } }

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, clear, ready } = useCart();
  const { toast } = useToast();
  const [code, setCode] = useCoupon();
  const { data, loading, error, reload } = useCartPricing(code);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Form>({ resolver: zodResolver(formSchema), defaultValues: { paymentMethod: "razorpay", state: "Tamil Nadu" } });
  const method = watch("paymentMethod");

  useEffect(() => {
    if (!user) return;
    setValue("name", user.name); setValue("email", user.email); if (user.phone) setValue("phone", user.phone);
    api<{ items: { name: string; phone: string; address: string; city: string; state: string; pincode: string; isDefault: boolean }[] }>("/api/account/addresses").then((r) => {
      const a = r.items.find((x) => x.isDefault) ?? r.items[0];
      if (a) { setValue("address", a.address); setValue("city", a.city); setValue("state", a.state); setValue("pincode", a.pincode); }
    }).catch(() => {});
  }, [user, setValue]);

  const done = (orderNumber: string, email: string) => {
    clear();
    setCode("");
    router.push(`/order-confirmation/${orderNumber}?email=${encodeURIComponent(email)}`);
  };

  const onSubmit = async (values: Form) => {
    setBusy(true);
    try {
      // Must match POST /api/orders (checkoutSchema). Prices are never sent — the server recomputes everything.
      const payload = {
        items: items.map((i) => ({ productId: i.productId, sku: i.sku, qty: i.qty })),
        coupon: code || undefined,
        paymentMethod: values.paymentMethod,
        customer: { name: values.name, email: values.email, phone: values.phone },
        shippingAddress: { address: values.address, city: values.city, state: values.state, pincode: values.pincode },
      };
      const res = await api<{ orderNumber: string; razorpay: { orderId: string; amount: number; keyId: string } | null }>("/api/orders", { method: "POST", json: payload });

      // Cash on delivery (or nothing to pay online): order is confirmed.
      if (!res.razorpay) return done(res.orderNumber, values.email);

      const releaseOrder = () => api(`/api/orders/${res.orderNumber}`, { method: "PATCH", json: { action: "cancel", email: values.email } }).catch(() => {});
      if (!(await loadRazorpay()) || !window.Razorpay) {
        await releaseOrder();
        throw new Error("Could not load the payment gateway. Please check your connection and try again.");
      }

      const rzp = new window.Razorpay({
        key: res.razorpay.keyId,
        amount: res.razorpay.amount,
        currency: "INR",
        name: "SKY BOUTIQUE",
        description: `Order ${res.orderNumber}`,
        order_id: res.razorpay.orderId,
        prefill: { name: values.name, email: values.email, contact: values.phone },
        theme: { color: "#7A184E" },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            // Success in the browser is never trusted: the server verifies the HMAC signature.
            await api("/api/payments/verify", { method: "POST", json: { orderNumber: res.orderNumber, ...resp } });
            done(res.orderNumber, values.email);
          } catch (e) {
            toast(`${(e as Error).message}. If money was debited, contact support with order ${res.orderNumber}.`, "err");
            setBusy(false);
          }
        },
        modal: { ondismiss: async () => { await releaseOrder(); toast("Payment cancelled. You have not been charged.", "err"); setBusy(false); reload(); } },
      });
      rzp.on("payment.failed", () => toast("Payment failed. You can retry or choose another method.", "err"));
      rzp.open();
    } catch (e) {
      toast((e as Error).message, "err");
      setBusy(false);
      reload();
    }
  };

  if (!ready) return <div className="container-x py-20"><Skeleton className="h-96 w-full" /></div>;
  if (!items.length) return <div className="container-x py-16"><EmptyState title="Your bag is empty" action={<Link href="/shop" className="btn btn-gold">Continue shopping</Link>} /></div>;

  const field = (name: keyof Form, label: string, rest: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label !text-[#8C6A32]" htmlFor={name}>{label}</label>
      <input id={name} className="input !bg-white" {...register(name)} {...rest} aria-invalid={!!errors[name]} />
      {errors[name] && <p className="err">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <>
      <PageHero eyebrow="Final Step" title="Secure Checkout">
        <Steps current={2} />
      </PageHero>

      <div className="container-x py-12 md:py-20">
        {!user && (
          <div className="mb-8 rounded-lg border border-[#C5A880]/30 bg-[#FAF7F2] p-4 text-xs text-neutral-600 font-light">
            Checking out as guest. <Link href="/login?next=/checkout" className="text-[#7A184E] font-medium underline">Sign in to your patron account</Link> for seamless order tracking and addresses.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-12 lg:grid-cols-[1fr_420px]" noValidate>
          <div className="space-y-12">
            <section>
              <h2 className="mb-6 flex items-center gap-3 font-display text-3xl text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#120A1E] text-xs font-semibold text-[#F4E7CB] border border-[#C5A880]/40">1</span>
                Contact &amp; White-Glove Delivery
              </h2>
              <div className="grid gap-4.5 sm:grid-cols-2">
                <div className="sm:col-span-2">{field("name", "Full Name", { autoComplete: "name" })}</div>
                {field("email", "Email Address", { type: "email", autoComplete: "email" })}
                {field("phone", "Mobile Contact Number", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "10-digit mobile" })}
                <div className="sm:col-span-2">{field("address", "Street & Residence Address", { autoComplete: "street-address" })}</div>
                {field("city", "City", { autoComplete: "address-level2" })}
                <div>
                  <label className="label !text-[#8C6A32]" htmlFor="state">State</label>
                  <select id="state" className="input !bg-white" {...register("state")}>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="err">{errors.state.message}</p>}
                </div>
                {field("pincode", "PIN Code", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
              </div>
            </section>

            <section>
              <h2 className="mb-6 flex items-center gap-3 font-display text-3xl text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#120A1E] text-xs font-semibold text-[#F4E7CB] border border-[#C5A880]/40">2</span>
                Payment Method
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-start gap-3.5 border p-5 transition ${method === "razorpay" ? "border-[#C5A880] bg-[#FAF7F2] shadow-sm" : "border-[#E5DFD7] bg-white hover:border-[#C5A880]/50"}`}>
                  <input type="radio" value="razorpay" className="mt-1 accent-[#7A184E]" {...register("paymentMethod")} />
                  <span>
                    <span className="flex items-center gap-2 font-medium text-ink"><CreditCard size={17} className="text-[#8C6A32]" /> Online Payment</span>
                    <span className="text-xs text-neutral-500 font-light block mt-0.5">UPI, Debit/Credit Cards, Net Banking via Razorpay</span>
                  </span>
                </label>
                {data?.codEnabled !== false && (
                  <label className={`flex cursor-pointer items-start gap-3.5 border p-5 transition ${method === "cod" ? "border-[#C5A880] bg-[#FAF7F2] shadow-sm" : "border-[#E5DFD7] bg-white hover:border-[#C5A880]/50"}`}>
                    <input type="radio" value="cod" className="mt-1 accent-[#7A184E]" {...register("paymentMethod")} />
                    <span>
                      <span className="flex items-center gap-2 font-medium text-ink"><Banknote size={17} className="text-[#8C6A32]" /> Cash on Delivery</span>
                      <span className="text-xs text-neutral-500 font-light block mt-0.5">Pay upon white-glove doorstep arrival</span>
                    </span>
                  </label>
                )}
              </div>
            </section>
          </div>

          {/* Aside Order Summary */}
          <aside className="h-fit space-y-6 bg-[#FAF7F2] border border-[#C5A880]/30 p-8 shadow-soft lg:sticky lg:top-28">
            <h2 className="font-display text-3xl text-ink">Order Summary</h2>
            {error ? (
              <ErrorState message={error} retry={reload} />
            ) : loading && !data ? (
              <Skeleton className="h-44 w-full" />
            ) : data && (
              <>
                <ul className="space-y-3.5 divide-y divide-[#EFE8DE]">
                  {data.items.map((l) => (
                    <li key={l.sku} className="flex gap-3 text-sm pt-3 first:pt-0">
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-white border border-[#C5A880]/20">
                        <SmartImage src={l.image} alt={l.name} className="h-full w-full object-cover" />
                        <span className="absolute right-0 top-0 bg-[#120A1E] px-1.5 py-0.5 text-[9px] font-semibold text-[#F4E7CB]">
                          {l.qty}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-ink leading-snug line-clamp-1">{l.name}</p>
                        <p className="text-xs text-[#8C6A32] mt-0.5">{l.size} · {l.color}</p>
                        {l.issue && <p className="text-xs text-red-600 font-medium">{l.issue}</p>}
                      </div>
                      <span className="font-medium text-ink">{inr(l.price * l.qty)}</span>
                    </li>
                  ))}
                </ul>

                <CouponBox code={code} setCode={setCode} data={data} />
                <Totals data={data} />
                {data.hasIssues && (
                  <p className="text-xs text-red-600 font-medium">Some pieces are no longer available in requested quantities. <Link href="/cart" className="underline">Review Bag</Link></p>
                )}
              </>
            )}

            <button disabled={busy || !data || data.hasIssues} className="btn btn-gold w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />} 
              {method === "cod" ? "Place Atelier Order" : `Pay ${data ? inr(data.total) : ""}`}
            </button>
            
            <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-neutral-500 font-light">
              <ShieldCheck size={13} className="text-[#8C6A32]" /> Authenticated 256-bit Secure Atelier Encryption
            </p>
          </aside>
        </form>
      </div>
    </>
  );
}
