"use client";

import { useCallback, useEffect, useState } from "react";
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
import { deleteCloudinaryImages } from "@/lib/adminApi";
import { formatDate } from "@/lib/format";
import { useAdmin } from "@/components/admin/AdminShell";
import { Badge, Card, EmptyState, Tone, btn, inputCls } from "@/components/admin/ui";

const requestStatusLabels = {
  new: "New",
  quoted: "Quoted",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
} as const;

type RequestStatus = keyof typeof requestStatusLabels;
const statuses = Object.keys(requestStatusLabels) as RequestStatus[];

const tone: Record<RequestStatus, Tone> = {
  new: "amber",
  quoted: "blue",
  in_progress: "blue",
  done: "green",
  cancelled: "red",
};

type Req = {
  id: string;
  name: string;
  phone: string;
  title: string;
  details: string;
  size: string;
  deadline: string;
  budget: string;
  images: string[];
  status: RequestStatus;
  adminNote: string;
  createdAt: unknown;
};

function mapRequest(id: string, d: DocumentData): Req {
  return {
    id,
    name: String(d.name ?? ""),
    phone: String(d.phone ?? ""),
    title: String(d.title ?? ""),
    details: String(d.details ?? ""),
    size: String(d.size ?? ""),
    deadline: String(d.deadline ?? ""),
    budget: String(d.budget ?? ""),
    images: Array.isArray(d.images) ? d.images.map(String).filter(Boolean) : [],
    status: (String(d.status) in requestStatusLabels
      ? d.status
      : "new") as RequestStatus,
    adminNote: String(d.adminNote ?? ""),
    createdAt: d.createdAt,
  };
}

export default function RequestsManager() {
  const { dataKey, refreshCounts } = useAdmin();
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(50))
      );
      const list = snap.docs.map((d) => mapRequest(d.id, d.data()));
      setItems(list);
      setNotes(Object.fromEntries(list.map((r) => [r.id, r.adminNote])));
    } catch (e) {
      console.error("Requests error:", e);
      setMessage("Could not load requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, dataKey]);

  async function setStatus(r: Req, status: RequestStatus) {
    setBusyId(r.id);
    try {
      await updateDoc(doc(db, "requests", r.id), { status });
      setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
      refreshCounts();
    } catch (e) {
      console.error(e);
      setMessage("Could not update the request.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveNote(r: Req) {
    setBusyId(r.id);
    try {
      const adminNote = (notes[r.id] ?? "").trim().slice(0, 1000);
      await updateDoc(doc(db, "requests", r.id), { adminNote });
      setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, adminNote } : x)));
      setMessage("Note saved.");
    } catch (e) {
      console.error(e);
      setMessage("Could not save the note.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(r: Req) {
    if (!window.confirm(`Delete request "${r.title}"?`)) return;
    setBusyId(r.id);
    try {
      await deleteDoc(doc(db, "requests", r.id));
      if (r.images.length > 0) await deleteCloudinaryImages(r.images);
      setItems((prev) => prev.filter((x) => x.id !== r.id));
      refreshCounts();
    } catch (e) {
      console.error(e);
      setMessage("Could not delete the request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {message && <p className="mb-3 text-sm text-neutral-700">{message}</p>}

      <div className="flex flex-col gap-3">
        {items.map((r) => {
          const open = openId === r.id;
          const busy = busyId === r.id;
          return (
            <Card key={r.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : r.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="text-sm text-neutral-500">
                    {r.name} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <Badge tone={tone[r.status]}>{requestStatusLabels[r.status]}</Badge>
              </button>

              {open && (
                <div className="mt-4 border-t border-neutral-100 pt-4 text-sm">
                  <p>
                    <a href={`tel:${r.phone}`} className="underline">
                      {r.phone}
                    </a>
                  </p>
                  {r.details && (
                    <p className="mt-2 whitespace-pre-line text-neutral-700">
                      {r.details}
                    </p>
                  )}
                  <p className="mt-2 text-neutral-500">
                    {[
                      r.size && `Size: ${r.size}`,
                      r.deadline && `Needed by: ${r.deadline}`,
                      r.budget && `Budget: ${r.budget}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No extra details."}
                  </p>

                  {r.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.images.map((src) => (
                        <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt="Reference"
                            className="h-20 w-20 rounded-lg border object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <label className="mt-4 flex flex-col gap-1 text-xs text-neutral-500">
                    Status
                    <select
                      className={inputCls}
                      value={r.status}
                      disabled={busy}
                      onChange={(e) => setStatus(r, e.target.value as RequestStatus)}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {requestStatusLabels[s]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-3 flex flex-col gap-1 text-xs text-neutral-500">
                    Your note (price quote, plan...)
                    <textarea
                      className={inputCls}
                      rows={3}
                      value={notes[r.id] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                    />
                  </label>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => saveNote(r)}
                      className={btn.primary}
                    >
                      Save note
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(r)}
                      className={btn.danger}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {!loading && items.length === 0 && (
          <EmptyState>No custom requests yet.</EmptyState>
        )}
        {loading && <p className="text-sm text-neutral-500">Loading...</p>}
      </div>
    </>
  );
}