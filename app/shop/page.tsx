import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopGrid from "@/components/ShopGrid";
import siteConfig from "@/site.config";
import { getProducts } from "@/lib/getProducts";
import { getSettings } from "@/lib/getSettings";

export const revalidate = 10;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return { title: `Shop | ${settings.name}` };
}

export default async function ShopPage() {
  const settings = await getSettings();
  if (!settings.features.shop) notFound();

  const products = await getProducts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-10 text-center">
        <p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ color: "var(--brand-light)" }}
        >
          Shop
        </p>
        <h1 className="font-display gold-text mt-3 text-4xl font-bold">
          Available works
        </h1>
      </div>

      <ShopGrid products={products} currency={siteConfig.currency} />
    </main>
  );
}