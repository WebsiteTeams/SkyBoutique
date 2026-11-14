"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, GripVertical, ImagePlus, Loader2, Upload, X, Search, type LucideIcon } from "lucide-react";
import { api } from "@/utils";
import { useToast } from "@/hooks/providers";
import { ErrorState, SmartImage, Skeleton } from "@/components/common/ui";

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
      <div><h1 className="text-xl font-semibold tracking-tight text-[#120A1E] sm:text-2xl md:text-3xl">{title}</h1>{sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(18,10,30,0.04)] ${className}`}>
      {title && <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3.5 sm:px-5"><h2 className="text-[13px] font-semibold text-[#120A1E]">{title}</h2>{actions}</header>}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-black/50 sm:items-start sm:p-6 lg:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal aria-label={title} className={`max-h-[94svh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-none sm:overflow-visible sm:rounded-xl ${wide ? "max-w-4xl" : "max-w-xl"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b bg-white px-4 py-3.5 sm:static sm:rounded-t-xl sm:px-5 sm:py-4"><h2 className="min-w-0 truncate font-display text-xl sm:text-2xl">{title}</h2><button onClick={onClose} aria-label="Close" className="-mr-1 shrink-0 rounded-lg p-1.5 hover:bg-neutral-100"><X size={20} /></button></div>
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint, className = "" }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return <div className={className}><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}</div>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-royal" : "bg-neutral-300"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [v, setV] = useState(value);
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return (
    <div className="relative w-full min-w-0 sm:min-w-56 sm:max-w-xs sm:flex-1">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
      <input className="input !pl-9" placeholder={placeholder} value={v} aria-label={placeholder} onChange={(e) => { setV(e.target.value); clearTimeout(t.current); t.current = setTimeout(() => onChange(e.target.value), 350); }} />
    </div>
  );
}

export type Paged<T> = { items: T[]; total: number; page: number; pages: number };

/** Paged fetch hook with params object. */
export const PAGE_SIZE = 10;

export function useList<T>(url: string, params: Record<string, string | number | undefined> = {}) {
  const [data, setData] = useState<Paged<T> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify({ limit: PAGE_SIZE, ...params });
  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(JSON.parse(key))) if (v !== undefined && v !== "") qs.set(k, String(v));
    try { setData(await api<Paged<T>>(`${url}?${qs}`)); setError(""); } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, [url, key]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load };
}

/** Scroll container: optional fixed height, hidden scrollbar, edge fades, and mouse drag-to-pan (no visible scrollbar needed). */
function ScrollArea({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false, down: false });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, moved: false, x: 0, y: 0, sl: 0, st: 0 });

  const measure = useCallback(() => {
    const el = ref.current; if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4, down: el.scrollTop + el.clientHeight < el.scrollHeight - 4 });
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current; if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure); ro.observe(el); if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => { el.removeEventListener("scroll", measure); ro.disconnect(); };
  }, [enabled, measure, children]);

  const stop = () => { if (drag.current.active) { drag.current.active = false; setDragging(false); } };
  if (!enabled) return <div className="overflow-x-auto rounded-xl">{children}</div>;
  return (
    <div className="relative">
      <div ref={ref} className={`no-scrollbar max-h-[calc(100vh-17rem)] min-h-[16rem] overflow-auto overscroll-contain rounded-xl ${dragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
        onMouseDown={(e) => {
          if (e.button !== 0 || (e.target as HTMLElement).closest("button,a,input,select,textarea,label,[role=switch]")) return;
          const el = ref.current; if (!el) return;
          drag.current = { active: true, moved: false, x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
        }}
        onMouseMove={(e) => {
          const d = drag.current, el = ref.current; if (!d.active || !el) return;
          const dx = e.clientX - d.x, dy = e.clientY - d.y;
          if (!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
          if (!d.moved) { d.moved = true; setDragging(true); }
          el.scrollLeft = d.sl - dx; el.scrollTop = d.st - dy;
        }}
        onMouseUp={stop} onMouseLeave={stop}
        onClickCapture={(e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; } }}>
        {children}
      </div>
      {edges.left && <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-10 rounded-l-xl bg-gradient-to-r from-white to-transparent" />}
      {edges.right && <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-14 rounded-r-xl bg-gradient-to-l from-white to-transparent" />}
      {edges.down && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-xl bg-gradient-to-t from-white to-transparent" />}
    </div>
  );
}

export function Table<T extends { _id?: string }>({ cols, rows, loading, error, retry, empty = "Nothing here yet.", page, pages, total, onPage, onRow, scrollable }: {
  cols: { h: string; cell: (r: T) => ReactNode; className?: string; full?: boolean }[]; rows?: T[]; loading?: boolean; error?: string; retry?: () => void; empty?: string;
  page?: number; pages?: number; total?: number; onPage?: (p: number) => void; onRow?: (r: T) => void;
  /** Fixed-height scroll area with sticky header, hidden scrollbar, edge fades and drag-to-pan. */
  scrollable?: boolean;
}) {
  if (error) return <ErrorState message={error} retry={retry} />;
  const labelled = cols.filter((c) => c.h && c.h !== "#");
  const head = labelled[0];
  const fields = labelled.slice(1);
  const actions = cols.filter((c) => !c.h);
  return (
    <div>
      <div className="hidden rounded-xl border md:block border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(18,10,30,0.04)]">
        <ScrollArea enabled={!!scrollable}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={`bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 ${scrollable ? "sticky top-0 z-10 shadow-[0_1px_0_#e5e5e5]" : ""}`}><tr>{cols.map((c) => <th key={c.h} className={`px-4 py-3 font-medium ${scrollable ? "bg-neutral-50" : ""} ${c.className ?? ""}`}>{c.h}</th>)}</tr></thead>
          <tbody className="divide-y divide-neutral-100">
            {loading && !rows ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={cols.length} className="p-3"><Skeleton className="h-8 w-full" /></td></tr>) :
              rows?.length ? rows.map((r, i) => (
                <tr key={r._id ?? i} onClick={onRow ? () => onRow(r) : undefined} className={`${onRow ? "cursor-pointer hover:bg-neutral-50" : ""} ${loading ? "opacity-50" : ""}`}>
                  {cols.map((c) => <td key={c.h} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>{c.cell(r)}</td>)}
                </tr>
              )) : <tr><td colSpan={cols.length} className="px-4 py-12 text-center text-neutral-500">{empty}</td></tr>}
          </tbody>
        </table>
        </ScrollArea>
      </div>

      {/* phones: each row becomes a card (first column = title, other columns = label/value pairs, unnamed columns = actions) */}
      <ul className={`space-y-3 md:hidden ${loading && rows ? "opacity-60" : ""}`}>
        {loading && !rows ? Array.from({ length: 4 }).map((_, i) => <li key={i}><Skeleton className="h-28 w-full rounded-xl" /></li>) :
          rows?.length ? rows.map((r, i) => (
            <li key={r._id ?? i}>
              <div onClick={onRow ? () => onRow(r) : undefined} className={`rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(18,10,30,0.04)] ${onRow ? "cursor-pointer active:bg-neutral-50" : ""}`}>
                {head && <div className="min-w-0 text-sm">{head.cell(r)}</div>}
                {fields.length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-neutral-100 pt-3">
                    {fields.map((c) => (
                      <div key={c.h} className={`min-w-0 ${c.full ? "col-span-2" : ""}`}><dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{c.h}</dt><dd className="mt-1 break-words text-sm">{c.cell(r)}</dd></div>
                    ))}
                  </dl>
                )}
                {actions.length > 0 && <div className="mt-3 flex items-center justify-end gap-1 border-t border-neutral-100 pt-3" onClick={(e) => e.stopPropagation()}>{actions.map((c, k) => <div key={k}>{c.cell(r)}</div>)}</div>}
              </div>
            </li>
          )) : <li className="rounded-xl border border-neutral-200/80 bg-white px-4 py-12 text-center text-sm text-neutral-500">{empty}</li>}
      </ul>
      {page !== undefined && pages !== undefined && onPage && <Pager page={page} pages={pages} total={total} onChange={onPage} />}
    </div>
  );
}

function Pager({ page, pages, total, onChange }: { page: number; pages: number; total?: number; onChange: (p: number) => void }) {
  if (total === undefined ? pages <= 1 : total === 0) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total ?? page * PAGE_SIZE);
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  const btn = "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-neutral-500">{total !== undefined ? <>Showing <b className="font-medium text-neutral-700">{from}–{to}</b> of <b className="font-medium text-neutral-700">{total}</b></> : <>Page {page} of {pages}</>}</p>
      {pages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button className={`${btn} border-neutral-200 hover:bg-neutral-50`} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>
          {list.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && list[i - 1] !== p - 1 && <span className="px-1 text-neutral-400">…</span>}
              <button onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined} className={`${btn} ${p === page ? "border-[#7A184E] bg-[#7A184E] text-white" : "border-neutral-200 hover:bg-neutral-50"}`}>{p}</button>
            </span>
          ))}
          <button className={`${btn} border-neutral-200 hover:bg-neutral-50`} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={14} /></button>
        </nav>
      )}
    </div>
  );
}

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Image manager: drag & drop files to upload, drag thumbnails to reorder (first image = main), click to browse. */
export function ImageUploader({ images, onChange, max = 8, single }: { images: string[]; onChange: (v: string[]) => void; max?: number; single?: boolean }) {
  const { toast } = useToast();
  const [pending, setPending] = useState(0);
  const [fileOver, setFileOver] = useState(false); // OS files being dragged over the zone
  const [dragIdx, setDragIdx] = useState<number | null>(null); // thumbnail being reordered
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const busy = pending > 0;
  const room = single ? 1 : max - images.length;
  const canAdd = single ? true : room > 0;

  const upload = async (incoming: FileList | File[] | null) => {
    const all = Array.from(incoming ?? []);
    if (!all.length) return;
    const valid = all.filter((f) => {
      if (!ACCEPT.includes(f.type)) { toast(`${f.name}: only JPEG, PNG or WebP images are allowed`, "err"); return false; }
      if (f.size > MAX_BYTES) { toast(`${f.name} is larger than 5MB`, "err"); return false; }
      return true;
    });
    if (!valid.length) return;
    const list = single ? valid.slice(0, 1) : valid.slice(0, Math.max(room, 0));
    if (!single && valid.length > list.length) toast(`Only ${max} images allowed. Extra files were skipped.`, "err");
    if (!list.length) return;
    setPending(list.length);
    try {
      const fd = new FormData();
      list.forEach((x) => fd.append("files", x));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      onChange(single ? [d.urls[0]] : [...images, ...d.urls].slice(0, max));
      toast(`${d.urls.length} image${d.urls.length > 1 ? "s" : ""} uploaded`);
    } catch (e) { toast((e as Error).message, "err"); }
    setPending(0);
    if (input.current) input.current.value = "";
  };

  const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");
  const zone = {
    onDragEnter: (e: React.DragEvent) => { if (!isFileDrag(e)) return; e.preventDefault(); depth.current++; setFileOver(true); },
    onDragOver: (e: React.DragEvent) => { if (!isFileDrag(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; },
    onDragLeave: (e: React.DragEvent) => { if (!isFileDrag(e)) return; depth.current = Math.max(0, depth.current - 1); if (depth.current === 0) setFileOver(false); },
    onDrop: (e: React.DragEvent) => { if (!isFileDrag(e)) return; e.preventDefault(); depth.current = 0; setFileOver(false); upload(e.dataTransfer.files); },
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const endDrag = () => { setDragIdx(null); setOverIdx(null); };

  const tile = "relative h-36 w-28 shrink-0 overflow-hidden rounded-lg border bg-lavender transition";

  return (
    <div {...zone} className={`relative rounded-xl border-2 border-dashed p-4 transition ${fileOver ? "border-[#7A184E] bg-[#7A184E]/5" : "border-neutral-200 bg-neutral-50/60"}`}>
      {fileOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl bg-[#7A184E]/90 text-white">
          <Upload size={28} /><p className="text-sm font-semibold">Drop {single ? "image" : "images"} to upload</p><p className="text-xs text-white/70">JPEG, PNG or WebP · up to 5 MB</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={src + i} draggable={!single && !busy} role="listitem"
            onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
            onDragOver={(e) => { if (dragIdx === null) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overIdx !== i) setOverIdx(i); }}
            onDrop={(e) => { if (dragIdx === null) return; e.preventDefault(); move(dragIdx, i); endDrag(); }}
            onDragEnd={endDrag}
            className={`${tile} group ${!single ? "cursor-grab active:cursor-grabbing" : ""} ${dragIdx === i ? "scale-95 opacity-40" : ""} ${overIdx === i && dragIdx !== null && dragIdx !== i ? "ring-2 ring-[#7A184E] ring-offset-2" : "border-neutral-200"}`}>
            <SmartImage src={src} alt={`Image ${i + 1}`} className="pointer-events-none h-full w-full" />
            {i === 0 && !single && <span className="absolute left-1.5 top-1.5 rounded bg-[#D4AF37] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#120A1E]">Main</span>}
            {!single && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-neutral-500 opacity-0 shadow transition group-hover:opacity-100"><GripVertical size={13} /></span>}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1.5 pt-6 text-white opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
              {!single ? (
                <span className="flex gap-0.5">
                  <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => move(i, i - 1)} className="rounded p-1 hover:bg-white/25 disabled:opacity-30"><ChevronLeft size={14} /></button>
                  <button type="button" aria-label="Move right" disabled={i === images.length - 1} onClick={() => move(i, i + 1)} className="rounded p-1 hover:bg-white/25 disabled:opacity-30"><ChevronRight size={14} /></button>
                </span>
              ) : <span />}
              <button type="button" aria-label="Remove image" onClick={() => onChange(images.filter((_, k) => k !== i))} className="rounded p-1 hover:bg-red-600"><X size={14} /></button>
            </div>
          </div>
        ))}

        {Array.from({ length: pending }).map((_, i) => (
          <div key={"p" + i} className={`${tile} skeleton flex items-center justify-center border-neutral-200`}><Loader2 className="animate-spin text-[#7A184E]" size={22} /></div>
        ))}

        {canAdd && !busy && (
          <button type="button" onClick={() => input.current?.click()}
            className="flex h-36 min-w-28 flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 bg-white px-4 text-center text-neutral-500 transition hover:border-[#7A184E] hover:text-[#7A184E] sm:flex-none sm:basis-44">
            <ImagePlus size={24} strokeWidth={1.4} />
            <span className="text-xs font-medium">{images.length ? "Add more" : single ? "Add image" : "Add images"}</span>
            <span className="text-[10px] text-neutral-400">Drag &amp; drop or click</span>
          </button>
        )}
      </div>

      <p className="mt-3 text-[11px] text-neutral-500">
        {single ? "Drag a file here or click to choose." : images.length > 1 ? "Drag thumbnails to reorder · the first image is the main photo." : "Drag files from your computer into this box, or click to browse."}
        {!single && <span className="ml-1 text-neutral-400">({images.length}/{max})</span>}
      </p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={!single} hidden onChange={(e) => upload(e.target.files)} />
    </div>
  );
}

export function Stat({ label, value, sub, tone, icon: Icon }: { label: string; value: ReactNode; sub?: string; tone?: "warn"; icon?: LucideIcon }) {
  const warn = tone === "warn";
  return (
    <div className="min-w-0 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(18,10,30,0.04)] transition hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium leading-snug text-neutral-500 sm:text-xs">{label}</p>
        {Icon && <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${warn ? "bg-amber-50 text-amber-600" : "bg-[#7A184E]/8 text-royal"}`}><Icon size={17} /></span>}
      </div>
      <p className={`mt-2 truncate text-2xl font-semibold tabular-nums tracking-tight sm:mt-3 sm:text-3xl ${warn ? "text-amber-600" : "text-[#120A1E]"}`}>{value}</p>
      {sub && <p className="mt-1 line-clamp-2 text-[11px] text-neutral-500 sm:mt-1.5 sm:text-xs">{sub}</p>}
    </div>
  );
}

export function Badge({ children, tone = "grey" }: { children: ReactNode; tone?: "grey" | "green" | "red" | "amber" | "purple" }) {
  const c = { grey: "bg-neutral-100 text-neutral-700", green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", red: "bg-red-50 text-red-700 ring-red-600/20", amber: "bg-amber-50 text-amber-700 ring-amber-600/20", purple: "bg-[#7A184E]/8 text-royal ring-[#7A184E]/20" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-transparent ${c}`}>{children}</span>;
}
