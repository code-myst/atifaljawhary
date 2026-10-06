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
import { useAdminCollection } from "@/lib/useAdminCollection";
import { Card, EmptyState, Sheet, btn, inputCls } from "@/components/admin/ui";

type Item = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  order: number;
};

function mapItem(id: string, d: DocumentData): Item {
  return {
    id,
    name: String(d.name ?? ""),
    role: String(d.role ?? ""),
    text: String(d.text ?? ""),
    rating: Number(d.rating ?? 0),
    order: Number(d.order ?? 0),
  };
}

export default function TestimonialsManager() {
  const { items, loading, error, reload } = useAdminCollection(
    "testimonials",
    mapItem
  );

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [order, setOrder] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function resetForm() {
    setEditingId(null);
    setName("");
    setRole("");
    setText("");
    setRating(5);
  }

  function openNew() {
    resetForm();
    setOrder(items.length + 1);
    setMessage("");
    setOpen(true);
  }

  function openEdit(t: Item) {
    setEditingId(t.id);
    setName(t.name);
    setRole(t.role);
    setText(t.text);
    setRating(t.rating);
    setOrder(t.order);
    setMessage("");
    setOpen(true);
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

  async function handleDelete(t: Item) {
    if (!window.confirm(`Delete testimonial from "${t.name}"?`)) return;
    try {
      await deleteDoc(doc(db, "testimonials", t.id));
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
          {items.length} testimonial{items.length === 1 ? "" : "s"}
        </p>
        <button type="button" onClick={openNew} className={btn.primary}>
          + Add testimonial
        </button>
      </div>

      {(message || error) && (
        <p className="mb-3 text-sm text-neutral-700">{message || error}</p>
      )}

      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <Card key={t.id} className="!p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {t.name}
                  {t.role && (
                    <span className="font-normal text-neutral-500"> · {t.role}</span>
                  )}
                </p>
                <p className="text-sm text-amber-500">
                  {t.rating > 0 ? "★".repeat(t.rating) : ""}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-700">{t.text}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => openEdit(t)} className={btn.secondary}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(t)} className={btn.danger}>
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!loading && items.length === 0 && (
          <EmptyState>No testimonials yet.</EmptyState>
        )}
      </div>

      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editingId ? "Edit testimonial" : "Add testimonial"}
      >
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <input
            className={inputCls}
            placeholder="Client name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={inputCls}
            placeholder="Role / company (optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              className={inputCls}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              aria-label="Rating"
            >
              {[5, 4, 3, 2, 1, 0].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "No rating" : `${n} star${n > 1 ? "s" : ""}`}
                </option>
              ))}
            </select>
            <input
              className={`${inputCls} w-20`}
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              aria-label="Order"
              title="Order"
              required
            />
          </div>
          <textarea
            className={`${inputCls} sm:col-span-3`}
            placeholder="What the client said"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            required
          />
          {message && <p className="text-sm text-red-600 sm:col-span-3">{message}</p>}
          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" disabled={saving} className={btn.primary}>
              {saving ? "Saving..." : editingId ? "Update" : "Add testimonial"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className={btn.secondary}
            >
              Cancel
            </button>
          </div>
        </form>
      </Sheet>
    </>
  );
}