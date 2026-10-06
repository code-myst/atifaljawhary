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
import siteConfig from "@/site.config";
import { formatPrice } from "@/lib/format";
import { deleteCloudinaryImages } from "@/lib/adminApi";
import { uploadImage } from "@/lib/uploadImage";
import { useAdminCollection } from "@/lib/useAdminCollection";
import { Badge, Card, EmptyState, Sheet, btn, inputCls } from "@/components/admin/ui";

const MAX_IMAGES = 6;

type Product = {
  id: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  order: number;
  description: string;
  images: string[];
};

function mapProduct(id: string, d: DocumentData): Product {
  return {
    id,
    title: String(d.title ?? ""),
    category: String(d.category ?? ""),
    price: Number(d.price ?? 0),
    stock: Number(d.stock ?? 0),
    order: Number(d.order ?? 0),
    description: String(d.description ?? ""),
    images: Array.isArray(d.images) ? d.images.map(String).filter(Boolean) : [],
  };
}

export default function ProductsManager() {
  const { items, loading, error, reload } = useAdminCollection(
    "products",
    mapProduct
  );

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [order, setOrder] = useState(1);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [original, setOriginal] = useState<string[]>([]);
  const [session, setSession] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory("");
    setPrice("");
    setStock("1");
    setDescription("");
    setImages([]);
    setOriginal([]);
    setSession([]);
  }

  function openNew() {
    resetForm();
    setOrder(items.length + 1);
    setMessage("");
    setOpen(true);
  }

  function openEdit(p: Product) {
    resetForm();
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setPrice(String(p.price));
    setStock(String(p.stock));
    setOrder(p.order);
    setDescription(p.description);
    setImages(p.images);
    setOriginal(p.images);
    setMessage("");
    setOpen(true);
  }

  async function closeSheet() {
    setOpen(false);
    if (session.length > 0) await deleteCloudinaryImages(session);
    resetForm();
  }

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setMessage(`সর্বোচ্চ ${MAX_IMAGES}টা ছবি দেওয়া যায়।`);
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const urls: string[] = [];
      for (const f of files.slice(0, room)) urls.push(await uploadImage(f));
      setImages((prev) => [...prev, ...urls]);
      setSession((prev) => [...prev, ...urls]);
    } catch (e) {
      console.error(e);
      setMessage("Image upload failed. Check cloud name and preset.");
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
    if (session.includes(url)) {
      setSession((prev) => prev.filter((u) => u !== url));
      await deleteCloudinaryImages([url]);
    }
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
      const removed = original.filter((u) => !images.includes(u));
      if (removed.length > 0) await deleteCloudinaryImages(removed);

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

  async function handleDelete(p: Product) {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try {
      await deleteDoc(doc(db, "products", p.id));
      if (p.images.length > 0) await deleteCloudinaryImages(p.images);
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
          {items.length} product{items.length === 1 ? "" : "s"}
        </p>
        <button type="button" onClick={openNew} className={btn.primary}>
          + Add product
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
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-lg bg-neutral-100" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="truncate text-sm text-neutral-500">
                    {p.category} · {formatPrice(p.price, siteConfig.currency)}
                  </p>
                  <div className="mt-1">
                    {p.stock > 0 ? (
                      <Badge tone={p.stock <= 3 ? "amber" : "green"}>
                        {p.stock} in stock
                      </Badge>
                    ) : (
                      <Badge tone="red">Sold out</Badge>
                    )}
                  </div>
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
          <EmptyState>No products yet. Add your first one.</EmptyState>
        )}
      </div>

      <Sheet
        open={open}
        onClose={closeSheet}
        title={editingId ? "Edit product" : "Add product"}
      >
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-4">
          <input
            className={`${inputCls} sm:col-span-2`}
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className={inputCls}
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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

          <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
            Price ({siteConfig.currency})
            <input
              className={inputCls}
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
            Stock (০ দিলে &quot;Sold out&quot;; আসল একটাই কাজ হলে ১)
            <input
              className={inputCls}
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </label>

          <textarea
            className={`${inputCls} sm:col-span-4`}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
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
              className="text-sm"
            />
            {uploading && <p className="mt-1 text-sm text-neutral-500">Uploading...</p>}

            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {images.map((src, i) => (
                  <div key={`${src}-${i}`} className="w-24">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Image ${i + 1}`}
                      className="h-24 w-24 rounded-lg border object-cover"
                    />
                    <div className="mt-1 flex flex-col gap-1 text-xs">
                      {i === 0 ? (
                        <span className="text-center text-neutral-500">Cover</span>
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
                        onClick={() => removeImage(src)}
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

          {message && <p className="text-sm text-red-600 sm:col-span-4">{message}</p>}

          <div className="flex gap-2 sm:col-span-4">
            <button type="submit" disabled={saving || uploading} className={btn.primary}>
              {saving ? "Saving..." : editingId ? "Update product" : "Add product"}
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