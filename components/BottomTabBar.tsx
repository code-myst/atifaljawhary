"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { IconName } from "@/components/Icon";
import { useCart } from "@/components/Providers";

export type TabItem = { href: string; label: string; icon: IconName };

export default function BottomTabBar({ items }: { items: TabItem[] }) {
  const pathname = usePathname();
  const { count } = useCart();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav aria-label="Main" className="mobile-tabbar md:hidden">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`tab ${isActive(t.href) ? "tab-active" : ""}`}
        >
          <span className="relative">
            <Icon name={t.icon} className="text-lg" />
            {t.href === "/cart" && count > 0 && (
              <span className="tab-badge">{count}</span>
            )}
          </span>
          <span className="text-[11px]">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}