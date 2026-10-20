import Link from "next/link";
import Icon from "@/components/Icon";
import type { Project } from "@/site.config";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="work-card group block h-full overflow-hidden rounded-xl"
    >
      <div className="aspect-[4/3] overflow-hidden">
        {project.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.imageUrl}
            alt={project.title}
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

      <div className="p-3 sm:p-4">
        <p
          className="truncate text-[10px] uppercase tracking-widest sm:text-xs"
          style={{ color: "var(--brand-light)" }}
        >
          {project.category}
        </p>
        <h3 className="font-display mt-1 line-clamp-2 text-base sm:text-lg">
          {project.title}
        </h3>
      </div>
    </Link>
  );
}
