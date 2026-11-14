"use client";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api, fmtDate } from "@/utils";
import { useToast } from "@/hooks/providers";
import { Badge, Field, Modal, PageHeader, Table, useList } from "./kit";

type Status = "approved" | "hidden";
type T = { _id?: string; name: string; city: string; rating: number; text: string; status: Status; createdAt?: string };

const TABS: { key: Status | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "approved", label: "Published" },
  { key: "hidden", label: "Hidden" },
];
const blank: T = { name: "", city: "", rating: 5, text: "", status: "approved" };

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= value ? "fill-[#D4AF37] text-[#D4AF37]" : "text-neutral-200"} />)}
    </span>
  );
}

export function TestimonialsAdmin() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Status | "">("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useList<T>("/api/admin/testimonials", { status: tab, page });
  const [edit, setEdit] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setSaving(true);
    try {
      const body = { name: edit.name, city: edit.city, rating: edit.rating, text: edit.text, status: edit.status };
      if (edit._id) await api(`/api/admin/testimonials/${edit._id}`, { method: "PUT", json: body });
      else await api("/api/admin/testimonials", { method: "POST", json: body });
      toast(edit._id ? "Testimonial updated" : "Testimonial added");
      setEdit(null);
      reload();
    } catch (er) { toast((er as Error).message, "err"); }
    setSaving(false);
  };
  const toggle = async (t: T) => {
    const status: Status = t.status === "approved" ? "hidden" : "approved";
    try {
      await api(`/api/admin/testimonials/${t._id}`, { method: "PUT", json: { status } });
      toast(status === "approved" ? "Now shown on the home page" : "Hidden from the home page");
      reload();
    } catch (er) { toast((er as Error).message, "err"); }
  };
  const del = async (t: T) => {
    if (!confirm(`Delete the testimonial from "${t.name}"? This cannot be undone.`)) return;
    try { await api(`/api/admin/testimonials/${t._id}`, { method: "DELETE" }); toast("Testimonial deleted"); reload(); } catch (er) { toast((er as Error).message, "err"); }
  };

  return (
    <div>
      <PageHeader
        title="Testimonials"
        sub="Reviews you add here are shown on the home page. Customers cannot submit reviews on the website."
        actions={<button onClick={() => setEdit(blank)} className="btn btn-primary !py-2.5"><Plus size={15} /> Add testimonial</button>}
      />

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by visibility">
        {TABS.map((x) => (
          <button key={x.label} role="tab" aria-selected={tab === x.key} onClick={() => { setTab(x.key); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === x.key ? "bg-[#7A184E] text-white" : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"}`}>
            {x.label}
          </button>
        ))}
      </div>

      <Table<T>
        rows={data?.items} loading={loading} error={error} retry={reload}
        page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage}
        empty="No testimonials yet — click “Add testimonial” to write your first one."
        cols={[
          { h: "Customer", cell: (t) => <div><p className="font-medium">{t.name}</p><p className="text-xs text-neutral-500">{t.city || "—"}</p></div> },
          { h: "Rating", cell: (t) => <Stars value={t.rating} /> },
          { h: "Review", full: true, cell: (t) => <p className="line-clamp-3 max-w-md text-neutral-700">{t.text}</p> },
          { h: "Added", cell: (t) => <span className="whitespace-nowrap text-neutral-500">{t.createdAt ? fmtDate(t.createdAt) : "—"}</span> },
          { h: "Status", cell: (t) => (t.status === "approved" ? <Badge tone="green">Published</Badge> : <Badge>Hidden</Badge>) },
          { h: "", className: "text-right", cell: (t) => (
            <div className="flex justify-end gap-1">
              <button aria-label={t.status === "approved" ? "Hide from website" : "Show on website"} title={t.status === "approved" ? "Hide from website" : "Show on website"} onClick={() => toggle(t)} className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-ink">
                {t.status === "approved" ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button aria-label="Edit" onClick={() => setEdit(t)} className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-ink"><Pencil size={16} /></button>
              <button aria-label="Delete" onClick={() => del(t)} className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          ) },
        ]}
      />

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? "Edit testimonial" : "Add testimonial"}>
        {edit && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer name *"><input className="input" required maxLength={80} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="City"><input className="input" maxLength={80} value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></Field>
            </div>
            <Field label="Rating">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={edit.rating === n} onClick={() => setEdit({ ...edit, rating: n })} className="p-0.5">
                    <Star size={26} className={n <= edit.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-neutral-300"} />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Review *" hint={`${edit.text.length}/600`}>
              <textarea className="input" rows={4} required minLength={10} maxLength={600} value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} placeholder="What the customer said about their purchase…" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={edit.status === "approved"} onChange={(e) => setEdit({ ...edit, status: e.target.checked ? "approved" : "hidden" })} />
              Show on the home page
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEdit(null)} className="btn btn-outline !py-2.5">Cancel</button>
              <button disabled={saving} className="btn btn-primary !py-2.5">{saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : "Save"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
