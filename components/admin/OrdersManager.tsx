"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DocumentData,
  QueryDocumentSnapshot,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import siteConfig from "@/site.config";
import { formatDate, formatPrice } from "@/lib/format";
import {
  OrderStatus,
  PaymentStatus,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/lib/orderTypes";
import { useAdmin } from "@/components/admin/AdminShell";
import { Badge, Card, EmptyState, Tone, btn, inputCls } from "@/components/admin/ui";

const PAGE = 30;

type OrderItem = { id: string; title: string; price: number; qty: number };

type AdminOrder = {
  id: string;
  orderNo: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    note: string;
  };
  items: OrderItem[];
  total: number;
  methodName: string;
  fields: { label: string; value: string }[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  stockApplied: boolean;
  createdAt: unknown;
};

const statuses = Object.keys(orderStatusLabels) as OrderStatus[];
const payStatuses = Object.keys(paymentStatusLabels) as PaymentStatus[];

const statusTone: Record<OrderStatus, Tone> = {
  pending: "amber",
  confirmed: "blue",
  shipped: "blue",
  delivered: "green",
  cancelled: "red",
};
const payTone: Record<PaymentStatus, Tone> = {
  pending: "amber",
  paid: "green",
  failed: "red",
};

function mapOrder(id: string, d: DocumentData): AdminOrder {
  const c = (d.customer ?? {}) as Record<string, unknown>;
  const p = (d.payment ?? {}) as Record<string, unknown>;
  const items = Array.isArray(d.items) ? d.items : [];
  const fields = Array.isArray(p.fields) ? p.fields : [];

  return {
    id,
    orderNo: String(d.orderNo ?? ""),
    customer: {
      name: String(c.name ?? ""),
      phone: String(c.phone ?? ""),
      email: String(c.email ?? ""),
      address: String(c.address ?? ""),
      note: String(c.note ?? ""),
    },
    items: items.map((i: Record<string, unknown>) => ({
      id: String(i.id ?? ""),
      title: String(i.title ?? ""),
      price: Number(i.price ?? 0),
      qty: Number(i.qty ?? 1),
    })),
    total: Number(d.total ?? 0),
    methodName: String(p.methodName ?? ""),
    fields: fields.map((f: Record<string, unknown>) => ({
      label: String(f.label ?? ""),
      value: String(f.value ?? ""),
    })),
    status: (String(d.status) in orderStatusLabels
      ? d.status
      : "pending") as OrderStatus,
    paymentStatus: (String(d.paymentStatus) in paymentStatusLabels
      ? d.paymentStatus
      : "pending") as PaymentStatus,
    stockApplied: d.stockApplied === true,
    createdAt: d.createdAt,
  };
}

async function adjustStock(items: OrderItem[], sign: 1 | -1) {
  for (const it of items) {
    if (!it.id) continue;
    try {
      await updateDoc(doc(db, "products", it.id), {
        stock: increment(sign * it.qty),
      });
    } catch (error) {
      // প্রোডাক্টটা মোছা থাকলে এখানে আসবে; অর্ডার আটকাবে না
      console.warn("Stock update skipped:", it.id, error);
    }
  }
}

export default function OrdersManager() {
  const { dataKey, refreshCounts } = useAdmin();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const lastRef = useRef<QueryDocumentSnapshot | null>(null);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const snap = await getDocs(
        query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(PAGE))
      );
      lastRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setOrders(snap.docs.map((d) => mapOrder(d.id, d.data())));
      setMore(snap.size === PAGE);
    } catch (e) {
      console.error("Orders error:", e);
      setMessage("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFirst();
  }, [loadFirst, dataKey]);

  async function loadMore() {
    if (!lastRef.current) return;
    try {
      const snap = await getDocs(
        query(
          collection(db, "orders"),
          orderBy("createdAt", "desc"),
          startAfter(lastRef.current),
          limit(PAGE)
        )
      );
      lastRef.current = snap.docs[snap.docs.length - 1] ?? lastRef.current;
      setOrders((prev) => [...prev, ...snap.docs.map((d) => mapOrder(d.id, d.data()))]);
      setMore(snap.size === PAGE);
    } catch (e) {
      console.error(e);
      setMessage("Could not load more orders.");
    }
  }

  async function applyChanges(
    o: AdminOrder,
    next: { status?: OrderStatus; paymentStatus?: PaymentStatus }
  ) {
    setBusyId(o.id);
    setMessage("");
    try {
      const status = next.status ?? o.status;
      let paymentStatus = next.paymentStatus ?? o.paymentStatus;
      if (status === "cancelled" && paymentStatus === "pending") {
        paymentStatus = "failed";
      }

      const wantsStock =
        status === "confirmed" || status === "shipped" || status === "delivered";
      let stockApplied = o.stockApplied;
      if (wantsStock && !stockApplied) {
        await adjustStock(o.items, -1);
        stockApplied = true;
      } else if (!wantsStock && stockApplied) {
        await adjustStock(o.items, 1);
        stockApplied = false;
      }

      await updateDoc(doc(db, "orders", o.id), {
        status,
        paymentStatus,
        stockApplied,
      });
      setOrders((prev) =>
        prev.map((x) =>
          x.id === o.id ? { ...x, status, paymentStatus, stockApplied } : x
        )
      );
      refreshCounts();
    } catch (e) {
      console.error(e);
      setMessage("Could not update the order. Check your Firestore rules.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(o: AdminOrder) {
    if (!window.confirm(`Delete order ${o.orderNo}? This cannot be undone.`)) return;
    setBusyId(o.id);
    try {
      if (o.stockApplied) await adjustStock(o.items, 1);
      await deleteDoc(doc(db, "orders", o.id));
      setOrders((prev) => prev.filter((x) => x.id !== o.id));
      refreshCounts();
    } catch (e) {
      console.error(e);
      setMessage("Could not delete the order.");
    } finally {
      setBusyId(null);
    }
  }

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return `${o.orderNo} ${o.customer.name} ${o.customer.phone}`
        .toLowerCase()
        .includes(q);
    });
  }, [orders, filter, search]);

  return (
    <>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className={inputCls}
          placeholder="Search order no, name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" onClick={loadFirst} className={btn.secondary}>
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...statuses] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              filter === s
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white hover:bg-neutral-50"
            }`}
          >
            {s === "all" ? "All" : orderStatusLabels[s]}
          </button>
        ))}
      </div>

      {message && <p className="mb-3 text-sm text-red-600">{message}</p>}

      <div className="flex flex-col gap-3">
        {shown.map((o) => {
          const open = openId === o.id;
          const busy = busyId === o.id;
          return (
            <Card key={o.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : o.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div>
                  <p className="font-semibold tracking-wide">{o.orderNo}</p>
                  <p className="text-sm text-neutral-500">
                    {o.customer.name} · {formatDate(o.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatPrice(o.total, siteConfig.currency)}
                  </p>
                  <div className="mt-1 flex justify-end gap-1">
                    <Badge tone={statusTone[o.status]}>
                      {orderStatusLabels[o.status]}
                    </Badge>
                    <Badge tone={payTone[o.paymentStatus]}>
                      {paymentStatusLabels[o.paymentStatus]}
                    </Badge>
                  </div>
                </div>
              </button>

              {open && (
                <div className="mt-4 border-t border-neutral-100 pt-4 text-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 font-semibold">Customer</p>
                      <p>{o.customer.name}</p>
                      <p>
                        <a href={`tel:${o.customer.phone}`} className="underline">
                          {o.customer.phone}
                        </a>
                      </p>
                      {o.customer.email && <p>{o.customer.email}</p>}
                      <p className="mt-1 whitespace-pre-line text-neutral-600">
                        {o.customer.address}
                      </p>
                      {o.customer.note && (
                        <p className="mt-1 italic text-neutral-500">
                          Note: {o.customer.note}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="mb-1 font-semibold">Items</p>
                      <ul className="flex flex-col gap-1">
                        {o.items.map((i, n) => (
                          <li key={`${i.id}-${n}`} className="flex justify-between gap-3">
                            <span>
                              {i.title} × {i.qty}
                            </span>
                            <span>{formatPrice(i.price * i.qty, siteConfig.currency)}</span>
                          </li>
                        ))}
                      </ul>

                      <p className="mb-1 mt-3 font-semibold">
                        Payment{o.methodName ? `: ${o.methodName}` : ""}
                      </p>
                      {o.fields.length === 0 ? (
                        <p className="text-neutral-500">No payment details.</p>
                      ) : (
                        <ul className="flex flex-col gap-0.5">
                          {o.fields.map((f, n) => (
                            <li key={n}>
                              <span className="text-neutral-500">{f.label}: </span>
                              {f.value || "—"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs text-neutral-500">
                      Order status
                      <select
                        className={inputCls}
                        value={o.status}
                        disabled={busy}
                        onChange={(e) =>
                          applyChanges(o, { status: e.target.value as OrderStatus })
                        }
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {orderStatusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-neutral-500">
                      Payment status
                      <select
                        className={inputCls}
                        value={o.paymentStatus}
                        disabled={busy}
                        onChange={(e) =>
                          applyChanges(o, {
                            paymentStatus: e.target.value as PaymentStatus,
                          })
                        }
                      >
                        {payStatuses.map((s) => (
                          <option key={s} value={s}>
                            {paymentStatusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {o.paymentStatus !== "paid" && o.status !== "cancelled" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          applyChanges(o, {
                            paymentStatus: "paid",
                            status: o.status === "pending" ? "confirmed" : o.status,
                          })
                        }
                        className={btn.primary}
                      >
                        Mark paid &amp; confirm
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(o)}
                      className={btn.danger}
                    >
                      Delete order
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-neutral-400">
                    অর্ডার নিশ্চিত করলে স্টক নিজে কমে; বাতিল বা pending-এ ফেরালে ফিরে আসে।
                  </p>
                </div>
              )}
            </Card>
          );
        })}

        {!loading && shown.length === 0 && (
          <EmptyState>No orders found.</EmptyState>
        )}
        {loading && <p className="text-sm text-neutral-500">Loading...</p>}

        {more && (
          <button type="button" onClick={loadMore} className={`${btn.secondary} w-fit`}>
            Load more
          </button>
        )}
      </div>
    </>
  );
}