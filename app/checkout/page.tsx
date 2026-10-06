import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import siteConfig from "@/site.config";
import { getSettings } from "@/lib/getSettings";

export const metadata: Metadata = { title: "Checkout" };
export const revalidate = 300;

export default async function CheckoutPage() {
  const settings = await getSettings();
  if (!settings.features.cart) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-display gold-text mb-8 text-4xl font-bold">
        Checkout
      </h1>
      <CheckoutForm
        currency={siteConfig.currency}
        methods={settings.paymentMethods}
      />
    </main>
  );
}