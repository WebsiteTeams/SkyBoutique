import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountNav } from "@/components/common/AccountPages";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const name = String(user.name ?? "");

  return (
    <div className="bg-[#F6F4F1]">
      <div className="container-x py-8 md:py-12">
        <header className="mb-6 md:mb-8">
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">My Account</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your orders, wishlist, addresses and profile.</p>
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          <AccountNav name={name} email={String(user.email ?? "")} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
