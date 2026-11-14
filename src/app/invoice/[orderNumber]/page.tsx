import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import { getPublicSettings } from "@/services/settings";
import { InvoiceLoader } from "@/components/invoice/InvoiceLoader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };

// Customer invoice: the order is only returned to its owner (signed in) or to someone who knows the order number AND the email on it.
export default async function Page({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ email?: string }> }) {
  const { orderNumber } = await params;
  const { email } = await searchParams;
  await connectDB();
  const s = await getPublicSettings();
  return (
    <div className="min-h-screen bg-[#F1EDE6] px-4 py-8 print:bg-white print:p-0">
      <InvoiceLoader orderNumber={orderNumber} email={email} store={{ storeName: s.storeName, tagline: s.tagline, contact: s.contact }} />
    </div>
  );
}
