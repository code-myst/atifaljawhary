"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { useCart } from "@/components/Providers";

export type NavLink = { label: string; href: string };

export default function NavLinks({
  links,
  whatsappUrl,
  showCart,
}: {
  links: NavLink[];
  whatsappUrl: string;
  showCart: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const linkClass = "transition hover:text-[var(--brand-light)]";

  return (
    <>
      <div
        className="hidden items-center gap-6 text-sm md:flex"
        style={{ color: "var(--muted)" }}
      >
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={linkClass}>
            {l.label}
          </Link>
        ))}

        {showCart && (
          <Link href="/cart" aria-label="Cart" className="icon-btn relative">
            <Icon name="cart" />
            {count > 0 && <span className="tab-badge">{count}</span>}
          </Link>
        )}
        <Link href="/account" aria-label="Account" className="icon-btn">
          <Icon name="user" />
        </Link>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="icon-btn"
          >
            <Icon name="whatsapp" />
          </a>
        )}
      </div>

      <button
        type="button"
        className="icon-btn md:hidden"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={open ? "xmark" : "bars"} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-16 border-b md:hidden"
          style={{
            borderColor: "var(--line)",
            backgroundColor: "rgba(11, 11, 12, 0.97)",
          }}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 transition hover:bg-white/5"
                style={{ color: "var(--text)" }}
              >
                {l.label}
              </Link>
            ))}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold mt-2 justify-center"
              >
                <Icon name="whatsapp" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}