"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import clsx from "clsx";
import {
  ArrowRight, ChevronDown, Heart, LayoutDashboard, Loader2, LogOut, MapPin, Package, Pencil, Plus,
  ShieldCheck, ShoppingBag, Trash2, Truck, User as UserIcon, type LucideIcon,
} from "lucide-react";
import { useAuth, useToast, useWishlist } from "@/hooks/providers";
import { api, fmtDate, inr } from "@/utils";
import { EmptyState, ErrorState, Pagination, Skeleton, SmartImage } from "./ui";
import { OrderDetails, StatusBadge, type OrderT } from "@/components/checkout/OrderView";
import { ProductCard, type ProductLite } from "@/components/products/ProductCard";
import { addressSchema, passwordSchema, phoneSchema } from "@/validations";

type Addr = { _id: string; label?: string; name: string; phone: string; address: string; city: string; state: string; pincode: string; isDefault?: boolean };

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

/* ---------------- Shared building blocks ---------------- */
const card = "rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(18,10,30,0.04)]";

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span className={clsx("flex shrink-0 items-center justify-center rounded-full bg-[#7A184E] font-semibold text-white", size === "lg" ? "h-14 w-14 text-lg" : "h-11 w-11 text-sm")}>
      {initials(name)}
    </span>
  );
}

function PageTitle({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-neutral-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function CardHead({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-neutral-100 pb-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7A184E]/8 text-[#7A184E]"><Icon size={18} /></span>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {desc && <p className="text-xs text-neutral-500">{desc}</p>}
      </div>
    </div>
  );
}

/* ---------------- Navigation ---------------- */
const LINKS: [string, string, LucideIcon][] = [
  ["/account", "Overview", LayoutDashboard],
  ["/account/orders", "My Orders", Package],
  ["/account/wishlist", "Wishlist", Heart],
  ["/account/profile", "Profile & Addresses", UserIcon],
];

export function AccountNav({ name, email }: { name: string; email: string }) {
  const path = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="min-w-0 lg:sticky lg:top-40">
      {/* Phones & tablets: identity + scrollable tabs */}
      <div className="lg:hidden">
        <div className={clsx(card, "mb-3 flex items-center gap-3 p-4")}>
          <Avatar name={name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-neutral-500">{email}</p>
          </div>
        </div>
        <nav className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0" aria-label="Account">
          {LINKS.map(([href, label, Icon]) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  active ? "bg-[#7A184E] text-white shadow-sm" : "border border-neutral-200 bg-white text-neutral-700 hover:border-[#7A184E]/40 hover:text-[#7A184E]",
                )}
              >
                <Icon size={15} /> {label}
              </Link>
            );
          })}
          <button onClick={logout} className="flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-red-300 hover:text-red-600">
            <LogOut size={15} /> Sign out
          </button>
        </nav>
      </div>

      {/* Desktop: sidebar card */}
      <div className={clsx(card, "hidden overflow-hidden lg:block")}>
        <div className="flex items-center gap-3 border-b border-neutral-100 p-5">
          <Avatar name={name} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-neutral-500">{email}</p>
          </div>
        </div>
        <nav className="space-y-0.5 p-2" aria-label="Account">
          {LINKS.map(([href, label, Icon]) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition",
                  active ? "bg-[#7A184E] text-white shadow-sm" : "text-neutral-700 hover:bg-neutral-100 hover:text-[#7A184E]",
                )}
              >
                <Icon size={17} className={active ? "text-[#D4AF37]" : "text-neutral-400"} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-100 p-2">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-red-50 hover:text-red-600">
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Orders ---------------- */
type OrdersRes = { items: OrderT[]; page: number; pages: number; total: number };

export function OrdersList({ limit, compact }: { limit?: number; compact?: boolean }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrdersRes | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(() => {
    api<OrdersRes>(`/api/orders?page=${page}&limit=${limit ?? 10}`).then(setData).catch((e) => setError(e.message));
  }, [page, limit]);
  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message={error} retry={load} />;
  if (!data) return <div className="space-y-3"><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-24 w-full rounded-xl" /></div>;
  if (!data.items.length) {
    return (
      <div className={clsx(card, "px-6 py-12 text-center")}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7A184E]/8 text-[#7A184E]"><Package size={24} /></span>
        <p className="mt-4 text-base font-semibold text-ink">No orders yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">When you place an order, you can track it and view its details here.</p>
        <Link href="/shop" className="btn btn-primary mt-5 !py-2.5">Start shopping</Link>
      </div>
    );
  }

  const row = (o: OrderT) => (
    <>
      <span className="flex shrink-0 -space-x-3" aria-hidden>
        {o.items.slice(0, 3).map((it, k) => (
          <span key={k} className="relative h-14 w-11 overflow-hidden rounded-md border-2 border-white bg-[#F5F1EC] shadow-sm sm:h-16 sm:w-12">
            <SmartImage src={it.image} alt="" className="h-full w-full object-cover" />
          </span>
        ))}
        {o.items.length > 3 && (
          <span className="flex h-14 w-11 items-center justify-center rounded-md border-2 border-white bg-neutral-100 text-xs font-semibold text-neutral-600 sm:h-16 sm:w-12">+{o.items.length - 3}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink sm:text-base">{o.orderNumber}</span>
            <span className="mt-0.5 block text-xs text-neutral-500">{fmtDate(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? "" : "s"}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm font-semibold tabular-nums text-ink sm:text-base">{inr(o.total)}</span>
          </span>
        </span>
        <span className="mt-2 flex items-center justify-between gap-2">
          <StatusBadge status={o.status} />
          {compact ? <ArrowRight size={15} className="text-neutral-400" /> : (
            <span className="flex items-center gap-1 text-xs font-medium text-[#7A184E]">
              {open === o._id ? "Hide details" : "View details"}
              <ChevronDown size={14} className={clsx("transition-transform duration-300", open === o._id && "rotate-180")} />
            </span>
          )}
        </span>
      </span>
    </>
  );

  return (
    <div>
      <ul className="space-y-3">
        {data.items.map((o) => (
          <li key={o._id} className={clsx(card, "overflow-hidden transition hover:border-[#7A184E]/30 hover:shadow-md")}>
            {compact ? (
              <Link href="/account/orders" className="flex w-full items-center gap-4 p-4 text-left sm:p-5">{row(o)}</Link>
            ) : (
              <button onClick={() => setOpen(open === o._id ? null : o._id)} aria-expanded={open === o._id} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
                {row(o)}
              </button>
            )}
            {open === o._id && !compact && (
              <div className="border-t border-neutral-100 bg-[#FAF8F5] p-4 sm:p-6">
                <OrderDetails order={o} onChanged={load} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {!limit && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </div>
  );
}

export function OrdersPage() {
  return (
    <div>
      <PageTitle title="My Orders" desc="Track, review and manage everything you have ordered." />
      <OrdersList />
    </div>
  );
}

/* ---------------- Overview ---------------- */
export function Overview() {
  const { user } = useAuth();
  const { ids } = useWishlist();
  const [stats, setStats] = useState<{ orders: number; addresses: number } | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      api<{ total: number }>("/api/orders?page=1&limit=1"),
      api<{ items: Addr[] }>("/api/account/addresses"),
    ]).then(([o, a]) => {
      if (!alive) return;
      setStats({
        orders: o.status === "fulfilled" ? o.value.total ?? 0 : 0,
        addresses: a.status === "fulfilled" ? a.value.items.length : 0,
      });
    });
    return () => { alive = false; };
  }, []);

  const first = (user?.name ?? "").trim().split(/\s+/)[0] || "there";
  const tiles: { href: string; icon: LucideIcon; count: number | undefined; label: string }[] = [
    { href: "/account/orders", icon: Package, count: stats?.orders, label: "Orders" },
    { href: "/account/wishlist", icon: Heart, count: ids.length, label: "Wishlist items" },
    { href: "/account/profile", icon: MapPin, count: stats?.addresses, label: "Saved addresses" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7A184E] via-[#4B0F31] to-[#120A1E] p-6 text-white sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#D4AF37]/10" />
        <span aria-hidden className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-sm text-[#F4E7CB]/80">Welcome back</p>
          <h2 className="mt-1 break-words font-display text-3xl font-medium tracking-tight sm:text-4xl">Hello, {first}</h2>
          <p className="mt-2 max-w-md text-sm text-white/70">Everything you need to manage your orders and account is right here.</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/shop" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#120A1E] transition hover:bg-[#F4E7CB]"><ShoppingBag size={16} /> Continue shopping</Link>
            <Link href="/track-order" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"><Truck size={16} /> Track an order</Link>
          </div>
        </div>
      </section>

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className={clsx(card, "group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-[#7A184E]/30 hover:shadow-md sm:p-5")}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7A184E]/8 text-[#7A184E]"><t.icon size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-2xl font-semibold tabular-nums leading-none text-ink">{t.count === undefined ? "—" : t.count}</span>
              <span className="mt-1 block truncate text-xs text-neutral-500">{t.label}</span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-[#7A184E]" />
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <section>
        <PageTitle title="Recent orders" action={<Link href="/account/orders" className="text-sm font-medium text-[#7A184E] hover:underline">View all</Link>} />
        <OrdersList limit={3} compact />
      </section>
    </div>
  );
}

/* ---------------- Wishlist ---------------- */
export function WishlistPage() {
  const { ids } = useWishlist();
  const [items, setItems] = useState<ProductLite[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ items: ProductLite[] }>("/api/wishlist?full=1").then((r) => setItems(r.items)).catch((e) => setError(e.message));
  }, [ids.length]);

  if (error) return <ErrorState message={error} />;
  if (!items) {
    return (
      <div>
        <PageTitle title="Wishlist" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] w-full rounded-lg" />)}</div>
      </div>
    );
  }
  const saved = items.filter((p) => ids.includes(p._id));
  if (!saved.length) {
    return (
      <div>
        <PageTitle title="Wishlist" />
        <div className={clsx(card, "px-6 py-12 text-center")}>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7A184E]/8 text-[#7A184E]"><Heart size={24} /></span>
          <p className="mt-4 text-base font-semibold text-ink">Your wishlist is empty</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">Tap the heart on any product to save it here for later.</p>
          <Link href="/shop" className="btn btn-primary mt-5 !py-2.5">Browse products</Link>
        </div>
      </div>
    );
  }
  return (
    <div>
      <PageTitle title="Wishlist" desc={`${saved.length} saved item${saved.length === 1 ? "" : "s"}`} />
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4">
        {saved.map((p, i) => <ProductCard key={p._id} p={p} index={i} />)}
      </div>
    </div>
  );
}

/* ---------------- Profile & addresses ---------------- */
const profileForm = z.object({ name: z.string().trim().min(2, "Enter your name"), phone: phoneSchema.optional().or(z.literal("")), currentPassword: z.string().optional(), newPassword: passwordSchema.optional().or(z.literal("")) });

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof profileForm>>({ resolver: zodResolver(profileForm) });
  useEffect(() => { if (user) reset({ name: user.name, phone: user.phone ?? "" }); }, [user, reset]);

  const save = async (v: z.infer<typeof profileForm>) => {
    try {
      await api("/api/account/profile", { method: "PUT", json: v });
      await refresh();
      toast("Profile updated successfully");
      reset({ ...v, currentPassword: "", newPassword: "" });
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };

  return (
    <div className="space-y-8">
      <PageTitle title="Profile & Addresses" desc="Keep your details and delivery addresses up to date." />
      <form onSubmit={handleSubmit(save)} className="space-y-5" noValidate>
        <section className={clsx(card, "p-5 sm:p-6")}>
          <CardHead icon={UserIcon} title="Personal details" desc="How we address you and reach you about orders" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="profile-name">Full name</label>
              <input id="profile-name" className="input" {...register("name")} />
              {errors.name && <p className="err">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="profile-phone">Mobile number</label>
              <input id="profile-phone" className="input" inputMode="tel" {...register("phone")} />
              {errors.phone && <p className="err">{errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="profile-email">Email address</label>
              <input id="profile-email" className="input !bg-neutral-50 text-neutral-500" value={user?.email ?? ""} disabled readOnly />
              <p className="mt-1 text-xs text-neutral-400">Your email is used to sign in and can&apos;t be changed here.</p>
            </div>
          </div>
        </section>

        <section className={clsx(card, "p-5 sm:p-6")}>
          <CardHead icon={ShieldCheck} title="Password & security" desc="Leave blank to keep your current password" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="profile-curpw">Current password</label>
              <input id="profile-curpw" type="password" autoComplete="current-password" className="input" {...register("currentPassword")} />
            </div>
            <div>
              <label className="label" htmlFor="profile-newpw">New password</label>
              <input id="profile-newpw" type="password" autoComplete="new-password" className="input" {...register("newPassword")} />
              {errors.newPassword && <p className="err">{errors.newPassword.message}</p>}
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button disabled={isSubmitting} className="btn btn-primary !py-3">
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : "Save changes"}
          </button>
        </div>
      </form>
      <Addresses />
    </div>
  );
}

function Addresses() {
  const { toast } = useToast();
  const [items, setItems] = useState<Addr[] | null>(null);
  const [editing, setEditing] = useState<Addr | "new" | null>(null);
  const load = useCallback(() => api<{ items: Addr[] }>("/api/account/addresses").then((r) => setItems(r.items)).catch(() => setItems([])), []);
  useEffect(() => { load(); }, [load]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof addressSchema>>({ resolver: zodResolver(addressSchema) });
  useEffect(() => {
    if (editing) reset(editing === "new" ? { label: "Home", name: "", phone: "", address: "", city: "", state: "", pincode: "", isDefault: false } : editing);
  }, [editing, reset]);

  const save = async (v: z.infer<typeof addressSchema>) => {
    try {
      if (editing === "new") await api("/api/account/addresses", { method: "POST", json: v });
      else if (editing) await api(`/api/account/addresses/${editing._id}`, { method: "PUT", json: v });
      toast("Address saved successfully");
      setEditing(null);
      load();
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };
  const del = async (id: string) => {
    if (!confirm("Delete this delivery address?")) return;
    await api(`/api/account/addresses/${id}`, { method: "DELETE" });
    load();
  };

  const F = (n: keyof z.infer<typeof addressSchema>, label: string, id: string) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} className="input" {...register(n as never)} />
      {errors[n] && <p className="err">{errors[n]?.message as string}</p>}
    </div>
  );

  return (
    <section>
      <PageTitle
        title="Delivery addresses"
        desc="Where should we send your orders?"
        action={!editing && <button onClick={() => setEditing("new")} className="btn btn-dark !px-4 !py-2.5"><Plus size={15} /> Add address</button>}
      />

      {editing ? (
        <form onSubmit={handleSubmit(save)} className={clsx(card, "p-5 sm:p-6")} noValidate>
          <CardHead icon={MapPin} title={editing === "new" ? "Add a new address" : "Edit address"} />
          <div className="grid gap-4 sm:grid-cols-2">
            {F("label", "Label (Home, Office…)", "addr-label")}
            {F("name", "Recipient name", "addr-name")}
            {F("phone", "Mobile number", "addr-phone")}
            {F("pincode", "PIN code", "addr-pin")}
            <div className="sm:col-span-2">{F("address", "Street & house address", "addr-street")}</div>
            {F("city", "City", "addr-city")}
            {F("state", "State", "addr-state")}
            <label className="flex items-center gap-2.5 text-sm text-neutral-700 sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-[#7A184E]" {...register("isDefault")} /> Make this my default address
            </label>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="btn btn-outline !py-3">Cancel</button>
            <button disabled={isSubmitting} className="btn btn-primary !py-3">{isSubmitting ? <Loader2 size={15} className="animate-spin" /> : "Save address"}</button>
          </div>
        </form>
      ) : items === null ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#7A184E]/8 text-[#7A184E]"><MapPin size={22} /></span>
          <p className="mt-3 text-base font-semibold text-ink">No addresses saved yet</p>
          <p className="mt-1 text-sm text-neutral-500">Add an address to speed up checkout.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((a) => (
            <div key={a._id} className={clsx(card, "flex flex-col p-5 transition hover:border-[#7A184E]/30 hover:shadow-md")}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"><MapPin size={11} /> {a.label || "Address"}</span>
                  {a.isDefault && <span className="rounded-full bg-[#7A184E]/10 px-2.5 py-1 text-xs font-medium text-[#7A184E]">Default</span>}
                </div>
                <span className="flex gap-0.5">
                  <button aria-label="Edit address" onClick={() => setEditing(a)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-[#7A184E]"><Pencil size={15} /></button>
                  <button aria-label="Delete address" onClick={() => del(a._id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </span>
              </div>
              <p className="text-sm font-semibold text-ink">{a.name}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{a.phone}</p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{a.address}, {a.city}, {a.state} — {a.pincode}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
