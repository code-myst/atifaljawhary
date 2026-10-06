import Link from "next/link";
import NavLinks, { NavLink } from "@/components/NavLinks";
import { getSettings } from "@/lib/getSettings";

export default async function Navbar() {
  const settings = await getSettings();
  const wa = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}`
    : "";

  const links: NavLink[] = [{ label: "Home", href: "/" }];
  if (settings.aboutText) links.push({ label: "About", href: "/#about" });
  if (settings.features.portfolio) links.push({ label: "Work", href: "/#work" });
  if (settings.features.shop) links.push({ label: "Shop", href: "/shop" });
  links.push({ label: "Contact", href: "/#contact" });

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        borderColor: "var(--line)",
        backgroundColor: "rgba(11, 11, 12, 0.75)",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display gold-text text-xl font-bold">
          {settings.name}
        </Link>
        <NavLinks
          links={links}
          whatsappUrl={wa}
          showCart={settings.features.cart}
        />
      </nav>
    </header>
  );
}