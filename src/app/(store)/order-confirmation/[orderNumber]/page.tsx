import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import { OrderLoader } from "@/components/checkout/OrderView";
import { PageHero, Steps } from "@/components/common/ui";

export const metadata: Metadata = { title: "Atelier Order Confirmed", robots: { index: false } };

export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ orderNumber: string }>; 
  searchParams: Promise<{ email?: string }>;
}) {
  const { orderNumber } = await params;
  const { email } = await searchParams;

  return (
    <>
      <PageHero eyebrow="Acquisition Confirmed" title="Thank You for Your Order" sub="Your heirloom selection has been reserved with our master karigars. Please retain your order reference for tracking.">
        <Steps current={3} />
      </PageHero>

      <div className="container-x max-w-5xl py-12 md:py-20">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF7F2] border border-[#C5A880]/50 text-[#D4AF37] shadow-soft">
            <CheckCircle2 size={36} strokeWidth={1.4} />
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-[#8C6A32] font-semibold">
            <Sparkles size={12} className="text-[#D4AF37]" /> White-Glove Dispatch Preparation
          </span>
        </div>

        <div className="bg-white border border-[#C5A880]/30 p-6 md:p-10 shadow-soft">
          <OrderLoader orderNumber={orderNumber} email={email} />
        </div>

        <div className="mt-12 text-center flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="btn btn-gold">Continue Exploring The Collections</Link>
          <Link href="/account/orders" className="btn btn-outline-gold">View Atelier Order History</Link>
        </div>
      </div>
    </>
  );
}
