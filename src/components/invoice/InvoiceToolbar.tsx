"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Copy, Printer } from "lucide-react";

/** Screen-only action bar above the invoice (hidden when printing). */
export function InvoiceToolbar({ backHref, backLabel, orderNumber }: { backHref: string; backLabel: string; orderNumber: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(orderNumber); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  return (
    <div className="no-print mx-auto mb-5 flex w-full max-w-[820px] flex-wrap items-center justify-between gap-3">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-neutral-600 transition hover:text-[#7A184E]"><ArrowLeft size={15} /> {backLabel}</Link>
      <div className="flex items-center gap-2">
        <button onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 transition hover:border-[#7A184E]/40 hover:text-[#7A184E]">
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} {copied ? "Copied" : "Copy order no."}
        </button>
        <button onClick={() => window.print()} className="btn btn-primary !rounded-lg !py-2.5"><Printer size={15} /> Print / Save as PDF</button>
      </div>
    </div>
  );
}
