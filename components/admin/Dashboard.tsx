"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  sum,
  where,
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
import { Badge, Card, PageHeader, Tone } from "@/components/admin/ui";

type Recent = {
  id: string;
  orderNo: string;
  name: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: unknown;
};

const statuses = Object.keys(orderStatusLabels) as OrderStatus[];

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

export default function Dashboard() {
  const { dataKey } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revenue, setRevenue] = useState(0);
  const [awaiting, setAwaiting] = useState(0);
  const [total, setTotal] = useState(0);
  const [byStatus, setByStatus] = useState<Record<OrderStatus, number>>({
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [requestsNew, setRequestsNew] = useState(0);
  const [reviewsPending, setReviewsPending] = useState(0);
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const orders = collection(db, "orders");
        const [paidAgg, awaitAgg, totalCount, statusCounts, reqCount, revCount, recentSnap] =
          await Promise.all([
            getAggregateFromServer(
              query(orders, where("paymentStatus", "==", "paid")),
              { amount: sum("total") }
            ),
            getAggregateFromServer(
              query(orders, where("paymentStatus", "==", "pending")),
              { amount: sum("total") }
            ),
            getCountFromServer(orders),
            Promise.all(
              statuses.map((s) =>
                getCountFromServer(query(orders, where("status", "==", s)))
              )
            ),
            getCountFromServer(
              query(collection(db, "requests"), where("status", "==", "new"))
            ),
            getCountFromServer(
              query(collection(db, "reviews"), where("status", "==", "pending"))
            ),
            getDocs(query(orders, orderBy("createdAt", "desc"), limit(6))),
          ]);

        if (cancelled) return;

        const counts = {} as Record<OrderStatus, number>;
        statuses.forEach((s, i) => {
          counts[s] = statusCounts[i].data().count;
        });

        setRevenue(Number(paidAgg.data().amount ?? 0));
        setAwaiting(Number(awaitAgg.data().amount ?? 0));
        setTotal(totalCount.data().count);
        setByStatus(counts);
        setRequestsNew(reqCount.data().count);
        setReviewsPending(revCount.data().count);
        setRecent(
          recentSnap.docs.map((d) => {
            const data = d.data();
            const customer = (data.customer ?? {}) as Record<string, unknown>;
            return {
              id: d.id,
              orderNo: String(data.orderNo ?? ""),
              name: String(customer.name ?? ""),
              total: Number(data.total ?? 0),
              status: (String(data.status) in orderStatusLabels
                ? data.status
                : "pending") as OrderStatus,
              paymentStatus: (String(data.paymentStatus) in paymentStatusLabels
                ? data.paymentStatus
                : "pending") as PaymentStatus,
              createdAt: data.createdAt,
            };
          })
        );
      } catch (e) {
        console.error("Dashboard error:", e);
        if (!cancelled) setError("Could not load the dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataKey]);

  const currency = siteConfig.currency;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Money and orders at a glance" />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-neutral-500">Revenue (paid)</p>
          <p className="mt-1 text-2xl font-bold">
            {loading ? "…" : formatPrice(revenue, currency)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500">Awaiting payment</p>
          <p className="mt-1 text-2xl font-bold">
            {loading ? "…" : formatPrice(awaiting, currency)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500">Total orders</p>
          <p className="mt-1 text-2xl font-bold">{loading ? "…" : total}</p>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {statuses.map((s) => (
          <Card key={s} className="!p-3">
            <p className="text-xs text-neutral-500">{orderStatusLabels[s]}</p>
            <p className="mt-0.5 text-xl font-semibold">{byStatus[s]}</p>
          </Card>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/orders">
          <Card className="transition hover:shadow-md">
            <p className="text-sm text-neutral-500">New custom requests</p>
            <p className="mt-1 text-2xl font-bold">{requestsNew}</p>
          </Card>
        </Link>
        <Link href="/admin/reviews">
          <Card className="transition hover:shadow-md">
            <p className="text-sm text-neutral-500">Reviews to approve</p>
            <p className="mt-1 text-2xl font-bold">{reviewsPending}</p>
          </Card>
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent orders</h2>
        <Link href="/admin/orders" className="text-sm text-neutral-600 underline">
          View all
        </Link>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {recent.map((o) => (
          <Card key={o.id} className="!p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{o.orderNo}</p>
                <p className="text-sm text-neutral-500">
                  {o.name} · {formatDate(o.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(o.total, currency)}</p>
                <div className="mt-1 flex justify-end gap-1">
                  <Badge tone={statusTone[o.status]}>
                    {orderStatusLabels[o.status]}
                  </Badge>
                  <Badge tone={payTone[o.paymentStatus]}>
                    {paymentStatusLabels[o.paymentStatus]}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {!loading && recent.length === 0 && (
          <p className="text-sm text-neutral-500">No orders yet.</p>
        )}
      </div>
    </>
  );
}