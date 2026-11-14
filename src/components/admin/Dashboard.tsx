"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, IndianRupee, Package, Plus, ShoppingBag, TriangleAlert, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, fmtDate, inr } from "@/utils";
import { Badge, Card, PageHeader, Stat } from "./kit";
import { ErrorState, Skeleton, SmartImage } from "@/components/common/ui";
import { StatusBadge } from "@/components/checkout/OrderView";

type D = {
  revenue: number; totalOrders: number; products: number; customers: number; pending: number; completed: number; threshold: number;
  lowStock: { _id: string; name: string; sku: string; size: string; color: string; stock: number }[];
  recent: { _id: string; orderNumber: string; customer: { name: string }; total: number; status: string; createdAt: string }[];
  monthly: { label: string; revenue: number; orders: number }[];
  top: { _id: string; name: string; image: string; units: number; revenue: number }[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-11" → "Nov" (year added on January / first tick). */
const monthLabel = (l: string) => { const [y, m] = l.split("-"); return MONTHS[Number(m) - 1] ? `${MONTHS[Number(m) - 1]}${m === "01" ? ` '${y.slice(2)}` : ""}` : l; };
const compact = (v: number) => (v >= 100000 ? `${+(v / 100000).toFixed(1)}L` : v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(v));

export function Dashboard() {
  const [d, setD] = useState<D | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<D>("/api/admin/dashboard").then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorState message={error} />;
  if (!d) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Skeleton className="col-span-2 h-28 rounded-xl" />{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Dashboard" sub="Welcome back. Here is how your boutique is performing."
        actions={
          <>
            <Link href="/admin/products/new" className="btn btn-primary !rounded-lg !px-4 !py-2.5 sm:!px-6"><Plus size={15} /> <span className="hidden min-[400px]:inline">Add</span> product</Link>
            <Link href="/admin/orders" className="btn btn-outline !rounded-lg !px-4 !py-2.5 sm:!px-6"><ShoppingBag size={15} /> Orders</Link>
          </>
        } />

      {/* 2 columns on phones, 4 on laptops; revenue takes a double-width slot so the 7 cards fill the grid evenly */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="col-span-2"><Stat icon={IndianRupee} label="Total revenue" value={inr(d.revenue)} sub="Paid online + COD, excl. cancelled" /></div>
        <Stat icon={ShoppingBag} label="Total orders" value={d.totalOrders} />
        <Stat icon={Package} label="Products" value={d.products} />
        <Stat icon={Users} label="Customers" value={d.customers} />
        <Stat icon={Clock} label="Pending orders" value={d.pending} sub="Pending · Confirmed · Processing" />
        <Stat icon={CheckCircle2} label="Completed" value={d.completed} sub="Delivered orders" />
        <Stat icon={TriangleAlert} label="Low-stock variants" value={d.lowStock.length} tone={d.lowStock.length ? "warn" : undefined} sub={`${d.threshold} units or fewer`} />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <Card title="Monthly sales (last 12 months)" className="xl:col-span-2">
          {d.monthly.length === 0 ? <p className="py-12 text-center text-sm text-neutral-500 sm:py-16">No sales yet. Orders will appear here.</p> : (
            <div className="h-56 sm:h-72" role="img" aria-label="Monthly revenue bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.monthly} margin={{ left: -14, right: 4, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee9f1" />
                  <XAxis dataKey="label" tickFormatter={monthLabel} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={8} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} tickFormatter={compact} />
                  <Tooltip labelFormatter={(l) => monthLabel(String(l))} formatter={(v, n) => [n === "revenue" ? inr(Number(v)) : v, n === "revenue" ? "Revenue" : "Orders"]} cursor={{ fill: "#F6F4F1" }} contentStyle={{ borderRadius: 10, border: "1px solid #e8e4ee", fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#7A184E" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Top-selling products">
          {d.top.length === 0 ? <p className="py-10 text-center text-sm text-neutral-500">No sales data yet.</p> : (
            <ol className="space-y-3 sm:space-y-3.5">
              {d.top.map((t, i) => (
                <li key={t._id} className="flex items-center gap-3 text-sm">
                  <span className="w-4 shrink-0 text-neutral-400">{i + 1}</span>
                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-lavender"><SmartImage src={t.image} alt="" className="h-full w-full" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{t.name}</p><p className="text-xs text-neutral-500">{t.units} sold</p></div>
                  <span className="shrink-0 font-medium tabular-nums">{inr(t.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="shrink-0 text-xs font-medium text-royal hover:underline">View all</Link>}>
          {d.recent.length === 0 ? <p className="py-8 text-center text-sm text-neutral-500">No orders yet.</p> : (
            <ul className="divide-y divide-neutral-100 text-sm">
              {d.recent.map((o) => (
                <li key={o._id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link className="block truncate font-medium hover:text-royal" href="/admin/orders">{o.orderNumber}</Link>
                    <p className="truncate text-xs text-neutral-500">{o.customer?.name} · {fmtDate(o.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className="font-medium tabular-nums sm:order-2">{inr(o.total)}</span>
                    <span className="sm:order-1"><StatusBadge status={o.status} /></span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Low-stock alerts" actions={<Link href="/admin/inventory" className="shrink-0 text-xs font-medium text-royal hover:underline">Manage</Link>}>
          {d.lowStock.length === 0 ? <p className="py-8 text-center text-sm text-neutral-500">All variants are well stocked.</p> : (
            <ul className="divide-y divide-neutral-100 text-sm">
              {d.lowStock.map((l) => (
                <li key={l.sku} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0"><p className="truncate font-medium">{l.name}</p><p className="truncate text-xs text-neutral-500">{l.size} · {l.color} · {l.sku}</p></div>
                  <span className="shrink-0">{l.stock === 0 ? <Badge tone="red">Out of stock</Badge> : <Badge tone="amber">{l.stock} left</Badge>}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
