"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileX2 } from "lucide-react";
import { api } from "@/utils";
import { Skeleton } from "@/components/common/ui";
import { InvoiceDocument, type InvoiceOrder, type InvoiceStore } from "./InvoiceDocument";
import { InvoiceToolbar } from "./InvoiceToolbar";

export function InvoiceLoader({ orderNumber, email, store }: { orderNumber: string; email?: string; store: InvoiceStore }) {
  const [order, setOrder] = useState<InvoiceOrder | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ order: InvoiceOrder }>(`/api/orders/${orderNumber}${email ? `?email=${encodeURIComponent(email)}` : ""}`)
      .then((r) => setOrder(r.order)).catch((e) => setError(e.message));
  }, [orderNumber, email]);

  const back = `/order-confirmation/${orderNumber}${email ? `?email=${encodeURIComponent(email)}` : ""}`;
  if (error) {
    return (
      <div className="mx-auto max-w-md bg-white p-10 text-center shadow-soft">
        <FileX2 className="mx-auto text-[#7A184E]" size={38} strokeWidth={1.3} />
        <h1 className="mt-4 font-display text-3xl">Invoice not found</h1>
        <p className="mt-2 text-sm text-neutral-500">We couldn&apos;t find this order. Check the order number and the email used at checkout.</p>
        <Link href="/track-order" className="btn btn-primary mt-6">Track an order</Link>
      </div>
    );
  }
  if (!order) return <div className="mx-auto w-full max-w-[820px]"><Skeleton className="h-[48rem] w-full" /></div>;
  return (
    <>
      <InvoiceToolbar backHref={back} backLabel="Back to order" orderNumber={order.orderNumber} />
      <InvoiceDocument order={order} store={store} />
    </>
  );
}
