"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import Icon from "@/components/Icon";
import { useAuth } from "@/components/Providers";
import { auth, db } from "@/lib/firebase";
import { authErrorMessage } from "@/lib/authErrors";
import { formatDate, formatPrice } from "@/lib/format";
import {
  OrderStatus,
  PaymentStatus,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/lib/orderTypes";
import siteConfig from "@/site.config";

type OrderRow = {
  id: string;
  orderNo: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: unknown;
  time: number;
  items: { title: string; qty: number }[];
};

export default function AccountView({ currency }: { currency: string }) {
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "orders"), where("uid", "==", user.uid), limit(50))
        );
        const rows = snap.docs.map((d): OrderRow => {
          const data = d.data();
          const ts = data.createdAt as { toMillis?: () => number } | undefined;
          const rawItems = Array.isArray(data.items) ? data.items : [];
          return {
            id: d.id,
            orderNo: String(data.orderNo ?? ""),
            total: Number(data.total ?? 0),
            status: (data.status in orderStatusLabels
              ? data.status
              : "pending") as OrderStatus,
            paymentStatus: (data.paymentStatus in paymentStatusLabels
              ? data.paymentStatus
              : "pending") as PaymentStatus,
            createdAt: data.createdAt,
            time: typeof ts?.toMillis === "function" ? ts.toMillis() : 0,
            items: rawItems.map((i: Record<string, unknown>) => ({
              title: String(i.title ?? ""),
              qty: Number(i.qty ?? 1),
            })),
          };
        });
        rows.sort((a, b) => b.time - a.time);
        if (!cancelled) setOrders(rows);
      } catch (err) {
        console.error("Orders error:", err);
        if (!cancelled) setOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleGoogle() {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        setError(authErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email first, then press “Forgot password”.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  if (loading) {
    return <p style={{ color: "var(--muted)" }}>Loading...</p>;
  }

  if (!user) {
    return (
      <div className="card mx-auto max-w-md p-6">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="btn-outline w-full justify-center disabled:opacity-60"
        >
          <Icon name="google" /> Continue with Google
        </button>

        <div
          className="my-5 flex items-center gap-3 text-xs"
          style={{ color: "var(--muted)" }}
        >
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
          or use email
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`pill ${mode === "login" ? "pill-active" : ""}`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`pill ${mode === "signup" ? "pill-active" : ""}`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              className="field"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
          />

          {error && (
            <p className="text-sm" style={{ color: "#e57373" }}>
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm" style={{ color: "var(--brand-light)" }}>
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-gold justify-center disabled:opacity-60"
          >
            {busy
              ? "Please wait..."
              : mode === "signup"
                ? "Create account"
                : "Log in"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleReset}
              className="text-sm underline hover:text-[var(--brand-light)]"
              style={{ color: "var(--muted)" }}
            >
              Forgot password?
            </button>
          )}
        </form>
      </div>
    );
  }

  const isAdmin = user.email === siteConfig.adminEmail;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-display text-xl">
            {user.displayName || "Welcome"}
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {user.email}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href="/admin" className="btn-outline">
              Admin panel
            </Link>
          )}
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="btn-outline"
          >
            Log out
          </button>
        </div>
      </div>

      <h2 className="font-display mt-10 text-2xl">My orders</h2>

      {orders === null ? (
        <p className="mt-4" style={{ color: "var(--muted)" }}>
          Loading orders...
        </p>
      ) : orders.length === 0 ? (
        <p className="mt-4" style={{ color: "var(--muted)" }}>
          No orders yet.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold tracking-widest">{o.orderNo}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {formatDate(o.createdAt)}
                </p>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                {o.items.map((i) => `${i.title} × ${i.qty}`).join(", ")}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="gold-text font-semibold">
                  {formatPrice(o.total, currency)}
                </p>
                <div className="flex gap-2 text-xs">
                  <span className="pill cursor-default">
                    {orderStatusLabels[o.status]}
                  </span>
                  <span className="pill cursor-default">
                    {paymentStatusLabels[o.paymentStatus]}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}