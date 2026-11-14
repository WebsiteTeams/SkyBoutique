"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, fmtDate, inr } from "@/utils";
import { Card, PageHeader, Stat } from "./kit";
import { ErrorState, Skeleton } from "@/components/common/ui";

type R = {
  series: { label: string; revenue: number; orders: number }[];
  top: { _id: string; name: string; units: number; revenue: number }[];
  categories: { _id: string; units: number; revenue: number }[];
  customers: { _id: string; name: string; orders: number; spent: number; last: string }[];
};
const RANGES = [["daily", "Daily (30 days)"], ["weekly", "Weekly (12 weeks)"], ["monthly", "Monthly (12 months)"], ["yearly", "Yearly"]] as const;

export function ReportsAdmin() {
  const [range, setRange] = useState<(typeof RANGES)[number][0]>("daily");
  const [d, setD] = useState<R | null>(null);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  useEffect(() => { setD(null); api<R>(`/api/admin/reports?range=${range}`).then(setD).catch((e) => setError(e.message)); }, [range]);
  if (error) return <ErrorState message={error} />;

  const total = d?.series.reduce((s, r) => s + r.revenue, 0) ?? 0;
  const orders = d?.series.reduce((s, r) => s + r.orders, 0) ?? 0;
  const csv = `/api/admin/reports?format=csv${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" sub="Sales, product, category and customer performance"
        actions={<div className="flex flex-wrap items-end gap-2"><input type="date" aria-label="From date" className="input !w-auto !py-2" value={from} onChange={(e) => setFrom(e.target.value)} /><input type="date" aria-label="To date" className="input !w-auto !py-2" value={to} onChange={(e) => setTo(e.target.value)} /><a href={csv} className="btn btn-dark !py-2.5"><Download size={15} /> Export orders (CSV)</a></div>} />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{RANGES.map(([k, l]) => <button key={k} onClick={() => setRange(k)} className={`px-3 py-2 text-xs sm:px-4 sm:text-sm ${range === k ? "bg-ink text-white" : "border bg-white hover:bg-lavender"}`}>{l}</button>)}</div>

      {!d ? <Skeleton className="h-96 w-full" /> : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"><div className="col-span-2 sm:col-span-1"><Stat label="Revenue in period" value={inr(total)} /></div><Stat label="Orders in period" value={orders} /><Stat label="Average order value" value={orders ? inr(total / orders) : "—"} /></div>
          <Card title="Sales over time">
            {d.series.length === 0 ? <p className="py-16 text-center text-sm text-neutral-500">No sales in this period.</p> : (
              <div className="h-56 sm:h-72" role="img" aria-label="Sales over time">
                <ResponsiveContainer><AreaChart data={d.series} margin={{ left: -10, right: 8 }}>
                  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7200F5" stopOpacity={0.25} /><stop offset="1" stopColor="#7200F5" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece8f3" /><XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} interval="preserveStartEnd" tickFormatter={(l: string) => (l.length > 7 ? l.slice(5) : l)} /><YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                  <Tooltip formatter={(v) => inr(Number(v))} /><Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7200F5" strokeWidth={2} fill="url(#g)" /></AreaChart></ResponsiveContainer>
              </div>
            )}
          </Card>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Category performance">
              {d.categories.length === 0 ? <p className="py-8 text-center text-sm text-neutral-500">No data.</p> : (
                <div style={{ height: Math.max(220, d.categories.length * 44) }} role="img" aria-label="Revenue by category"><ResponsiveContainer width="100%" height="100%"><BarChart data={d.categories} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ece8f3" /><XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} /><YAxis type="category" dataKey="_id" tick={{ fontSize: 11 }} width={88} />
                  <Tooltip formatter={(v) => inr(Number(v))} /><Bar dataKey="revenue" name="Revenue" fill="#4B0082" radius={[0, 2, 2, 0]} /></BarChart></ResponsiveContainer></div>
              )}
            </Card>
            <Card title="Product performance">
              {d.top.length === 0 ? <p className="py-8 text-center text-sm text-neutral-500">No data.</p> : (
                <table className="w-full text-sm"><thead className="text-left text-[11px] uppercase tracking-wider text-neutral-500"><tr><th className="pb-2">Product</th><th className="pb-2 text-right">Units</th><th className="pb-2 text-right">Revenue</th></tr></thead>
                  <tbody className="divide-y">{d.top.map((p) => <tr key={p._id}><td className="py-2">{p.name}</td><td className="text-right">{p.units}</td><td className="text-right">{inr(p.revenue)}</td></tr>)}</tbody></table>
              )}
            </Card>
          </div>
          <Card title="Customer report (top spenders)">
            {d.customers.length === 0 ? <p className="py-8 text-center text-sm text-neutral-500">No data.</p> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm"><thead className="text-left text-[11px] uppercase tracking-wider text-neutral-500"><tr><th className="pb-2">Customer</th><th className="pb-2">Email</th><th className="pb-2 text-right">Orders</th><th className="pb-2 text-right">Spent</th><th className="pb-2 text-right">Last order</th></tr></thead>
                <tbody className="divide-y">{d.customers.map((c) => <tr key={c._id}><td className="py-2">{c.name}</td><td>{c._id}</td><td className="text-right">{c.orders}</td><td className="text-right">{inr(c.spent)}</td><td className="text-right">{fmtDate(c.last)}</td></tr>)}</tbody></table></div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
