import Link from "next/link";
import Icon from "@/components/Icon";
import { getSettings } from "@/lib/getSettings";

export default async function Navbar() {
  const settings = await getSettings();
  const wa = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}`
    : "";

  const linkClass = "transition hover:text-[var(--brand-light)]";

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

        <div
          className="flex items-center gap-5 text-sm"
          style={{ color: "var(--muted)" }}
        >
          <Link href="/" className={linkClass}>
            Home
          </Link>
          {settings.aboutText && (
            <Link href="/#about" className={linkClass}>
              About
            </Link>
          )}
          {settings.features.portfolio && (
            <Link href="/#work" className={linkClass}>
              Work
            </Link>
          )}
          <Link href="/#contact" className={linkClass}>
            Contact
          </Link>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="icon-btn"
            >
              <Icon name="whatsapp" />
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}