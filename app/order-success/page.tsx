import type { Metadata } from "next";
import OrderSuccess from "@/components/OrderSuccess";
import siteConfig from "@/site.config";
import { getSettings } from "@/lib/getSettings";

export const metadata: Metadata = { title: "Order received" };
export const revalidate = 300;

export default async function OrderSuccessPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <OrderSuccess
        whatsappNumber={settings.whatsappNumber}
        currency={siteConfig.currency}
      />
    </main>
  );
}