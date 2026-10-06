"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { useAuth } from "@/components/Providers";
import { formatPrice } from "@/lib/format";

type LastOrder = {
  orderNo: string;
  total: number;
  methodName: string;
  items: { title: string; qty: number }[];
};

export default function OrderSuccess({
  whatsappNumber,
  currency,
}: {
  whatsappNumber: string;
  currency: string;
}) {
  const { user } = useAuth();
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("last-order");
      if (raw) setOrder(JSON.parse(raw) as LastOrder);
    } catch {
      /* ignore */
    }
  }, []);

  let waLink = "";
  if (order && whatsappNumber) {
    const lines = order.items.map((i) => `• ${i.title} × ${i.qty}`).join("\n");
    const text = `Hello! I placed order ${order.orderNo}.\n${lines}\nTotal: ${formatPrice(
      order.total,
      currency
    )}\nPayment: ${order.methodName}`;
    waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: "color-mix(in srgb, var(--brand), transparent 85%)",
          color: "var(--brand-light)",
        }}
      >
        <Icon name="check" className="text-xl" />
      </div>

      <h1 className="font-display gold-text mt-5 text-3xl font-bold">
        Order received
      </h1>

      {order ? (
        <>
          <p className="mt-3" style={{ color: "var(--muted)" }}>
            Your order number
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-widest">
            {order.orderNo}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Total {formatPrice(order.total, currency)} · {order.methodName}
          </p>
        </>
      ) : (
        <p className="mt-3" style={{ color: "var(--muted)" }}>
          Thank you for your order.
        </p>
      )}

      <p className="mt-5 text-sm" style={{ color: "var(--muted)" }}>
        Your order is <strong>pending</strong> until we verify your payment.
        Keep your order number handy.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            <Icon name="whatsapp" /> Send details on WhatsApp
          </a>
        )}
        {user ? (
          <Link href="/account" className="btn-outline">
            View my orders
          </Link>
        ) : (
          <Link href="/shop" className="btn-outline">
            Continue shopping
          </Link>
        )}
      </div>
    </div>
  );
}