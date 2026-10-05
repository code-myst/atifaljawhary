import Reveal from "@/components/Reveal";
import SocialLinks from "@/components/SocialLinks";
import type { SiteSettings } from "@/lib/getSettings";

export default function About({ settings }: { settings: SiteSettings }) {
  if (!settings.aboutText) return null;

  const hasImage = Boolean(settings.aboutImage);

  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
      <div
        className={
          hasImage
            ? "grid items-center gap-14 md:grid-cols-[1fr_1.2fr]"
            : "mx-auto max-w-3xl text-center"
        }
      >
        {hasImage && (
          <Reveal>
            <div className="relative mx-auto max-w-sm">
              <div
                className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl border"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--brand), transparent 40%)",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.aboutImage}
                alt={settings.name}
                className="relative aspect-[4/5] w-full rounded-xl object-cover"
              />
            </div>
          </Reveal>
        )}

        <Reveal delay={150}>
          <div>
            <p
              className="text-xs uppercase tracking-[0.35em]"
              style={{ color: "var(--brand-light)" }}
            >
              About
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
              Hello, I&apos;m <span className="gold-text">{settings.name}</span>
            </h2>
            <div className={`gold-line my-6 w-24 ${hasImage ? "" : "mx-auto"}`} />

            <p
              className="whitespace-pre-line leading-relaxed"
              style={{ color: "var(--text)", opacity: 0.85 }}
            >
              {settings.aboutText}
            </p>

            {settings.skills.length > 0 && (
              <div
                className={`mt-6 flex flex-wrap gap-2 ${
                  hasImage ? "" : "justify-center"
                }`}
              >
                {settings.skills.map((s) => (
                  <span key={s} className="pill cursor-default">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <SocialLinks
              socials={settings.socials}
              className={`mt-8 ${hasImage ? "" : "justify-center"}`}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}