import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectGrid from "@/components/ProjectGrid";
import { getProjects } from "@/lib/getProjects";
import { getSettings } from "@/lib/getSettings";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return { title: `All work | ${settings.name}` };
}

export default async function WorkPage() {
  const settings = await getSettings();
  if (!settings.features.portfolio) notFound();

  const projects = await getProjects();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-6">
      <Link
        href="/#work"
        className="text-sm transition hover:text-[var(--brand-light)]"
        style={{ color: "var(--muted)" }}
      >
        ← Back
      </Link>

      <div className="mb-10 mt-6 text-center">
        <p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ color: "var(--brand-light)" }}
        >
          Portfolio
        </p>
        <h1 className="font-display gold-text mt-3 text-4xl font-bold">
          All work
        </h1>
      </div>

      <ProjectGrid projects={projects} layout="grid" />
    </main>
  );
}
