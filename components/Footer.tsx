import Icon from "@/components/Icon";
import SocialLinks from "@/components/SocialLinks";
import { getSettings } from "@/lib/getSettings";

export default async function Footer() {
  const settings = await getSettings();
  const wa = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}`
    : "";

  return (
    <footer
      id="contact"
      className="mt-24 scroll-mt-20 border-t"
      style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 text-center">
        <h2 className="font-display gold-text text-2xl font-bold">
          {settings.name}
        </h2>
        <p
          className="mx-auto mt-2 max-w-md text-sm"
          style={{ color: "var(--muted)" }}
        >
          {settings.tagline}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
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
          <a
            href={`mailto:${settings.contactEmail}`}
            aria-label="Email"
            className="icon-btn"
          >
            <Icon name="envelope" />
          </a>
          <SocialLinks socials={settings.socials} className="contents" />
        </div>

        <p className="mt-10 text-xs" style={{ color: "var(--muted)" }}>
          © {new Date().getFullYear()} {settings.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}