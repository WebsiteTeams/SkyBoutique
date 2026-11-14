import type { Metadata } from "next";
import { ForgotForm } from "@/components/common/AuthForms";

export const metadata: Metadata = { title: "Forgot Password" };
export default function Page() {
  return <ForgotForm />;
}
