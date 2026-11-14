import type { Metadata } from "next";
import { OrdersPage } from "@/components/common/AccountPages";

export const metadata: Metadata = { title: "My Orders", robots: { index: false } };
export default function Page() {
  return <OrdersPage />;
}
