"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { api } from "@/utils";
import type { PublicSettings } from "@/services/settings";

/* ---------------- Toast ---------------- */
type Toast = { id: number; msg: string; type: "ok" | "err" };
const ToastCtx = createContext<{ toast: (msg: string, type?: "ok" | "err") => void }>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

/* ---------------- Auth ---------------- */
export type SessionUser = { id: string; name: string; email: string; phone?: string; role: "customer" | "admin" } | null;
type AuthState = { user: SessionUser; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void>; setUser: (u: SessionUser) => void };
const AuthCtx = createContext<AuthState>({ user: null, loading: true, refresh: async () => {}, logout: async () => {}, setUser: () => {} });
export const useAuth = () => useContext(AuthCtx);

/* ---------------- Cart ---------------- */
export type CartLine = { productId: string; sku: string; qty: number };
type CartState = {
  items: CartLine[]; count: number; ready: boolean; drawerOpen: boolean; setDrawerOpen: (v: boolean) => void;
  add: (line: CartLine, maxQty?: number) => void; setQty: (sku: string, qty: number) => void; remove: (sku: string) => void; clear: () => void;
};
const CartCtx = createContext<CartState>(null as never);
export const useCart = () => useContext(CartCtx);
const CART_KEY = "sky_cart_v1";

/* ---------------- Wishlist ---------------- */
type WishState = { ids: string[]; has: (id: string) => boolean; toggle: (id: string) => Promise<void> };
const WishCtx = createContext<WishState>({ ids: [], has: () => false, toggle: async () => {} });
export const useWishlist = () => useContext(WishCtx);

/* ---------------- Settings ---------------- */
const SettingsCtx = createContext<PublicSettings | null>(null);
export const useSettings = () => useContext(SettingsCtx)!;
export const SettingsProvider = ({ value, children }: { value: PublicSettings; children: ReactNode }) => <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;

function readLocal(): CartLine[] {
  try {
    const v = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(v) ? v.filter((l) => l && typeof l.productId === "string" && typeof l.sku === "string" && l.qty > 0) : [];
  } catch {
    return [];
  }
}
function merge(a: CartLine[], b: CartLine[]) {
  const m = new Map<string, CartLine>();
  for (const l of [...a, ...b]) {
    const prev = m.get(l.sku);
    m.set(l.sku, prev ? { ...prev, qty: Math.min(20, Math.max(prev.qty, l.qty)) } : { ...l });
  }
  return [...m.values()];
}

export function Providers({ children }: { children: ReactNode }) {
  /* toast */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  /* auth */
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const r = await api<{ user: SessionUser }>("/api/auth/me");
      setUser(r.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  /* cart */
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const syncedFor = useRef<string | null>(null);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setItems([]);
    try { localStorage.removeItem(CART_KEY); } catch {}
    window.location.href = "/";
  }, []);

  useEffect(() => { setItems(readLocal()); setReady(true); }, []);

  // When a customer signs in: merge guest cart with the saved server cart.
  useEffect(() => {
    if (!ready || loading) return;
    if (!user) { syncedFor.current = null; return; }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    (async () => {
      try {
        const r = await api<{ items: CartLine[] }>("/api/cart");
        const merged = merge(r.items, readLocal());
        setItems(merged);
        await api("/api/cart", { method: "PUT", json: { items: merged } });
      } catch {}
    })();
  }, [user, ready, loading]);

  // Persist: localStorage always; server for signed-in customers (debounced).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
    if (user && syncedFor.current === user.id) {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => api("/api/cart", { method: "PUT", json: { items } }).catch(() => {}), 600);
    }
  }, [items, ready, user]);

  const add = useCallback((line: CartLine, maxQty = 20) => {
    setItems((cur) => {
      const ex = cur.find((l) => l.sku === line.sku);
      const cap = Math.min(20, maxQty);
      if (ex) return cur.map((l) => (l.sku === line.sku ? { ...l, qty: Math.min(cap, l.qty + line.qty) } : l));
      return [...cur, { ...line, qty: Math.min(cap, line.qty) }];
    });
  }, []);
  const setQty = useCallback((sku: string, qty: number) => setItems((c) => c.map((l) => (l.sku === sku ? { ...l, qty: Math.max(1, Math.min(20, qty)) } : l))), []);
  const remove = useCallback((sku: string) => setItems((c) => c.filter((l) => l.sku !== sku)), []);
  const clear = useCallback(() => setItems([]), []);

  /* wishlist */
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    if (!user) { setIds([]); return; }
    api<{ ids: string[] }>("/api/wishlist").then((r) => setIds(r.ids)).catch(() => {});
  }, [user]);
  const toggle = useCallback(async (id: string) => {
    if (!user) { toast("Please sign in to save favourites", "err"); window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`; return; }
    const was = ids.includes(id);
    setIds((cur) => (was ? cur.filter((x) => x !== id) : [...cur, id]));
    try {
      await api("/api/wishlist", { method: "POST", json: { productId: id } });
      toast(was ? "Removed from wishlist" : "Added to wishlist");
    } catch (e) {
      setIds((cur) => (was ? [...cur, id] : cur.filter((x) => x !== id)));
      toast((e as Error).message, "err");
    }
  }, [user, ids, toast]);

  const count = items.reduce((s, l) => s + l.qty, 0);

  return (
    <ToastCtx.Provider value={{ toast }}>
      <AuthCtx.Provider value={{ user, loading, refresh, logout, setUser }}>
        <CartCtx.Provider value={{ items, count, ready, drawerOpen, setDrawerOpen, add, setQty, remove, clear }}>
          <WishCtx.Provider value={{ ids, has: (id) => ids.includes(id), toggle }}>
            {children}
            <div className="fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 md:left-auto md:right-6 md:translate-x-0" aria-live="polite">
              <AnimatePresence>
                {toasts.map((t) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="flex items-start gap-3 bg-ink px-4 py-3 text-sm text-white shadow-soft">
                    {t.type === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#b79be8]" /> : <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />}
                    <span className="flex-1">{t.msg}</span>
                    <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Dismiss"><X size={14} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </WishCtx.Provider>
        </CartCtx.Provider>
      </AuthCtx.Provider>
    </ToastCtx.Provider>
  );
}
