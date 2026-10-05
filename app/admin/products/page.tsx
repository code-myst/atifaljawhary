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
import { formatPrice } from "@/lib/format";

const MAX_IMAGES = 6;

type Item = {
  id: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  order: number;
  description: string;
  images: string[];
};

export default function AdminProducts() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [order, setOrder] = useState(1);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "products"), orderBy("order", "asc"))
      );
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title ?? ""),
          category: String(data.category ?? ""),
          price: Number(data.price ?? 0),
          stock: Number(data.stock ?? 0),
          order: Number(data.order ?? 0),
          description: String(data.description ?? ""),
          images: Array.isArray(data.images)
            ? data.images.map(String).filter(Boolean)
            : [],
        };
      });
      setItems(list);
      setOrder(list.length + 1);
    } catch (error) {
      console.error("Load error:", error);
      setMessage("Could not load products.");
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
    setTitle("");
    setCategory("");
    setPrice("");
    setStock("1");
    setDescription("");
    setImages([]);
    setEditingId(null);
  }

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setMessage(`সর্বোচ্চ ${MAX_IMAGES}টা ছবি দেওয়া যায়।`);
      return;
    }
    const picked = files.slice(0, remaining);

    setUploading(true);
    setMessage("");
    try {
      const urls: string[] = [];
      for (const file of picked) {
        const body = new FormData();
        body.append("file", file);
        body.append("upload_preset", siteConfig.cloudinary.uploadPreset);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${siteConfig.cloudinary.cloudName}/image/upload`,
          { method: "POST", body }
        );
        if (!res.ok) throw new Error("Upload failed");
        const json = await res.json();
        urls.push(json.secure_url);
      }
      setImages((prev) => [...prev, ...urls]);
      if (files.length > remaining) {
        setMessage(`শুধু প্রথম ${remaining}টা ছবি নেওয়া হয়েছে (সর্বোচ্চ ${MAX_IMAGES}টা)।`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Image upload failed. Check cloud name and preset.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    setImages((prev) => {
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const priceNum = Number(price);
    const stockNum = Math.floor(Number(stock));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setMessage("দাম সঠিক নয়।");
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      setMessage("স্টক সঠিক নয়।");
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        category: category.trim(),
        price: priceNum,
        stock: stockNum,
        order: Number(order),
        description: description.trim(),
        images,
      };
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), data);
      } else {
        await addDoc(collection(db, "products"), data);
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

  function startEdit(p: Item) {
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setPrice(String(p.price));
    setStock(String(p.stock));
    setOrder(p.order);
    setDescription(p.description);
    setImages(p.images);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(p: Item) {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try {
      await deleteDoc(doc(db, "products", p.id));
      if (editingId === p.id) resetForm();
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
    <main className="mx-auto max-w-4xl p-4">
      <div className="py-6">
        <Link href="/admin" className="text-sm text-gray-600 hover:underline">
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Products</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid gap-3 rounded-lg border p-4 sm:grid-cols-4"
      >
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="rounded border p-2 sm:col-span-2"
        />
        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="rounded border p-2"
        />
        <input
          type="number"
          placeholder="Order"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          required
          className="rounded border p-2"
        />

        <label className="flex flex-col gap-1 text-xs text-gray-500 sm:col-span-2">
          Price ({siteConfig.currency})
          <input
            type="number"
            min="0"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="rounded border p-2 text-base text-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 sm:col-span-2">
          Stock (০ দিলে &quot;Sold out&quot; দেখাবে; আসল একটাই কাজ হলে ১ দিন)
          <input
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            className="rounded border p-2 text-base text-neutral-900"
          />
        </label>

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="rounded border p-2 sm:col-span-4"
        />

        <div className="sm:col-span-4">
          <p className="mb-1 text-sm">
            Images (সর্বোচ্চ {MAX_IMAGES}টা, প্রথমটা কভার)
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              handleFiles(files);
            }}
          />
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}

          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {images.map((src, i) => (
                <div key={`${src}-${i}`} className="w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Image ${i + 1}`}
                    className="h-24 w-24 rounded border object-cover"
                  />
                  <div className="mt-1 flex flex-col gap-1 text-xs">
                    {i === 0 ? (
                      <span className="text-center text-gray-500">Cover</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeCover(i)}
                        className="rounded border px-1 py-0.5"
                      >
                        Make cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="rounded border px-1 py-0.5 text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 sm:col-span-4">
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update product" : "Add product"}
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
          <p className="text-sm text-gray-700 sm:col-span-4">{message}</p>
        )}
      </form>

      <ul className="flex flex-col gap-2">
        {items.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded border p-3"
          >
            <div className="flex items-center gap-3">
              {p.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.images[0]}
                  alt={p.title}
                  className="h-14 w-14 rounded object-cover"
                />
              )}
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-sm text-gray-500">
                  {p.category} · {formatPrice(p.price, siteConfig.currency)} ·{" "}
                  {p.stock > 0 ? `${p.stock} in stock` : "Sold out"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 text-sm">
              <button
                onClick={() => startEdit(p)}
                className="rounded border px-3 py-1"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p)}
                className="rounded border px-3 py-1 text-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <p className="text-gray-500">No products yet.</p>}
      </ul>
    </main>
  );
}