import { connectDB } from "@/lib/mongodb";
import { getPublicSettings } from "@/services/settings";
import { getCategories } from "@/services/catalog";
import { SettingsProvider } from "@/hooks/providers";
import { AnnouncementBar, Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PageTransition, ScrollProgress } from "@/components/layout/PageTransition";
import { FloatingWhatsApp } from "@/components/common/FloatingWhatsApp";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  await connectDB();
  const [settings, categories] = await Promise.all([getPublicSettings(), getCategories()]);
  const cats = categories.map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug }));
  return (
    <SettingsProvider value={settings}>
      <ScrollProgress />
      <AnnouncementBar text={settings.announcement} />
      <Navbar categories={cats} />
      <main className="min-h-[60vh]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer categories={cats} />
      <CartDrawer />
      <FloatingWhatsApp />
    </SettingsProvider>
  );
}
