"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import siteConfig from "@/site.config";

type Item = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  order: number;
};

export default function AdminTestimonials() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [order, setOrder] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "testimonials"), orderBy("order", "asc"))
      );
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name ?? ""),
          role: String(data.role ?? ""),
          text: String(data.text ?? ""),
          rating: Number(data.rating ?? 0),
          order: Number(data.order ?? 0),
        };
      });
      setItems(list);
      setOrder(list.length + 1);
    } catch (error) {
      console.error("Load error:", error);
      setMessage("Could not load testimonials.");
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && u.email === siteConfig.adminEmail) {
        setUser(u);
      } else {
        if (u) await signOut(auth);
        router.replace("/admin/login");
      }
      setChecking(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  function resetForm() {
    setName("");
    setRole("");
    setText("");
    setRating(5);
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = {
        name: name.trim(),
        role: role.trim(),
        text: text.trim(),
        rating: Number(rating),
        order: Number(order),
      };
      if (editingId) {
        await updateDoc(doc(db, "testimonials", editingId), data);
      } else {
        await addDoc(collection(db, "testimonials"), data);
      }
      resetForm();
      await load();
      setMessage("Saved. সাইটে আসতে সর্বোচ্চ ৫ মিনিট লাগতে পারে।");
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Could not save. Check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(t: Item) {
    setEditingId(t.id);
    setName(t.name);
    setRole(t.role);
    setText(t.text);
    setRating(t.rating);
    setOrder(t.order);
    setMessage("");
  }

  async function handleDelete(t: Item) {
    if (!window.confirm(`Delete testimonial from "${t.name}"?`)) return;
    try {
      await deleteDoc(doc(db, "testimonials", t.id));
      if (editingId === t.id) resetForm();
      await load();
      setMessage("Deleted.");
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Could not delete. Check your Firestore rules.");
    }
  }

  if (checking || !user) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="py-6">
        <Link href="/admin" className="text-sm text-gray-600 hover:underline">
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Testimonials</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid gap-3 rounded-lg border p-4 sm:grid-cols-3"
      >
        <input
          placeholder="Client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded border p-2"
        />
        <input
          placeholder="Role / company (optional)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded border p-2"
        />
        <div className="flex gap-2">
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full rounded border p-2"
            aria-label="Rating"
          >
            {[5, 4, 3, 2, 1, 0].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "No rating" : `${n} star${n > 1 ? "s" : ""}`}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            required
            className="w-20 rounded border p-2"
            aria-label="Order"
            title="Order"
          />
        </div>
        <textarea
          placeholder="What the client said"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={4}
          className="rounded border p-2 sm:col-span-3"
        />
        <div className="flex gap-2 sm:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add testimonial"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border px-4 py-2"
            >
              Cancel
            </button>
          )}
        </div>
        {message && (
          <p className="text-sm text-gray-700 sm:col-span-3">{message}</p>
        )}
      </form>

      <ul className="flex flex-col gap-2">
        {items.map((t) => (
          <li
            key={t.id}
            className="flex items-start justify-between gap-3 rounded border p-3"
          >
            <div>
              <p className="font-semibold">
                {t.name}
                {t.role && (
                  <span className="font-normal text-gray-500"> · {t.role}</span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {t.rating > 0 ? `${t.rating}★` : "No rating"} · order {t.order}
              </p>
              <p className="mt-1 line-clamp-2 text-sm">{t.text}</p>
            </div>
            <div className="flex shrink-0 gap-2 text-sm">
              <button
                onClick={() => startEdit(t)}
                className="rounded border px-3 py-1"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(t)}
                className="rounded border px-3 py-1 text-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-gray-500">No testimonials yet.</p>
        )}
      </ul>
    </main>
  );
}