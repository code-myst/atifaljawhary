import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CustomOrderForm from "@/components/CustomOrderForm";
import { getSettings } from "@/lib/getSettings";

export const metadata: Metadata = { title: "Custom order" };
export const revalidate = 300;

export default async function CustomOrderPage() {
  const settings = await getSettings();
  if (!settings.features.customOrders) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-10 text-center">
        <p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ color: "var(--brand-light)" }}
        >
          Made for you
        </p>
        <h1 className="font-display gold-text mt-3 text-4xl font-bold">
          Custom order
        </h1>
        <p
          className="mx-auto mt-3 max-w-md text-sm"
          style={{ color: "var(--muted)" }}
        >
          Tell us what you have in mind. We will review it and get back to you
          with the price and timeline.
        </p>
      </div>
      <CustomOrderForm whatsappNumber={settings.whatsappNumber} />
    </main>
  );
}