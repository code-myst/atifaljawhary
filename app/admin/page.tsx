"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

type AdminProject = {
  id: string;
  title: string;
  category: string;
  order: number;
  imageUrl: string;
  description: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState(1);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadProjects = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "projects"), orderBy("order", "asc"))
      );
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title ?? ""),
          category: String(data.category ?? ""),
          order: Number(data.order ?? 0),
          imageUrl: String(data.imageUrl ?? ""),
          description: String(data.description ?? ""),
        };
      });
      setProjects(list);
      setOrder(list.length + 1);
    } catch (error) {
      console.error("Load error:", error);
      setMessage("Could not load projects.");
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
    if (user) loadProjects();
  }, [user, loadProjects]);

  function resetForm() {
    setTitle("");
    setCategory("");
    setEditingId(null);
    setImageUrl("");
    setDescription("");
  }

  async function handleImageChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", siteConfig.cloudinary.uploadPreset);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${siteConfig.cloudinary.cloudName}/image/upload`,
        { method: "POST", body }
      );
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      setImageUrl(json.secure_url);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Image upload failed. Check cloud name and preset.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = {
        title: title.trim(),
        category: category.trim(),
        order: Number(order),
        imageUrl,
        description: description.trim(),
      };
      if (editingId) {
        await updateDoc(doc(db, "projects", editingId), data);
      } else {
        await addDoc(collection(db, "projects"), data);
      }
      resetForm();
      await loadProjects();
      setMessage("Saved.");
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Could not save. Check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: AdminProject) {
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setOrder(p.order);
    setImageUrl(p.imageUrl);
    setDescription(p.description);
    setMessage("");
  }

  async function handleDelete(p: AdminProject) {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try {
      await deleteDoc(doc(db, "projects", p.id));
      if (editingId === p.id) resetForm();
      await loadProjects();
      setMessage("Deleted.");
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Could not delete. Check your Firestore rules.");
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.replace("/admin/login");
  }

  if (checking || !user) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-600">Logged in as {user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/testimonials"
            className="rounded border px-3 py-1 text-sm"
          >
            Testimonials
          </Link>
          <Link
            href="/admin/products"
            className="rounded border px-3 py-1 text-sm"
          >
            Products
          </Link>
          <button
            onClick={handleLogout}
            className="rounded border px-3 py-1 text-sm"
          >
            Logout
          </button>
        </div>
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

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="rounded border p-2 sm:col-span-4"
        />

        <div className="sm:col-span-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0])}
          />
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-2 h-24 rounded border object-cover"
            />
          )}
        </div>

        <div className="flex gap-2 sm:col-span-4">
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded px-4 py-2 text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--brand)" }}
          >
            {saving ? "Saving..." : editingId ? "Update project" : "Add project"}
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
        {projects.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded border p-3"
          >
            <div className="flex items-center gap-3">
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="h-12 w-12 rounded object-cover"
                />
              )}
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-sm text-gray-500">
                  {p.category} · order {p.order}
                </p>
              </div>
            </div>
            <div className="flex gap-2 text-sm">
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
        {projects.length === 0 && (
          <p className="text-gray-500">No projects yet.</p>
        )}
      </ul>
    </main>
  );
}