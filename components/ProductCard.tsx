import Link from "next/link";
import Icon from "@/components/Icon";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/getProducts";

export default function ProductCard({
  product,
  currency,
}: {
  product: Product;
  currency: string;
}) {
  const cover = product.images[0];
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={`/shop/${product.id}`}
      className="work-card group block overflow-hidden rounded-xl"
    >
      <div className="relative aspect-square overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.title}
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
              soldOut ? "opacity-60" : ""
            }`}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--surface), color-mix(in srgb, var(--brand), black 80%))",
              color: "var(--brand-light)",
            }}
          >
            <Icon name="image" className="text-3xl opacity-40" />
          </div>
        )}

        {soldOut && (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              color: "var(--brand-light)",
            }}
          >
            Sold out
          </span>
        )}
      </div>

      <div className="p-4">
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: "var(--brand-light)" }}
        >
          {product.category}
        </p>
        <h3 className="font-display mt-1 text-lg">{product.title}</h3>
        <p className="gold-text mt-2 font-semibold">
          {formatPrice(product.price, currency)}
        </p>
      </div>
    </Link>
  );
}