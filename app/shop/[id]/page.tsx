import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ProductGallery from "@/components/ProductGallery";
import siteConfig from "@/site.config";
import { formatPrice } from "@/lib/format";
import { getProduct } from "@/lib/getProducts";
import { getSettings } from "@/lib/getSettings";

export const revalidate = 10;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const settings = await getSettings();
  const product = await getProduct(id);
  if (!product) return { title: settings.name };

  return {
    title: `${product.title} | ${settings.name}`,
    description:
      product.description ||
      `${product.category} by ${settings.name} — ${formatPrice(
        product.price,
        siteConfig.currency
      )}`,
    openGraph: {
      title: product.title,
      description: product.description || product.category,
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  const settings = await getSettings();
  if (!settings.features.shop) notFound();

  const product = await getProduct(id);
  if (!product) notFound();

  const price = formatPrice(product.price, siteConfig.currency);
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 3;

  const waLink = (message: string) =>
    settings.whatsappNumber
      ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
          message
        )}`
      : "";

  const orderLink = waLink(
    `Hello! I'd like to order "${product.title}" (${price}).`
  );
  const askLink = waLink(
    `Hello! "${product.title}" is sold out. Can you make something similar?`
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/shop"
        className="text-sm transition hover:text-[var(--brand-light)]"
        style={{ color: "var(--muted)" }}
      >
        ← Back to shop
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} alt={product.title} />

        <div>
          <p
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--brand-light)" }}
          >
            {product.category}
          </p>
          <h1 className="font-display gold-text mt-2 text-4xl font-bold">
            {product.title}
          </h1>

          <p className="mt-4 text-2xl font-semibold">{price}</p>

          <p
            className="mt-2 text-sm"
            style={{ color: soldOut ? "#e57373" : "var(--muted)" }}
          >
            {soldOut
              ? "Sold out"
              : lowStock
                ? `Only ${product.stock} left`
                : "In stock"}
          </p>

          <div className="gold-line my-6 w-24" />

          {product.description && (
            <p
              className="whitespace-pre-line leading-relaxed"
              style={{ color: "var(--text)", opacity: 0.85 }}
            >
              {product.description}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {soldOut ? (
              askLink && (
                <a
                  href={askLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  <Icon name="whatsapp" /> Ask for something similar
                </a>
              )
            ) : orderLink ? (
              <a
                href={orderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
              >
                <Icon name="whatsapp" /> Order on WhatsApp
              </a>
            ) : (
              <a
                href={`mailto:${settings.contactEmail}?subject=${encodeURIComponent(
                  `Order: ${product.title}`
                )}`}
                className="btn-gold"
              >
                <Icon name="envelope" /> Order by email
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}