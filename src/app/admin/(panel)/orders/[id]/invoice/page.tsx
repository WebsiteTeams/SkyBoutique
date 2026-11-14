import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { getPublicSettings } from "@/services/settings";
import { toJSON } from "@/utils";
import { InvoiceDocument, type InvoiceOrder } from "@/components/invoice/InvoiceDocument";
import { InvoiceToolbar } from "@/components/invoice/InvoiceToolbar";

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  let o;
  try { o = await Order.findById(id).lean(); } catch { notFound(); }
  if (!o) notFound();
  const order = toJSON(o) as unknown as InvoiceOrder;
  const s = await getPublicSettings();

  return (
    <>
      <InvoiceToolbar backHref="/admin/orders" backLabel="Back to orders" orderNumber={order.orderNumber} />
      <InvoiceDocument order={order} store={{ storeName: s.storeName, tagline: s.tagline, contact: s.contact }} />
    </>
  );
}
