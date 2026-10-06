import { unstable_cache } from "next/cache";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Review = {
  id: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: number;
};

const fetchReviews = unstable_cache(
  async (productId: string): Promise<Review[]> => {
    const snap = await getDocs(
      query(
        collection(db, "reviews"),
        where("productId", "==", productId),
        where("status", "==", "approved"),
        limit(50)
      )
    );
    const list = snap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt as { toMillis?: () => number } | undefined;
      return {
        id: d.id,
        userName: String(data.userName ?? "Customer"),
        rating: Math.min(5, Math.max(1, Number(data.rating ?? 5))),
        text: String(data.text ?? ""),
        createdAt: typeof ts?.toMillis === "function" ? ts.toMillis() : 0,
      };
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },
  ["reviews"],
  { revalidate: 10, tags: ["reviews"] }
);

export async function getReviews(productId: string): Promise<Review[]> {
  try {
    return await fetchReviews(productId);
  } catch (error) {
    console.error("Reviews error:", error);
    return [];
  }
}