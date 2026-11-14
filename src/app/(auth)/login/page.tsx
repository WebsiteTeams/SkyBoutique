import type { Metadata } from "next";
import { LoginForm } from "@/components/common/AuthForms";

export const metadata: Metadata = { title: "Sign In" };
export default function Page() {
  return <LoginForm />;
}
