import Icon from "@/components/Icon";
import type { SiteSettings } from "@/lib/getSettings";

export default function Hero({ settings }: { settings: SiteSettings }) {
  const wa = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}`
    : "";

  return (
    <section className="hero-glow relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 text-center">
      <div className="mx-auto max-w-3xl py-24">
        <p
          className="fade-up mb-5 text-xs uppercase tracking-[0.35em]"
          style={{ color: "var(--brand-light)" }}
        >
          Creative Portfolio
        </p>

        <h1
          className="fade-up font-display gold-text text-5xl font-bold leading-tight sm:text-7xl"
          style={{ animationDelay: "100ms" }}
        >
          {settings.name}
        </h1>

        <div
          className="fade-up gold-line mx-auto my-6 w-24"
          style={{ animationDelay: "200ms" }}
        />

        <p
          className="fade-up mx-auto max-w-xl text-lg"
          style={{ animationDelay: "300ms", color: "var(--muted)" }}
        >
          {settings.tagline}
        </p>

        <div
          className="fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "450ms" }}
        >
          {settings.features.portfolio && (
            <a href="#work" className="btn-gold">
              View my work <Icon name="arrowDown" />
            </a>
          )}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              <Icon name="whatsapp" /> Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}