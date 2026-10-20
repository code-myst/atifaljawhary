"use client";

import {
  Children,
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Icon from "@/components/Icon";

export type PerView = { base: number; md: number; lg: number };

export default function Slider({
  children,
  perView = { base: 2, md: 4, lg: 5 },
  label = "Slider",
}: {
  children: ReactNode;
  perView?: PerView;
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const items = Children.toArray(children);
  const count = items.length;

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update, count]);

  function scrollByPage(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div
      className="relative"
      style={
        {
          "--pv": perView.base,
          "--pv-md": perView.md,
          "--pv-lg": perView.lg,
        } as CSSProperties
      }
    >
      <div
        ref={trackRef}
        onScroll={update}
        className="slider-track"
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        {items.map((child, i) => (
          <div key={i} className="slider-item">
            {child}
          </div>
        ))}
      </div>

      {canPrev && (
        <button
          type="button"
          aria-label="Previous"
          className="slider-arrow slider-arrow-left"
          onClick={() => scrollByPage(-1)}
        >
          <Icon name="chevronLeft" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          aria-label="Next"
          className="slider-arrow slider-arrow-right"
          onClick={() => scrollByPage(1)}
        >
          <Icon name="chevronRight" />
        </button>
      )}
    </div>
  );
}
