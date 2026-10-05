import { unstable_cache } from "next/cache";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Product = {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  images: string[];
  stock: number;
};

const fetchProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const snap = await getDocs(
      query(collection(db, "products"), orderBy("order", "asc"))
    );
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: String(data.title ?? ""),
        category: String(data.category ?? ""),
        price: Number(data.price ?? 0),
        description: String(data.description ?? ""),
        images: Array.isArray(data.images)
          ? data.images.map(String).filter(Boolean)
          : [],
        stock: Math.max(0, Number(data.stock ?? 0)),
      };
    });
  },
  ["products"],
  { revalidate: 300, tags: ["products"] }
);

export async function getProducts(): Promise<Product[]> {
  try {
    return await fetchProducts();
  } catch (error) {
    console.error("Products error:", error);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) ?? null;
}