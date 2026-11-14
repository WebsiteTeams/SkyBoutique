import type { Metadata } from "next";
import { ResetForm } from "@/components/common/AuthForms";

export const metadata: Metadata = { title: "Reset Password" };
export default function Page() {
  return <ResetForm />;
}
