import type { Metadata } from "next";
import { ProfilePage } from "@/components/common/AccountPages";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };
export default function Page() {
  return <ProfilePage />;
}
