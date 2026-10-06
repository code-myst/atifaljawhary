import { useCallback, useEffect, useState } from "react";
import {
  DocumentData,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// `map` ফাংশনটা কম্পোনেন্টের বাইরে (ফাইলের ওপরে) লেখা থাকতে হবে।
export function useAdminCollection<T>(
  name: string,
  map: (id: string, data: DocumentData) => T
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const snap = await getDocs(
        query(collection(db, name), orderBy("order", "asc"))
      );
      setItems(snap.docs.map((d) => map(d.id, d.data())));
    } catch (e) {
      console.error(`Load ${name} error:`, e);
      setError(`Could not load ${name}.`);
    } finally {
      setLoading(false);
    }
  }, [name, map]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}