"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X, LogOut, LayoutDashboard, Package, ChevronDown, Truck } from "lucide-react";
import { useAuth, useCart, useWishlist } from "@/hooks/providers";

export function AnnouncementBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="relative z-50 bg-[#120A1E] px-4 py-2 text-center text-xs font-medium text-[#F4E7CB]">
      <div className="container-x flex items-center justify-center gap-2">
        <Truck size={13} className="text-[#D4AF37]" />
        <span>{text}</span>
      </div>
    </div>
  );
}

function SearchField({ value, onChange, onSubmit, autoFocus, className = "" }: { value: string; onChange: (v: string) => void; onSubmit: (e: React.FormEvent) => void; autoFocus?: boolean; className?: string }) {
  return (
    <form onSubmit={onSubmit} role="search" className={`relative ${className}`}>
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search for sarees, kurtis, lehengas…"
        aria-label="Search products"
        className="h-11 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-neutral-400 focus:border-[#7A184E] focus:bg-white focus:ring-2 focus:ring-[#7A184E]/10"
      />
    </form>
  );
}

function IconBtn({ children, label, badge, className = "", ...rest }: { children: React.ReactNode; label: string; badge?: number; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button aria-label={label} className={`relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-neutral-100 hover:text-[#7A184E] ${className}`} {...rest}>
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#7A184E] px-1 text-[10px] font-semibold text-white ring-2 ring-white">{badge > 99 ? "99+" : badge}</span>
      )}
    </button>
  );
}

function Links({ categories }: { categories: { name: string; slug: string }[] }) {
  const path = usePathname();
  const sp = useSearchParams();
  const current = path === "/shop" ? sp.get("category") ?? "all" : null;
  const item = (active: boolean) => `relative whitespace-nowrap py-3.5 text-sm font-medium transition-colors hover:text-[#7A184E] ${active ? "text-[#7A184E] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#7A184E]" : "text-neutral-700"}`;
  return (
    <ul className="flex items-center gap-5 xl:gap-9">
      <li><Link href="/shop" className={item(current === "all")}>All Products</Link></li>
      {categories.map((c) => (
        <li key={c.slug}><Link href={`/shop?category=${c.slug}`} className={item(current === c.slug)}>{c.name}</Link></li>
      ))}
    </ul>
  );
}

export function Navbar({ categories }: { categories: { name: string; slug: string }[] }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { count, setDrawerOpen } = useCart();
  const wish = useWishlist();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? "shadow-[0_2px_12px_rgba(18,10,30,0.08)]" : "border-b border-neutral-200"}`}>
      {/* Main row */}
      <div className="container-x flex h-16 items-center gap-4 md:h-[72px] md:gap-8">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-neutral-100 lg:hidden">
          <Menu size={22} />
        </button>

        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="SKY BOUTIQUE home">
          <img src="/icon.png" alt="" className="h-9 w-9 rounded-lg object-cover md:h-10 md:w-10" />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-2xl font-semibold tracking-[0.2em] text-ink transition-colors group-hover:text-[#7A184E]">SKY</span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.34em] text-[#8C6A32]">Boutique</span>
          </span>
        </Link>

        <SearchField value={q} onChange={setQ} onSubmit={submit} className="hidden max-w-xl flex-1 lg:block" />

        <div className="ml-auto flex items-center gap-0.5 md:gap-1">
          <IconBtn label="Search" onClick={() => setSearchOpen((v) => !v)} className="lg:hidden"><Search size={20} /></IconBtn>

          <Link href="/account/wishlist" aria-label={`Wishlist, ${wish.ids.length} items`} className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-neutral-100 hover:text-[#7A184E] sm:flex">
            <Heart size={20} />
            {wish.ids.length > 0 && <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#7A184E] px-1 text-[10px] font-semibold text-white ring-2 ring-white">{wish.ids.length}</span>}
          </Link>

          <div className="relative" ref={menuRef}>
            {user ? (
              <button onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu} className="flex h-10 items-center gap-2 rounded-full pl-1.5 pr-2.5 transition hover:bg-neutral-100">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7A184E] text-xs font-semibold text-white">{user.name?.trim().charAt(0).toUpperCase() || "U"}</span>
                <span className="hidden max-w-[90px] truncate text-sm font-medium text-ink xl:block">{user.name?.split(" ")[0]}</span>
                <ChevronDown size={14} className="hidden text-neutral-500 xl:block" />
              </button>
            ) : (
              <Link href="/login" className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink transition hover:bg-neutral-100 hover:text-[#7A184E]">
                <User size={20} /><span className="hidden xl:block">Sign in</span>
              </Link>
            )}
            <AnimatePresence>
              {menu && user && (
                <motion.div role="menu" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1.5 shadow-xl">
                  <div className="border-b border-neutral-100 px-4 pb-3 pt-2">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-neutral-500">{user.email}</p>
                  </div>
                  {user.role === "admin" && <Link onClick={() => setMenu(false)} href="/admin" className="menu-item font-medium text-[#7A184E]"><LayoutDashboard size={16} /> Admin dashboard</Link>}
                  <Link onClick={() => setMenu(false)} href="/account" className="menu-item"><User size={16} /> My account</Link>
                  <Link onClick={() => setMenu(false)} href="/account/orders" className="menu-item"><Package size={16} /> My orders</Link>
                  <Link onClick={() => setMenu(false)} href="/account/wishlist" className="menu-item"><Heart size={16} /> Wishlist</Link>
                  <div className="my-1 border-t border-neutral-100" />
                  <button onClick={() => { setMenu(false); logout(); }} className="menu-item w-full text-left text-neutral-600 hover:!text-red-700"><LogOut size={16} /> Sign out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => setDrawerOpen(true)} aria-label={`Bag, ${count} items`} className="relative ml-1 flex h-10 items-center gap-2 rounded-full bg-[#120A1E] px-3.5 text-white transition hover:bg-[#7A184E]">
            <ShoppingBag size={18} />
            <span className="hidden text-sm font-medium sm:block">Bag</span>
            <AnimatePresence>
              {count > 0 && (
                <motion.span key={count} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[11px] font-bold text-[#120A1E]">{count}</motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Category row (desktop) */}
      <div className="hidden border-t border-neutral-100 lg:block">
        <nav className="container-x flex items-center justify-between p-3" aria-label="Main navigation">
          <Suspense fallback={<div className="h-[46px] " />}><Links categories={categories} /></Suspense>
          <Link href="/track-order" className="ml-6 hidden whitespace-nowrap text-sm font-medium text-neutral-600 transition hover:text-[#7A184E] xl:block">Track order</Link>
        </nav>
      </div>

      {/* Mobile search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-neutral-100 lg:hidden">
            <div className="container-x flex items-center gap-2 py-3">
              <SearchField value={q} onChange={setQ} onSubmit={submit} autoFocus className="flex-1" />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-[#120A1E]/60 backdrop-blur-sm lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl lg:hidden">
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <img src="/icon.png" alt="" className="h-9 w-9 rounded-lg" />
                  <span className="font-display text-xl font-semibold tracking-[0.2em] text-ink">SKY</span>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"><X size={20} /></button>
              </div>

              <SearchField value={q} onChange={setQ} onSubmit={submit} className="px-5 pt-4" />

              <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile navigation">
                <Link href="/shop" onClick={() => setOpen(false)} className="drawer-item">All Products</Link>
                {categories.map((c) => (
                  <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={() => setOpen(false)} className="drawer-item">{c.name}</Link>
                ))}
                <div className="mx-3 my-3 border-t border-neutral-100" />
                <Link href="/account/wishlist" onClick={() => setOpen(false)} className="drawer-item-sm"><Heart size={16} /> Wishlist ({wish.ids.length})</Link>
                <Link href="/track-order" onClick={() => setOpen(false)} className="drawer-item-sm"><Package size={16} /> Track order</Link>
                <Link href="/about" onClick={() => setOpen(false)} className="drawer-item-sm">About us</Link>
                <Link href="/contact" onClick={() => setOpen(false)} className="drawer-item-sm">Contact</Link>
              </nav>

              <div className="border-t border-neutral-100 p-4">
                {user ? (
                  <button onClick={() => { setOpen(false); logout(); }} className="btn btn-outline w-full">Sign out</button>
                ) : (
                  <Link href="/login" onClick={() => setOpen(false)} className="btn btn-primary w-full">Sign in / Register</Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .menu-item { display:flex; align-items:center; gap:.7rem; padding:.6rem 1rem; font-size:.875rem; color:var(--ink); transition:background .15s,color .15s; }
        .menu-item:hover { background:#F6F4F1; color:#7A184E; }
        .drawer-item { display:block; border-radius:.5rem; padding:.75rem .75rem; font-size:1rem; font-weight:500; color:var(--ink); }
        .drawer-item:hover { background:#F6F4F1; color:#7A184E; }
        .drawer-item-sm { display:flex; align-items:center; gap:.6rem; border-radius:.5rem; padding:.6rem .75rem; font-size:.875rem; color:#525252; }
        .drawer-item-sm:hover { background:#F6F4F1; color:#7A184E; }
      `}</style>
    </header>
  );
}
