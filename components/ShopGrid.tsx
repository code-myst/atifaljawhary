"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import type { Product } from "@/lib/getProducts";

export default function ShopGrid({
  products,
  currency,
}: {
  products: Product[];
  currency: string;
}) {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (active && p.category !== active) return false;
      if (!q) return true;
      return `${p.title} ${p.category} ${p.description}`
        .toLowerCase()
        .includes(q);
    });
  }, [products, search, active]);

  if (products.length === 0) {
    return (
      <p className="py-10 text-center" style={{ color: "var(--muted)" }}>
        Products coming soon.
      </p>
    );
  }

  return (
    <>
      <div className="mx-auto mb-6 max-w-md">
        <div className="relative">
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
          >
            <Icon name="search" />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border bg-transparent py-3 pl-11 pr-4 outline-none focus:border-[var(--brand)]"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          />
        </div>
      </div>

      {categories.length > 0 && (
        <nav className="mb-10 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActive("")}
            className={`pill ${!active ? "pill-active" : ""}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`pill ${active === c ? "pill-active" : ""}`}
            >
              {c}
            </button>
          ))}
        </nav>
      )}

      <section className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {visible.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 100}>
            <ProductCard product={p} currency={currency} />
          </Reveal>
        ))}
      </section>

      {visible.length === 0 && (
        <p className="py-10 text-center" style={{ color: "var(--muted)" }}>
          No products found.
        </p>
      )}
    </>
  );
}