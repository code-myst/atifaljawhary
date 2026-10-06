"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import Icon from "@/components/Icon";
import { useAuth } from "@/components/Providers";
import { db } from "@/lib/firebase";
import type { Review } from "@/lib/getReviews";

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5 text-sm" style={{ color: "var(--brand)" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ opacity: i < value ? 1 : 0.2 }}>
          <Icon name="star" />
        </span>
      ))}
    </span>
  );
}

export default function ReviewsSection({
  productId,
  reviews,
}: {
  productId: string;
  reviews: Review[];
}) {
  const { user, loading } = useAuth();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const average =
    reviews.length > 0
      ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
      : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setBusy(true);
    try {
      await setDoc(doc(db, "reviews", `${user.uid}_${productId}`), {
        productId,
        uid: user.uid,
        userName:
          (user.displayName || user.email?.split("@")[0] || "Customer").slice(
            0,
            80
          ),
        rating,
        text: text.trim().slice(0, 1000),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Review error:", err);
      const code = (err as { code?: string }).code;
      setError(
        code === "permission-denied"
          ? "You have probably already reviewed this product."
          : "Could not submit your review. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl">Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Stars value={Math.round(average)} />
            <span style={{ color: "var(--muted)" }}>
              {average.toFixed(1)} ({reviews.length})
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-4" style={{ color: "var(--muted)" }}>
          No reviews yet.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {reviews.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{r.userName}</p>
                <Stars value={r.rating} />
              </div>
              {r.text && (
                <p
                  className="mt-2 whitespace-pre-line text-sm leading-relaxed"
                  style={{ color: "var(--text)", opacity: 0.85 }}
                >
                  {r.text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="card mt-8 p-5">
        <h3 className="font-display text-lg">Write a review</h3>

        {loading ? null : !user ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            <Link
              href="/account"
              className="underline hover:text-[var(--brand-light)]"
            >
              Log in
            </Link>{" "}
            to write a review.
          </p>
        ) : submitted ? (
          <p className="mt-2 text-sm" style={{ color: "var(--brand-light)" }}>
            Thank you! Your review will appear after approval.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className="text-2xl transition"
                  style={{
                    color: "var(--brand)",
                    opacity: n <= rating ? 1 : 0.25,
                  }}
                >
                  <Icon name="star" />
                </button>
              ))}
            </div>
            <textarea
              className="field"
              placeholder="Share your experience (optional)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            {error && (
              <p className="text-sm" style={{ color: "#e57373" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="btn-gold w-fit disabled:opacity-60"
            >
              {busy ? "Sending..." : "Submit review"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}