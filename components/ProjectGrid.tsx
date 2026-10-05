"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Project } from "@/site.config";
import Reveal from "@/components/Reveal";
import Icon from "@/components/Icon";

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category).filter(Boolean))),
    [projects]
  );

  const visible = active
    ? projects.filter((p) => p.category === active)
    : projects;

  return (
    <>
      {categories.length > 0 && (
        <nav className="mb-10 flex flex-wrap justify-center gap-2">
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

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 100}>
            <Link
              href={`/projects/${p.id}`}
              className="work-card group block overflow-hidden rounded-xl"
            >
              <div className="aspect-[4/3] overflow-hidden">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--surface), color-mix(in srgb, var(--brand), black 80%))",
                      color: "var(--brand-light)",
                    }}
                  >
                    <Icon name="image" className="text-3xl opacity-40" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "var(--brand-light)" }}
                >
                  {p.category}
                </p>
                <h3 className="font-display mt-1 text-xl">{p.title}</h3>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>

      {visible.length === 0 && (
        <p className="py-10 text-center" style={{ color: "var(--muted)" }}>
          No projects found.
        </p>
      )}
    </>
  );
}