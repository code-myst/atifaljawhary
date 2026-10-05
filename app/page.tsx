import Link from "next/link";
import { getProducts } from "@/lib/getProducts";
import { getProjects } from "@/lib/getProjects";
import { getSettings } from "@/lib/getSettings";
import { getTestimonials } from "@/lib/getTestimonials";
import siteConfig from "@/site.config";
import About from "@/components/About";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import ProjectGrid from "@/components/ProjectGrid";
import Reveal from "@/components/Reveal";
import Testimonials from "@/components/Testimonials";

export const revalidate = 10;

export default async function Home() {
  const settings = await getSettings();
  const projects = settings.features.portfolio ? await getProjects() : [];
  const products = settings.features.shop ? await getProducts() : [];
  const testimonials = settings.features.testimonials
    ? await getTestimonials()
    : [];

  return (
    <main>
      <Hero settings={settings} />

      <About settings={settings} />

      {settings.features.portfolio && (
        <section id="work" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
          <Reveal>
            <div className="mb-12 text-center">
              <p
                className="text-xs uppercase tracking-[0.35em]"
                style={{ color: "var(--brand-light)" }}
              >
                Selected work
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
                Portfolio
              </h2>
            </div>
          </Reveal>
          <ProjectGrid projects={projects} />
        </section>
      )}

      {settings.features.shop && products.length > 0 && (
        <section id="shop" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
          <Reveal>
            <div className="mb-12 text-center">
              <p
                className="text-xs uppercase tracking-[0.35em]"
                style={{ color: "var(--brand-light)" }}
              >
                Shop
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
                Available works
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {products.slice(0, 3).map((p, i) => (
              <Reveal key={p.id} delay={i * 100}>
                <ProductCard product={p} currency={siteConfig.currency} />
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/shop" className="btn-outline">
              View all products
            </Link>
          </div>
        </section>
      )}

      <Testimonials items={testimonials} />
    </main>
  );
}