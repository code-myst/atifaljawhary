"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { useCart } from "@/components/Providers";

type Props = {
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
    stock: number;
  };
};

export default function AddToCartButton({ product }: Props) {
  const { add, items } = useCart();
  const [added, setAdded] = useState(false);

  const inCart = items.find((i) => i.id === product.id)?.qty ?? 0;
  const atMax = inCart >= product.stock;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={atMax}
        onClick={() => {
          add(product, 1);
          setAdded(true);
        }}
        className="btn-gold disabled:opacity-50"
      >
        <Icon name={added && !atMax ? "check" : "cart"} />
        {atMax ? "Max quantity in cart" : "Add to cart"}
      </button>

      {(added || inCart > 0) && (
        <Link href="/cart" className="btn-outline">
          View cart ({inCart})
        </Link>
      )}
    </div>
  );
}