"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { useCart } from "@/components/Providers";
import { formatPrice } from "@/lib/format";

export default function CartView({ currency }: { currency: string }) {
  const { items, subtotal, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: "var(--muted)" }}>Your cart is empty.</p>
        <Link href="/shop" className="btn-gold mt-6">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="flex flex-col gap-4">
        {items.map((i) => (
          <li key={i.id} className="card flex gap-4 p-4">
            {i.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={i.image}
                alt={i.title}
                className="h-24 w-24 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--bg)", color: "var(--muted)" }}
              >
                <Icon name="image" />
              </div>
            )}

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg">{i.title}</p>
                  <p className="gold-text font-semibold">
                    {formatPrice(i.price, currency)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i.id)}
                  aria-label={`Remove ${i.title}`}
                  className="icon-btn"
                >
                  <Icon name="trash" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty(i.id, i.qty - 1)}
                  disabled={i.qty <= 1}
                  aria-label="Decrease quantity"
                  className="icon-btn disabled:opacity-40"
                >
                  <Icon name="minus" />
                </button>
                <span className="w-6 text-center">{i.qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(i.id, i.qty + 1)}
                  disabled={i.qty >= i.stock}
                  aria-label="Increase quantity"
                  className="icon-btn disabled:opacity-40"
                >
                  <Icon name="plus" />
                </button>
                {i.qty >= i.stock && (
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    Max available
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="card h-fit p-5">
        <h2 className="font-display text-xl">Summary</h2>
        <div className="mt-4 flex items-center justify-between">
          <span style={{ color: "var(--muted)" }}>Subtotal</span>
          <span className="gold-text text-lg font-semibold">
            {formatPrice(subtotal, currency)}
          </span>
        </div>
        <Link href="/checkout" className="btn-gold mt-6 w-full justify-center">
          Checkout
        </Link>
        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          You can check out as a guest or with your account.
        </p>
      </aside>
    </div>
  );
}