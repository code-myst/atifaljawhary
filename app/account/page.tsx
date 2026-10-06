import type { Metadata } from "next";
import AccountView from "@/components/AccountView";
import siteConfig from "@/site.config";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-display gold-text mb-8 text-center text-4xl font-bold">
        My account
      </h1>
      <AccountView currency={siteConfig.currency} />
    </main>
  );
}