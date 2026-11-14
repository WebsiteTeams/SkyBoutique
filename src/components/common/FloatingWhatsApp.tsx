"use client";
import { useSettings } from "@/hooks/providers";
import { whatsappLink } from "@/utils";
import { WhatsAppIcon } from "./ui";

export function FloatingWhatsApp() {
  const s = useSettings();
  return (
    <a
      href={whatsappLink(s.whatsappNumber, `Hello ${s.storeName}, I'd like some help with shopping.`)}
      target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 md:bottom-6 md:right-6 md:h-14 md:w-14"
    >
      <WhatsAppIcon size={26} />
    </a>
  );
}
