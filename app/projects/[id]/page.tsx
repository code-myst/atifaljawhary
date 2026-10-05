import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/getProjects";
import { getSettings } from "@/lib/getSettings";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const settings = await getSettings();
  const project = await getProject(id);
  if (!project) return { title: settings.name };

  return {
    title: `${project.title} | ${settings.name}`,
    description:
      project.description || `${project.category} project by ${settings.name}`,
    openGraph: {
      title: project.title,
      description: project.description || project.category,
      images: project.imageUrl ? [project.imageUrl] : [],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;

  const settings = await getSettings();
  if (!settings.features.portfolio) notFound();

  const project = await getProject(id);
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/#work"
        className="text-sm transition hover:text-[var(--brand-light)]"
        style={{ color: "var(--muted)" }}
      >
        ← Back to all work
      </Link>

      {project.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.imageUrl}
          alt={project.title}
          className="mt-6 w-full rounded-xl border object-cover"
          style={{ borderColor: "var(--line)" }}
        />
      ) : (
        <div
          className="mt-6 flex h-72 items-center justify-center rounded-xl border"
          style={{
            borderColor: "var(--line)",
            background:
              "linear-gradient(135deg, var(--surface), color-mix(in srgb, var(--brand), black 80%))",
            color: "var(--muted)",
          }}
        >
          Image placeholder
        </div>
      )}

      <p
        className="mt-8 text-xs uppercase tracking-[0.3em]"
        style={{ color: "var(--brand-light)" }}
      >
        {project.category}
      </p>
      <h1 className="font-display gold-text mt-2 text-4xl font-bold">
        {project.title}
      </h1>

      {project.description && (
        <p
          className="mt-6 whitespace-pre-line text-lg leading-relaxed"
          style={{ color: "var(--text)", opacity: 0.85 }}
        >
          {project.description}
        </p>
      )}
    </main>
  );
}