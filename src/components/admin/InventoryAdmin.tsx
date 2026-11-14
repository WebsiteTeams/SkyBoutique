"use client";
import { useState } from "react";
import { api, fmtDateTime } from "@/utils";
import { useToast } from "@/hooks/providers";
import { Badge, PageHeader, SearchBox, Table, useList } from "./kit";

type Row = { _id?: string; productId: string; name: string; sku: string; size: string; color: string; stock: number };
type Log = { _id: string; productName: string; sku: string; change: number; before: number; after: number; reason: string; note?: string; ref?: string; createdAt: string };

export function InventoryAdmin() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"stock" | "logs">("stock");
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const stock = useList<Row & { threshold?: number }>("/api/admin/inventory", { view: "stock", filter, q, page });
  const logs = useList<Log>("/api/admin/inventory", { view: "logs", page });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const threshold = (stock.data as unknown as { threshold?: number })?.threshold ?? 5;

  const apply = async (r: Row, mode: "set" | "add") => {
    const v = edits[r.sku]; if (v === undefined || v === "") return;
    try {
      await api("/api/admin/inventory", { method: "POST", json: { productId: r.productId, sku: r.sku, mode, quantity: Number(v), note: "Manual adjustment" } });
      toast("Stock updated"); setEdits((e) => { const n = { ...e }; delete n[r.sku]; return n; }); stock.reload();
    } catch (e) { toast((e as Error).message, "err"); }
  };

  return (
    <div>
      <PageHeader title="Inventory" sub="Variant-level stock with a full adjustment history" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["stock", "logs"] as const).map((t) => <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-4 py-2 text-sm ${tab === t ? "bg-ink text-white" : "border hover:bg-lavender"}`}>{t === "stock" ? "Stock levels" : "Adjustment history"}</button>)}
        {tab === "stock" && <>
          <select className="input !w-auto" aria-label="Stock filter" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}><option value="">All variants</option><option value="low">Low stock (≤ {threshold})</option><option value="out">Out of stock</option></select>
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Product or SKU" />
        </>}
      </div>
      {tab === "stock" ? (
        <Table<Row> rows={stock.data?.items} loading={stock.loading} error={stock.error} retry={stock.reload} page={stock.data?.page} pages={stock.data?.pages} total={stock.data?.total} onPage={setPage}
          cols={[
            { h: "Product", cell: (r) => <span className="font-medium">{r.name}</span> },
            { h: "SKU", cell: (r) => <code className="text-xs">{r.sku}</code> },
            { h: "Variant", cell: (r) => `${r.size} · ${r.color}` },
            { h: "Stock", cell: (r) => r.stock === 0 ? <Badge tone="red">Out of stock</Badge> : r.stock <= threshold ? <Badge tone="amber">{r.stock} low</Badge> : <span>{r.stock}</span> },
            { h: "Adjust", full: true, cell: (r) => (
              <div className="flex items-center gap-1"><input type="number" className="input !w-24 !py-1.5" placeholder="Qty" aria-label={`Quantity for ${r.sku}`} value={edits[r.sku] ?? ""} onChange={(e) => setEdits({ ...edits, [r.sku]: e.target.value })} />
                <button className="btn btn-dark !px-2.5 !py-1.5 !text-[10px]" onClick={() => apply(r, "set")}>Set</button>
                <button className="btn btn-outline !px-2.5 !py-1.5 !text-[10px]" title="Add (use negative to remove)" onClick={() => apply(r, "add")}>± Add</button></div>) },
          ]} />
      ) : (
        <Table<Log> rows={logs.data?.items} loading={logs.loading} error={logs.error} retry={logs.reload} page={logs.data?.page} pages={logs.data?.pages} total={logs.data?.total} onPage={setPage} empty="No stock movements yet."
          cols={[
            { h: "When", cell: (l) => <span className="text-xs">{fmtDateTime(l.createdAt)}</span> },
            { h: "Product", cell: (l) => <div><p>{l.productName}</p><code className="text-xs text-neutral-500">{l.sku}</code></div> },
            { h: "Change", cell: (l) => <span className={l.change < 0 ? "text-red-600" : "text-emerald-700"}>{l.change > 0 ? "+" : ""}{l.change}</span> },
            { h: "Before → After", cell: (l) => `${l.before} → ${l.after}` },
            { h: "Reason", cell: (l) => <div><Badge tone="purple">{l.reason}</Badge>{(l.ref || l.note) && <p className="mt-0.5 text-xs text-neutral-500">{l.ref ?? l.note}</p>}</div> },
          ]} />
      )}
    </div>
  );
}
