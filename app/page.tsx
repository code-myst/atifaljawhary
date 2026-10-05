import { getProjects } from "@/lib/getProjects";
import { getSettings } from "@/lib/getSettings";
import { getTestimonials } from "@/lib/getTestimonials";
import Hero from "@/components/Hero";
import About from "@/components/About";
import ProjectGrid from "@/components/ProjectGrid";
import Testimonials from "@/components/Testimonials";
import Reveal from "@/components/Reveal";

export const revalidate = 300;

export default async function Home() {
  const settings = await getSettings();
  const projects = settings.features.portfolio ? await getProjects() : [];
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

      <Testimonials items={testimonials} />
    </main>
  );
}