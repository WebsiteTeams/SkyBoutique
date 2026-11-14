"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Boxes, ExternalLink, FileText, LayoutDashboard, LogOut, Megaphone, Menu, MessageSquareQuote, Package, ShoppingBag, Tags, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/providers";
import { PageTransition } from "@/components/layout/PageTransition";

const NAV = [
  ["/admin", "Dashboard", LayoutDashboard], 
  ["/admin/products", "Products", Package], 
  ["/admin/categories", "Categories", Tags], 
  ["/admin/orders", "Orders", ShoppingBag],
  ["/admin/inventory", "Inventory", Boxes], 
  ["/admin/customers", "Customers", Users], 
  ["/admin/testimonials", "Testimonials", MessageSquareQuote], 
  ["/admin/marketing", "Marketing & Banners", Megaphone], 
  ["/admin/content", "Website Content", FileText], 
  ["/admin/reports", "Financial Reports", BarChart3],
] as const;

export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const path = usePathname();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  // mobile drawer: close on navigation / Escape, lock page scroll while open
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  const initial = (name || "A").trim().charAt(0).toUpperCase();
  
  const Nav = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Admin Navigation">
      {NAV.map(([href, label, Icon]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link 
            key={href} 
            href={href} 
            onClick={() => setOpen(false)} 
            aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] font-medium transition ${active ? "bg-[#7A184E] text-white shadow-sm ring-1 ring-[#D4AF37]/30" : "text-[#EDE5D8]/70 hover:bg-white/8 hover:text-white"}`}
          >
            <Icon size={16} className={active ? "text-[#D4AF37]" : "text-white/50"} /> {label}
          </Link>
        );
      })}
    </nav>
  );

  const Side = (
    <>
      <div className="border-b border-[#C5A880]/20 px-5 py-5 flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#C5A880]/40">
          <img src="/icon.png" alt="SKY BOUTIQUE" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold tracking-[0.16em] text-white">SKY <span className="text-[#D4AF37]">ADMIN</span></p>
          <p className="max-w-[150px] truncate text-[11px] text-[#F4E7CB]/60">{name}</p>
        </div>
      </div>
      {Nav}
      <div className="space-y-1 border-t border-[#C5A880]/20 p-3 text-[13px] text-[#EDE5D8]/70">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-white/8 hover:text-white">
          <ExternalLink size={15} /> View Boutique Store
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/8 hover:text-red-300">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F6F4F1] [--admin-bar:57px] lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:[--admin-bar:53px] xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="no-print sticky top-0 hidden h-svh flex-col bg-[#120A1E] border-r border-[#C5A880]/30 lg:flex">{Side}</aside>
      
      <div className="no-print sticky top-0 z-40 flex items-center justify-between bg-[#120A1E] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white border-b border-[#C5A880]/30 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="-ml-1.5 rounded-lg p-1.5 hover:bg-white/10"><Menu size={22} /></button>
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="" className="h-6 w-6 rounded" />
          <span className="font-display tracking-[0.16em] text-sm">SKY ADMIN</span>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7A184E] text-xs font-semibold text-white" aria-hidden>{initial}</span>
      </div>

      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#120A1E]/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[84%] max-w-[18rem] flex-col bg-[#120A1E] pt-[env(safe-area-inset-top)] border-r border-[#C5A880]/40">
            <button className="absolute right-3.5 top-4.5 text-[#F4E7CB] hover:text-white" onClick={() => setOpen(false)} aria-label="Close">
              <X size={20} />
            </button>
            {Side}
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="no-print sticky top-0 z-30 hidden items-center justify-between border-b border-neutral-200/80 bg-white/80 px-6 py-3 backdrop-blur lg:flex xl:px-10">
          <p className="truncate text-sm text-neutral-500">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-[#120A1E] xl:inline">{name}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7A184E] text-xs font-semibold text-white">{(name || "A").trim().charAt(0).toUpperCase()}</span>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 xl:p-10"><div className="mx-auto w-full max-w-[1600px]"><PageTransition>{children}</PageTransition></div></main>
      </div>
    </div>
  );
}
