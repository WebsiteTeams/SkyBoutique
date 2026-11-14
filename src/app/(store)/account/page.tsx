import type { Metadata } from "next";
import { Overview } from "@/components/common/AccountPages";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };
export default function Page() {
  return <Overview />;
}
