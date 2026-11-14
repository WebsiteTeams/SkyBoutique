import type { Metadata } from "next";
import { RegisterForm } from "@/components/common/AuthForms";

export const metadata: Metadata = { title: "Create Account" };
export default function Page() {
  return <RegisterForm />;
}
