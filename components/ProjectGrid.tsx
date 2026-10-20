"use client";

import { useMemo, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import Slider from "@/components/Slider";
import type { Project } from "@/site.config";

export default function ProjectGrid({
  projects,
  layout = "grid",
  limit,
}: {
  projects: Project[];
  layout?: "grid" | "slider";
  limit?: number;
}) {
  const [active, setActive] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category).filter(Boolean))),
    [projects]
  );

  const filtered = active
    ? projects.filter((p) => p.category === active)
    : projects;
  const visible = limit ? filtered.slice(0, limit) : filtered;

  return (
    <>
      {categories.length > 0 && (
        <nav className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActive("")}
            className={`pill ${!active ? "pill-active" : ""}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`pill ${active === c ? "pill-active" : ""}`}
            >
              {c}
            </button>
          ))}
        </nav>
      )}

      {layout === "slider" ? (
        <Slider
          key={active}
          label="Portfolio"
          perView={{ base: 2, md: 4, lg: 5 }}
        >
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </Slider>
      ) : (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </section>
      )}

      {visible.length === 0 && (
        <p className="py-10 text-center" style={{ color: "var(--muted)" }}>
          No projects found.
        </p>
      )}
    </>
  );
}
