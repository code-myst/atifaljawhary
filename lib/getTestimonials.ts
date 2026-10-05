import { unstable_cache } from "next/cache";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
};

const fetchTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> => {
    const snap = await getDocs(
      query(collection(db, "testimonials"), orderBy("order", "asc"))
    );
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name ?? ""),
        role: String(data.role ?? ""),
        text: String(data.text ?? ""),
        rating: Math.min(5, Math.max(0, Number(data.rating ?? 0))),
      };
    });
  },
  ["testimonials"],
  { revalidate: 300, tags: ["testimonials"] }
);

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    return await fetchTestimonials();
  } catch (error) {
    console.error("Testimonials error:", error);
    return [];
  }
}