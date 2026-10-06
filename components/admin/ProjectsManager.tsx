"use client";

import { FormEvent, useState } from "react";
import {
  DocumentData,
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteCloudinaryImages } from "@/lib/adminApi";
import { uploadImage } from "@/lib/uploadImage";
import { useAdminCollection } from "@/lib/useAdminCollection";
import { Card, EmptyState, Sheet, btn, inputCls } from "@/components/admin/ui";

type Project = {
  id: string;
  title: string;
  category: string;
  order: number;
  imageUrl: string;
  description: string;
};

function mapProject(id: string, d: DocumentData): Project {
  return {
    id,
    title: String(d.title ?? ""),
    category: String(d.category ?? ""),
    order: Number(d.order ?? 0),
    imageUrl: String(d.imageUrl ?? ""),
    description: String(d.description ?? ""),
  };
}

export default function ProjectsManager() {
  const { items, loading, error, reload } = useAdminCollection(
    "projects",
    mapProject
  );

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState(1);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [original, setOriginal] = useState("");
  const [session, setSession] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory("");
    setDescription("");
    setImageUrl("");
    setOriginal("");
    setSession([]);
  }

  function openNew() {
    resetForm();
    setOrder(items.length + 1);
    setMessage("");
    setOpen(true);
  }

  function openEdit(p: Project) {
    resetForm();
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setOrder(p.order);
    setDescription(p.description);
    setImageUrl(p.imageUrl);
    setOriginal(p.imageUrl);
    setMessage("");
    setOpen(true);
  }

  async function closeSheet() {
    setOpen(false);
    if (session.length > 0) await deleteCloudinaryImages(session);
    resetForm();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const url = await uploadImage(file);
      if (session.includes(imageUrl)) await deleteCloudinaryImages([imageUrl]);
      setSession((prev) => [...prev.filter((u) => u !== imageUrl), url]);
      setImageUrl(url);
    } catch (e) {
      console.error(e);
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
        description: description.trim(),
        imageUrl,
      };
      if (editingId) {
        await updateDoc(doc(db, "projects", editingId), data);
      } else {
        await addDoc(collection(db, "projects"), data);
      }
      if (original && original !== imageUrl) {
        await deleteCloudinaryImages([original]);
      }
      setOpen(false);
      resetForm();
      await reload();
      setMessage("Saved. সাইটে আসতে সর্বোচ্চ ৫ মিনিট লাগতে পারে।");
    } catch (err) {
      console.error(err);
      setMessage("Could not save. Check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Project) {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try {
      await deleteDoc(doc(db, "projects", p.id));
      if (p.imageUrl) await deleteCloudinaryImages([p.imageUrl]);
      await reload();
      setMessage("Deleted.");
    } catch (err) {
      console.error(err);
      setMessage("Could not delete. Check your Firestore rules.");
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          {items.length} project{items.length === 1 ? "" : "s"}
        </p>
        <button type="button" onClick={openNew} className={btn.primary}>
          + Add project
        </button>
      </div>

      {(message || error) && (
        <p className="mb-3 text-sm text-neutral-700">{message || error}</p>
      )}

      <div className="flex flex-col gap-2">
        {items.map((p) => (
          <Card key={p.id} className="!p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-lg bg-neutral-100" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="truncate text-sm text-neutral-500">
                    {p.category} · order {p.order}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => openEdit(p)} className={btn.secondary}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(p)} className={btn.danger}>
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!loading && items.length === 0 && (
          <EmptyState>No projects yet. Add your first one.</EmptyState>
        )}
      </div>

      <Sheet
        open={open}
        onClose={closeSheet}
        title={editingId ? "Edit project" : "Add project"}
      >
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <input
            className={`${inputCls} sm:col-span-2`}
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className={inputCls}
            type="number"
            placeholder="Order"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            required
          />
          <input
            className={`${inputCls} sm:col-span-3`}
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <textarea
            className={`${inputCls} sm:col-span-3`}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          <div className="sm:col-span-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                handleFile(f);
              }}
              className="text-sm"
            />
            {uploading && <p className="mt-1 text-sm text-neutral-500">Uploading...</p>}
            {imageUrl && (
              <div className="mt-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg border object-cover"
                />
                <button
                  type="button"
                  className={btn.danger}
                  onClick={async () => {
                    if (session.includes(imageUrl)) {
                      await deleteCloudinaryImages([imageUrl]);
                      setSession((prev) => prev.filter((u) => u !== imageUrl));
                    }
                    setImageUrl("");
                  }}
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          {message && <p className="text-sm text-red-600 sm:col-span-3">{message}</p>}

          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" disabled={saving || uploading} className={btn.primary}>
              {saving ? "Saving..." : editingId ? "Update project" : "Add project"}
            </button>
            <button type="button" onClick={closeSheet} className={btn.secondary}>
              Cancel
            </button>
          </div>
        </form>
      </Sheet>
    </>
  );
}