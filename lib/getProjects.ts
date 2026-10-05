import { unstable_cache } from "next/cache";
import {
  collection,
  DocumentData,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import siteConfig, { Project } from "@/site.config";

function mapProject(id: string, data: DocumentData): Project {
  return {
    id,
    title: String(data.title ?? ""),
    category: String(data.category ?? ""),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    description: data.description ? String(data.description) : undefined,
  };
}

const fetchProjects = unstable_cache(
  async (): Promise<Project[]> => {
    console.log("[firestore] reading projects"); // সাময়িক, যাচাইয়ের পর মুছবেন
    const snap = await getDocs(
      query(collection(db, "projects"), orderBy("order", "asc"))
    );
    if (snap.empty) return siteConfig.projects;
    return snap.docs.map((d) => mapProject(d.id, d.data()));
  },
  ["projects"],
  { revalidate: 300, tags: ["projects"] }
);

export async function getProjects(): Promise<Project[]> {
  try {
    return await fetchProjects();
  } catch (error) {
    console.error("Firestore error:", error);
    return siteConfig.projects;
  }
}

export async function getProject(id: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.id === id) ?? null;
}