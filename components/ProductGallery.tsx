"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="flex aspect-square items-center justify-center rounded-xl border"
        style={{
          borderColor: "var(--line)",
          background:
            "linear-gradient(135deg, var(--surface), color-mix(in srgb, var(--brand), black 80%))",
          color: "var(--brand-light)",
        }}
      >
        <Icon name="image" className="text-4xl opacity-40" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--line)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={alt}
          className="aspect-square w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Image ${i + 1}`}
              className="overflow-hidden rounded-lg border transition"
              style={{
                borderColor: i === index ? "var(--brand)" : "var(--line)",
                opacity: i === index ? 1 : 0.65,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}