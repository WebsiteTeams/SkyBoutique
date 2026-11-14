import { getSettings } from "@/models";
import { toJSON } from "@/utils";

export type PublicSettings = {
  storeName: string; tagline: string; announcement: string; whatsappNumber: string;
  contact: { email: string; phone: string; address: string; hours: string };
  social: { instagram: string; facebook: string; youtube: string; pinterest: string };
  about: { title: string; body: string }; footerText: string;
  testimonials: { name: string; city: string; text: string; rating: number }[];
  shipping: { flatRate: number; freeAbove: number }; codEnabled: boolean; lowStockThreshold: number;
};

export async function getPublicSettings(): Promise<PublicSettings> {
  const s = toJSON((await getSettings()).toObject());
  delete s._id; delete s.__v; delete s.key;
  return s as PublicSettings;
}
