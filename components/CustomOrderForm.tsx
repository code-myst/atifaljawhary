"use client";

import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Icon from "@/components/Icon";
import { useAuth } from "@/components/Providers";
import { db } from "@/lib/firebase";
import { uploadImage } from "@/lib/uploadImage";

const MAX_IMAGES = 3;

export default function CustomOrderForm({
  whatsappNumber,
}: {
  whatsappNumber: string;
}) {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [size, setSize] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setName((n) => n || user.displayName || "");
  }, [user]);

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_IMAGES} reference images.`);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files.slice(0, room)) {
        urls.push(await uploadImage(f));
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (phone.trim().length < 6) {
      setError("Please enter a valid phone number.");
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, "requests"), {
        name: name.trim().slice(0, 100),
        phone: phone.trim(),
        title: title.trim().slice(0, 150),
        details: details.trim().slice(0, 2000),
        size: size.trim().slice(0, 100),
        deadline,
        budget: budget.trim().slice(0, 100),
        images,
        uid: user?.uid ?? null,
        status: "new",
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch (err) {
      console.error("Request error:", err);
      setError("Could not send your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    const text = [
      `Hello! I sent a custom order request: "${title}".`,
      size && `Size: ${size}`,
      deadline && `Needed by: ${deadline}`,
      budget && `Budget: ${budget}`,
    ]
      .filter(Boolean)
      .join("\n");

    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--brand), transparent 85%)",
            color: "var(--brand-light)",
          }}
        >
          <Icon name="check" className="text-xl" />
        </div>
        <h2 className="font-display gold-text mt-5 text-2xl font-bold">
          Request sent
        </h2>
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          Thank you! We will review your request and contact you with the price
          and timeline.
        </p>
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold mt-6"
          >
            <Icon name="whatsapp" /> Message on WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-2xl p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="field"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <input
          className="field"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          required
        />
        <input
          className="field sm:col-span-2"
          placeholder="What do you need? (e.g. Name calligraphy, logo design)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="field sm:col-span-2"
          placeholder="Describe your idea: text, style, colors, where it will be used..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={5}
        />
        <input
          className="field"
          placeholder="Size (optional)"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />
        <input
          className="field"
          placeholder="Budget (optional)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span style={{ color: "var(--muted)" }}>Needed by (optional)</span>
          <input
            className="field"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm" style={{ color: "var(--muted)" }}>
          Reference images (optional, up to {MAX_IMAGES})
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
        {uploading && (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Uploading...
          </p>
        )}
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {images.map((src, i) => (
              <div key={`${src}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Reference ${i + 1}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, n) => n !== i))
                  }
                  aria-label="Remove image"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs"
                  style={{ background: "#f4efe3", color: "#111" }}
                >
                  <Icon name="xmark" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm" style={{ color: "#e57373" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || uploading}
        className="btn-gold mt-6 disabled:opacity-60"
      >
        {busy ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}