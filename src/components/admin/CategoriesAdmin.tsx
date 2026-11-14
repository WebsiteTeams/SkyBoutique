"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, GripVertical, ImageIcon, LayoutGrid, List, Loader2, Package, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { api, slugify } from "@/utils";
import { useToast } from "@/hooks/providers";
import { Badge, Field, ImageUploader, Modal, PageHeader, SearchBox, Stat, Table, Toggle, useList } from "./kit";
import { EmptyState, SmartImage } from "@/components/common/ui";

type C = { _id?: string; name: string; slug: string; description: string; image: string; visible: boolean; sortOrder: number; productCount?: number; publishedCount?: number };
const blank: C = { name: "", slug: "", description: "", image: "", visible: true, sortOrder: 0 };
const body = (c: C, sortOrder = c.sortOrder) => ({ name: c.name, slug: c.slug || slugify(c.name), description: c.description, image: c.image, visible: c.visible, sortOrder });

export function CategoriesAdmin() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useList<C>("/api/admin/categories", { limit: 100 });
  const [items, setItems] = useState<C[]>([]);
  const [q, setQ] = useState("");
  const [vis, setVis] = useState<"" | "visible" | "hidden">("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [edit, setEdit] = useState<C | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => { if (data) setItems(data.items); }, [data]);
  useEffect(() => { try { const v = localStorage.getItem("sky_admin_categories_view"); if (v === "grid" || v === "list") setView(v); } catch {} }, []);
  const changeView = (v: "grid" | "list") => { setView(v); try { localStorage.setItem("sky_admin_categories_view", v); } catch {} };

  const stats = useMemo(() => ({
    total: items.length, visible: items.filter((c) => c.visible).length,
    products: items.reduce((s, c) => s + (c.productCount ?? 0), 0),
  }), [items]);

  const filtered = useMemo(() => items.filter((c) => (!q || `${c.name} ${c.slug}`.toLowerCase().includes(q.toLowerCase())) && (!vis || (vis === "visible" ? c.visible : !c.visible))), [items, q, vis]);
  const canReorder = !q && !vis;

  const openNew = () => { setSlugTouched(false); setEdit({ ...blank, sortOrder: items.length }); };
  const openEdit = (c: C) => { setSlugTouched(true); setEdit(c); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return;
    setSaving(true);
    try {
      if (edit._id) await api(`/api/admin/categories/${edit._id}`, { method: "PUT", json: body(edit) });
      else await api("/api/admin/categories", { method: "POST", json: body(edit) });
      toast(edit._id ? "Category updated" : "Category created"); setEdit(null); reload();
    } catch (er) { toast((er as Error).message, "err"); }
    setSaving(false);
  };
  const del = async (c: C) => {
    if (!confirm(`Delete category "${c.name}"? This cannot be undone.`)) return;
    try { await api(`/api/admin/categories/${c._id}`, { method: "DELETE" }); toast("Category deleted"); reload(); } catch (er) { toast((er as Error).message, "err"); }
  };
  const toggleVisible = async (c: C, visible: boolean) => {
    setItems((cur) => cur.map((x) => (x._id === c._id ? { ...x, visible } : x)));
    try { await api(`/api/admin/categories/${c._id}`, { method: "PUT", json: body({ ...c, visible }) }); toast(visible ? "Category is now visible" : "Category hidden from store"); reload(); }
    catch (er) { toast((er as Error).message, "err"); reload(); }
  };

  /** Persist a new order (sortOrder = position) for every category whose position changed. */
  const persistOrder = async (next: C[]) => {
    const prev = items;
    setItems(next); setOrdering(true);
    try {
      for (let i = 0; i < next.length; i++) {
        const c = next[i];
        if (prev.find((x) => x._id === c._id)?.sortOrder !== i || prev[i]?._id !== c._id) await api(`/api/admin/categories/${c._id}`, { method: "PUT", json: body(c, i) });
      }
      toast("Order saved");
    } catch (er) { toast((er as Error).message, "err"); }
    setOrdering(false); reload();
  };
  const moveBy = (id: string, delta: number) => {
    const from = items.findIndex((c) => c._id === id), to = from + delta;
    if (to < 0 || to >= items.length) return;
    const next = [...items]; const [it] = next.splice(from, 1); next.splice(to, 0, it);
    persistOrder(next);
  };
  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = items.findIndex((c) => c._id === dragId), to = items.findIndex((c) => c._id === targetId);
    const next = [...items]; const [it] = next.splice(from, 1); next.splice(to, 0, it);
    setDragId(null); setOverId(null); persistOrder(next);
  };

  const DeleteBtn = ({ c, cls }: { c: C; cls: string }) => (
    <button onClick={() => del(c)} disabled={!!c.productCount} aria-label={`Delete ${c.name}`} title={c.productCount ? `Move or delete its ${c.productCount} product(s) first` : "Delete category"} className={`${cls} disabled:cursor-not-allowed disabled:opacity-35`}><Trash2 size={15} /></button>
  );

  return (
    <div>
      <PageHeader title="Categories" sub="Organise how customers browse your collections." actions={<button onClick={openNew} className="btn btn-primary !rounded-lg !py-3"><Plus size={15} /> Add category</button>} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4">
        <div className="col-span-2 sm:col-span-1"><Stat label="Categories" value={data ? stats.total : "–"} icon={Tags} sub="Collections in your store" /></div>
        <Stat label="Visible in store" value={data ? stats.visible : "–"} icon={Eye} sub={data ? `${stats.total - stats.visible} hidden` : undefined} />
        <Stat label="Products organised" value={data ? stats.products : "–"} icon={Package} sub="Across all categories" />
      </div>

      <div className="mb-5 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(18,10,30,0.04)] sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search categories" />
          <div className="flex flex-wrap gap-2">
            {([["", "All"], ["visible", "Visible"], ["hidden", "Hidden"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setVis(v)} aria-pressed={vis === v} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${vis === v ? "border-[#7A184E] bg-[#7A184E] text-white" : "border-neutral-200 text-neutral-600 hover:border-[#7A184E]/40 hover:text-[#7A184E]"}`}>{l}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {ordering && <span className="flex items-center gap-1.5 text-xs text-neutral-500"><Loader2 size={13} className="animate-spin" /> Saving order…</span>}
            <div className="flex overflow-hidden rounded-lg border border-neutral-200" role="group" aria-label="View">
              {([["grid", LayoutGrid], ["list", List]] as const).map(([v, Icon]) => (
                <button key={v} onClick={() => changeView(v)} aria-pressed={view === v} aria-label={`${v} view`} className={`px-3 py-2.5 transition ${view === v ? "bg-[#120A1E] text-white" : "text-neutral-500 hover:bg-neutral-50"}`}><Icon size={16} /></button>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500">{canReorder ? (view === "grid" ? "Tip: drag a card by its handle to change the order shown in your store." : "Use the arrows to change the order shown in your store.") : "Clear the search and filters to reorder categories."}</p>
      </div>

      {error ? (
        <div className="rounded-xl border bg-white p-10 text-center text-sm text-red-700">{error} <button onClick={reload} className="ml-2 underline">Retry</button></div>
      ) : loading && !data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-white"><EmptyState title={items.length ? "No categories match" : "No categories yet"} text={items.length ? "Try another search or filter." : "Create your first category to start organising products."}
          action={items.length ? <button onClick={() => { setQ(""); setVis(""); }} className="btn btn-outline">Clear filters</button> : <button onClick={openNew} className="btn btn-primary">Add category</button>} /></div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => {
            const idx = items.findIndex((x) => x._id === c._id);
            return (
              <article key={c._id} draggable={canReorder} onDragStart={(e) => { setDragId(c._id!); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", c._id!); }}
                onDragOver={(e) => { if (!dragId) return; e.preventDefault(); if (overId !== c._id) setOverId(c._id!); }} onDrop={(e) => { e.preventDefault(); dropOn(c._id!); }} onDragEnd={() => { setDragId(null); setOverId(null); }}
                className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(18,10,30,0.04)] transition hover:shadow-lg ${dragId === c._id ? "scale-95 opacity-40" : ""} ${overId === c._id && dragId && dragId !== c._id ? "border-[#7A184E] ring-2 ring-[#7A184E]/40" : "border-neutral-200/80"}`}>
                <div className="relative aspect-[4/5] overflow-hidden bg-lavender">
                  <button onClick={() => openEdit(c)} className="block h-full w-full" aria-label={`Edit ${c.name}`}>
                    {c.image ? <SmartImage src={c.image} alt={c.name} className={`h-full w-full transition duration-500 group-hover:scale-105 ${c.visible ? "" : "opacity-50 grayscale"}`} /> : <div className="flex h-full items-center justify-center text-neutral-300"><ImageIcon size={36} strokeWidth={1.1} /></div>}
                  </button>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120A1E]/85 via-[#120A1E]/10 to-transparent" />
                  <span className="pointer-events-none absolute left-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/90 px-2 text-[11px] font-semibold text-[#7A184E]">{idx + 1}</span>
                  {canReorder && <span className="absolute right-3 top-3 flex h-8 w-8 cursor-grab items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow active:cursor-grabbing" title="Drag to reorder"><GripVertical size={15} /></span>}
                  {!c.visible && <span className="pointer-events-none absolute left-3 top-12 flex items-center gap-1 rounded-full bg-[#120A1E]/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"><EyeOff size={11} /> Hidden</span>}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white">
                    <h3 className="break-words font-display text-xl leading-tight sm:text-2xl">{c.name}</h3>
                    <p className="mt-0.5 text-[11px] text-white/70">/{c.slug}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm text-neutral-600">{c.description || <span className="text-neutral-400">No description</span>}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500"><Package size={13} className="text-[#8C6A32]" /> <b className="font-semibold text-[#120A1E]">{c.productCount ?? 0}</b> products · {c.publishedCount ?? 0} live</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                    <Toggle label={c.visible ? "Hide category" : "Show category"} checked={c.visible} onChange={(v) => toggleVisible(c, v)} />
                    <div className="flex items-center gap-0.5">
                      <Link href={`/shop?category=${c.slug}`} target="_blank" aria-label="View in store" className="hidden rounded-md p-2 sm:block text-neutral-500 hover:bg-neutral-100 hover:text-[#120A1E]"><ExternalLink size={15} /></Link>
                      <button onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`} className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-[#120A1E]"><Pencil size={15} /></button>
                      <DeleteBtn c={c} cls="rounded-md p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Table<C> rows={filtered} loading={loading} error=""
          cols={[
            { h: "#", cell: (c) => <span className="tabular-nums text-neutral-400">{items.findIndex((x) => x._id === c._id) + 1}</span> },
            { h: "Category", cell: (c) => <div className="flex items-center gap-3"><div className="h-14 w-11 shrink-0 overflow-hidden rounded-md bg-lavender"><SmartImage src={c.image} alt="" className="h-full w-full" /></div><div className="min-w-0"><p className="font-medium text-[#120A1E]">{c.name}</p><p className="text-xs text-neutral-500">/{c.slug}</p></div></div> },
            { h: "Description", full: true, cell: (c) => <span className="line-clamp-2 max-w-xs text-neutral-600">{c.description || "—"}</span> },
            { h: "Products", cell: (c) => <span className="tabular-nums">{c.productCount ?? 0} <span className="text-xs text-neutral-400">({c.publishedCount ?? 0} live)</span></span> },
            { h: "Status", cell: (c) => <div className="flex items-center gap-2"><Toggle label="Visible" checked={c.visible} onChange={(v) => toggleVisible(c, v)} />{c.visible ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}</div> },
            { h: "Order", cell: (c) => canReorder ? <div className="flex gap-1"><button aria-label="Move up" onClick={() => moveBy(c._id!, -1)} className="rounded p-1.5 hover:bg-neutral-100"><ArrowUp size={14} /></button><button aria-label="Move down" onClick={() => moveBy(c._id!, 1)} className="rounded p-1.5 hover:bg-neutral-100"><ArrowDown size={14} /></button></div> : <span className="text-neutral-300">—</span> },
            { h: "", className: "text-right", cell: (c) => <div className="flex justify-end gap-0.5"><button aria-label={`Edit ${c.name}`} onClick={() => openEdit(c)} className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100"><Pencil size={16} /></button><DeleteBtn c={c} cls="rounded-md p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600" /></div> },
          ]} />
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? "Edit category" : "New category"} wide>
        {edit && (
          <form onSubmit={save} className="grid gap-8 md:grid-cols-[1fr_260px]">
            <div className="space-y-5">
              <Field label="Category name"><input required autoFocus className="input !rounded-lg" placeholder="e.g. Bridal Collection" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value, slug: slugTouched ? edit.slug : slugify(e.target.value) })} /></Field>
              <Field label="URL slug" hint={`Store link: /shop?category=${edit.slug || "your-slug"}`}><input className="input !rounded-lg" value={edit.slug} onChange={(e) => { setSlugTouched(true); setEdit({ ...edit, slug: slugify(e.target.value) }); }} /></Field>
              <Field label="Description" hint={`${edit.description.length}/500 · shown on the collection page`}><textarea rows={4} maxLength={500} className="input !rounded-lg" placeholder="A short, inviting line about this collection…" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <Field label="Cover image" hint="Used on the homepage tiles and collection banner"><ImageUploader single images={edit.image ? [edit.image] : []} onChange={(v) => setEdit({ ...edit, image: v[0] ?? "" })} /></Field>
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                <div><p className="text-sm font-medium text-[#120A1E]">Visible in store</p><p className="text-xs text-neutral-500">Hidden categories disappear from navigation and the homepage.</p></div>
                <Toggle label="Visible" checked={edit.visible} onChange={(v) => setEdit({ ...edit, visible: v })} />
              </div>
              <div className="flex justify-end gap-2 border-t pt-5">
                <button type="button" className="btn btn-outline !rounded-lg !py-2.5" onClick={() => setEdit(null)}>Cancel</button>
                <button disabled={saving} className="btn btn-primary !rounded-lg !py-2.5">{saving ? <Loader2 size={15} className="animate-spin" /> : null} {edit._id ? "Save changes" : "Create category"}</button>
              </div>
            </div>
            <aside className="hidden md:block">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Store preview</p>
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-lavender shadow-md">
                {edit.image ? <SmartImage src={edit.image} alt="" className="h-full w-full" /> : <div className="flex h-full items-center justify-center text-neutral-300"><ImageIcon size={34} strokeWidth={1.1} /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-[#120A1E]/85 via-transparent to-transparent" />
                <div className="absolute inset-3 border border-white/30" aria-hidden />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="font-display text-3xl leading-tight">{edit.name || "Category name"}</h3>
                  <span className="mt-2 inline-block text-[10px] uppercase tracking-[0.25em] opacity-90">Discover →</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-500">{edit.description || "Your description appears here."}</p>
            </aside>
          </form>
        )}
      </Modal>
    </div>
  );
}
