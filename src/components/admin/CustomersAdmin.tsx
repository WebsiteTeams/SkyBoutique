"use client";
import { useState } from "react";
import { api, fmtDate, inr } from "@/utils";
import { useToast } from "@/hooks/providers";
import { Badge, Modal, PageHeader, SearchBox, Table, useList } from "./kit";
import { StatusBadge } from "@/components/checkout/OrderView";

type C = { _id: string; name: string; email: string; phone?: string; blocked?: boolean; createdAt: string; orders: number; spent: number };
type Detail = { user: C; orders: { _id: string; orderNumber: string; total: number; status: string; createdAt: string }[]; addresses: { _id: string; address: string; city: string; state: string; pincode: string }[]; spent: number };

export function CustomersAdmin() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useList<C>("/api/admin/customers", { q, page });
  const [d, setD] = useState<Detail | null>(null);
  const open = async (c: C) => { try { setD(await api<Detail>(`/api/admin/customers/${c._id}`)); } catch (e) { toast((e as Error).message, "err"); } };
  const block = async (blocked: boolean) => {
    if (!d) return;
    try { await api(`/api/admin/customers/${d.user._id}`, { method: "PATCH", json: { blocked } }); setD({ ...d, user: { ...d.user, blocked } }); toast(blocked ? "Customer blocked" : "Customer unblocked"); reload(); }
    catch (e) { toast((e as Error).message, "err"); }
  };
  return (
    <div>
      <PageHeader title="Customers" sub={data ? `${data.total} registered customers` : undefined} />
      <div className="mb-4"><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Name, email or phone" /></div>
      <Table<C> rows={data?.items} loading={loading} error={error} retry={reload} page={data?.page} pages={data?.pages} onPage={setPage} onRow={open} empty="No customers yet."
        cols={[
          { h: "Customer", cell: (c) => <div><p className="font-medium">{c.name}</p><p className="text-xs text-neutral-500">{c.email}</p></div> },
          { h: "Phone", cell: (c) => c.phone || "—" }, { h: "Joined", cell: (c) => fmtDate(c.createdAt) },
          { h: "Orders", cell: (c) => c.orders }, { h: "Total spent", cell: (c) => inr(c.spent) },
          { h: "Status", cell: (c) => c.blocked ? <Badge tone="red">Blocked</Badge> : <Badge tone="green">Active</Badge> },
        ]} />
      <Modal open={!!d} onClose={() => setD(null)} title={d?.user.name ?? ""} wide>
        {d && (
          <div className="space-y-6 text-sm">
            <div className="grid gap-4 sm:grid-cols-3"><div><p className="label">Email</p>{d.user.email}</div><div><p className="label">Phone</p>{d.user.phone || "—"}</div><div><p className="label">Lifetime spend</p><span className="font-display text-2xl">{inr(d.spent)}</span></div></div>
            <div><p className="label">Addresses</p>{d.addresses.length ? <ul className="space-y-1 text-neutral-600">{d.addresses.map((a) => <li key={a._id}>{a.address}, {a.city}, {a.state} {a.pincode}</li>)}</ul> : <p className="text-neutral-500">None saved</p>}</div>
            <div><p className="label">Purchase history</p>{d.orders.length ? <ul className="divide-y border">{d.orders.map((o) => <li key={o._id} className="flex items-center justify-between p-2.5"><span>{o.orderNumber} <span className="text-xs text-neutral-500">{fmtDate(o.createdAt)}</span></span><span className="flex items-center gap-3"><StatusBadge status={o.status} />{inr(o.total)}</span></li>)}</ul> : <p className="text-neutral-500">No orders yet</p>}</div>
            <button onClick={() => block(!d.user.blocked)} className={`btn ${d.user.blocked ? "btn-primary" : "btn-outline"}`}>{d.user.blocked ? "Unblock customer" : "Block customer"}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
