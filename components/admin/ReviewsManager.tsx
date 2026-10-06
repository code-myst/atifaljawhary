"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DocumentData,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDate } from "@/lib/format";
import { useAdminCollection } from "@/lib/useAdminCollection";
import { useAdmin } from "@/components/admin/AdminShell";
import { Badge, Card, EmptyState, Tone, btn } from "@/components/admin/ui";

type ReviewStatus = "pending" | "approved" | "rejected";

type AdminReview = {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: unknown;
};

const tone: Record<ReviewStatus, Tone> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
};

function mapReview(id: string, d: DocumentData): AdminReview {
  const s = String(d.status);
  return {
    id,
    productId: String(d.productId ?? ""),
    userName: String(d.userName ?? "Customer"),
    rating: Number(d.rating ?? 0),
    text: String(d.text ?? ""),
    status: (s === "approved" || s === "rejected" ? s : "pending") as ReviewStatus,
    createdAt: d.createdAt,
  };
}

function mapTitle(id: string, d: DocumentData) {
  return { id, title: String(d.title ?? "") };
}

export default function ReviewsManager() {
  const { dataKey, refreshCounts } = useAdmin();
  const { items: products } = useAdminCollection("products", mapTitle);

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | ReviewStatus>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(50))
      );
      setReviews(snap.docs.map((d) => mapReview(d.id, d.data())));
    } catch (e) {
      console.error("Reviews error:", e);
      setMessage("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, dataKey]);

  const titles = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.title])),
    [products]
  );

  async function setStatus(r: AdminReview, status: ReviewStatus) {
    setBusyId(r.id);
    try {
      await updateDoc(doc(db, "reviews", r.id), { status });
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
      refreshCounts();
      setMessage("Updated. সাইটে আসতে সর্বোচ্চ ৫ মিনিট লাগতে পারে।");
    } catch (e) {
      console.error(e);
      setMessage("Could not update the review.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(r: AdminReview) {
    if (!window.confirm("Delete this review?")) return;
    setBusyId(r.id);
    try {
      await deleteDoc(doc(db, "reviews", r.id));
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      refreshCounts();
    } catch (e) {
      console.error(e);
      setMessage("Could not delete the review.");
    } finally {
      setBusyId(null);
    }
  }

  const shown = reviews.filter((r) => filter === "all" || r.status === filter);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-sm capitalize transition ${
              filter === s
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white hover:bg-neutral-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {message && <p className="mb-3 text-sm text-neutral-700">{message}</p>}

      <div className="flex flex-col gap-3">
        {shown.map((r) => {
          const busy = busyId === r.id;
          return (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.userName}</p>
                  <p className="text-sm text-neutral-500">
                    {titles[r.productId] || "Unknown product"} ·{" "}
                    {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-amber-500">
                    {"★".repeat(r.rating)}
                    <span className="text-neutral-300">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  <Badge tone={tone[r.status]}>{r.status}</Badge>
                </div>
              </div>

              {r.text && (
                <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">
                  {r.text}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {r.status !== "approved" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(r, "approved")}
                    className={btn.primary}
                  >
                    Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(r, "rejected")}
                    className={btn.secondary}
                  >
                    Reject
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(r)}
                  className={btn.danger}
                >
                  Delete
                </button>
              </div>
            </Card>
          );
        })}

        {!loading && shown.length === 0 && <EmptyState>No reviews here.</EmptyState>}
        {loading && <p className="text-sm text-neutral-500">Loading...</p>}
      </div>
    </>
  );
}