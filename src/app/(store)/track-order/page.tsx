import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { TrackForm } from "@/components/checkout/TrackForm";

export const metadata: Metadata = { title: "Track Your Order" };

export default function Page() {
  return (
    <div className="bg-[#F6F4F1]">
      <div className="container-x py-10 md:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7A184E] text-white shadow-lg shadow-[#7A184E]/20">
            <PackageSearch size={26} />
          </span>
          <h1 className="mt-5 font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">Track your order</h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-neutral-600">
            Enter your order number and the email you used at checkout to see where your order is right now.
          </p>
        </header>
        <TrackForm />
      </div>
    </div>
  );
}
