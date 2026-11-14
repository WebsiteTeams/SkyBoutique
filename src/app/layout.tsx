import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/hooks/providers";
import { ScrollEffects } from "@/components/layout/ScrollEffects";
import { SplashScreen } from "@/components/layout/SplashScreen";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { 
    default: "SKY BOUTIQUE — Haute Couture & Heritage Weaves", 
    template: "%s | SKY BOUTIQUE" 
  },
  description: "Curated heirloom Kanchipuram & Banarasi sarees, bespoke bridal lehengas, and designer couture. Master craft, delivered pan-India.",
  openGraph: { 
    type: "website", 
    siteName: "SKY BOUTIQUE", 
    title: "SKY BOUTIQUE — Haute Couture & Heritage Weaves", 
    description: "Curated heirloom Kanchipuram & Banarasi sarees, bespoke bridal lehengas, and designer couture.",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "SKY BOUTIQUE Emblem" }]
  },
  icons: { 
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
};

export const viewport: Viewport = { 
  themeColor: "#120A1E", 
  width: "device-width", 
  initialScale: 1 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="min-h-screen antialiased bg-[#FCFAF7] text-[#110E15]">
        <SplashScreen />
        <Providers>{children}</Providers>
        <ScrollEffects />
      </body>
    </html>
  );
}
