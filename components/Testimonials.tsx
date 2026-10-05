import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import type { Testimonial } from "@/lib/getTestimonials";

export default function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  return (
    <section
      id="testimonials"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24"
    >
      <Reveal>
        <div className="mb-12 text-center">
          <p
            className="text-xs uppercase tracking-[0.35em]"
            style={{ color: "var(--brand-light)" }}
          >
            Testimonials
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
            Kind words from clients
          </h2>
        </div>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <Reveal key={t.id} delay={(i % 3) * 100}>
            <figure className="work-card h-full rounded-xl p-6">
              <Icon
                name="quoteLeft"
                className="text-2xl"
              />
              <blockquote
                className="mt-4 whitespace-pre-line leading-relaxed"
                style={{ color: "var(--text)", opacity: 0.85 }}
              >
                {t.text}
              </blockquote>

              {t.rating > 0 && (
                <div
                  className="mt-4 flex gap-1 text-sm"
                  style={{ color: "var(--brand)" }}
                  aria-label={`${t.rating} out of 5`}
                >
                  {Array.from({ length: t.rating }).map((_, n) => (
                    <Icon key={n} name="star" />
                  ))}
                </div>
              )}

              <figcaption className="mt-4">
                <p className="font-semibold">{t.name}</p>
                {t.role && (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {t.role}
                  </p>
                )}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}