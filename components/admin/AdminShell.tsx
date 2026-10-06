"use client";

import {
  CSSProperties,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  Timestamp,
  collection,
  getCountFromServer,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import Icon, { IconName } from "@/components/Icon";
import { auth, db } from "@/lib/firebase";
import { notifyAdmin } from "@/lib/adminNotify";
import siteConfig from "@/site.config";

type Pending = { orders: number; requests: number; reviews: number };

type AdminState = {
  user: User | null;
  pending: Pending;
  dataKey: number;
  bumpData: () => void;
  refreshCounts: () => void;
};

const AdminContext = createContext<AdminState>({
  user: null,
  pending: { orders: 0, requests: 0, reviews: 0 },
  dataKey: 0,
  bumpData: () => {},
  refreshCounts: () => {},
});

export const useAdmin = () => useContext(AdminContext);

type Tab = {
  href: string;
  label: string;
  icon: IconName;
  badge?: (p: Pending) => number;
};

const tabs: Tab[] = [
  { href: "/admin", label: "Dashboard", icon: "gauge" },
  { href: "/admin/catalog", label: "Catalog", icon: "catalog" },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: "receipt",
    badge: (p) => p.orders + p.requests,
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    icon: "star",
    badge: (p) => p.reviews,
  },
  { href: "/admin/settings", label: "Settings", icon: "gear" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname.startsWith("/admin/login");

  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState<Pending>({
    orders: 0,
    requests: 0,
    reviews: 0,
  });
  const [dataKey, setDataKey] = useState(0);
  const [countKey, setCountKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const bumpData = useCallback(() => setDataKey((k) => k + 1), []);
  const refreshCounts = useCallback(() => setCountKey((k) => k + 1), []);

  // লগইন পাহারা
  useEffect(() => {
    if (isLogin) {
      setChecking(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      const isAdmin =
        !!u?.email &&
        u.email.toLowerCase() === siteConfig.adminEmail.toLowerCase();
      if (isAdmin) {
        setUser(u);
      } else {
        setUser(null);
        router.replace("/admin/login");
      }
      setChecking(false);
    });
    return () => unsub();
  }, [isLogin, router]);

  // ব্যাজের সংখ্যা (হালকা কাউন্ট কোয়েরি)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [o, r, v] = await Promise.all([
          getCountFromServer(
            query(collection(db, "orders"), where("status", "==", "pending"))
          ),
          getCountFromServer(
            query(collection(db, "requests"), where("status", "==", "new"))
          ),
          getCountFromServer(
            query(collection(db, "reviews"), where("status", "==", "pending"))
          ),
        ]);
        if (!cancelled) {
          setPending({
            orders: o.data().count,
            requests: r.data().count,
            reviews: v.data().count,
          });
        }
      } catch (error) {
        console.error("Count error:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, dataKey, countKey]);

  // অ্যাপ খোলা থাকা অবস্থায় আসা নতুন অর্ডার/অনুরোধ
  useEffect(() => {
    if (!user) return;
    const since = Timestamp.now();
    const unsubs = (["orders", "requests"] as const).map((name) => {
      const q = query(
        collection(db, name),
        where("createdAt", ">", since),
        orderBy("createdAt", "asc")
      );
      return onSnapshot(
        q,
        (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type !== "added") return;
            const d = change.doc.data();
            const text =
              name === "orders"
                ? `New order ${d.orderNo ?? ""}`
                : `New custom request: ${d.title ?? ""}`;
            setToast(text);
            notifyAdmin("New activity", text);
            bumpData();
          });
        },
        (error) => console.error("Listener error:", error)
      );
    });
    return () => unsubs.forEach((u) => u());
  }, [user, bumpData]);

  // PWA: শুধু /admin-এর জন্য service worker
  useEffect(() => {
    if (!user || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/admin/sw.js", { scope: "/admin/" })
      .catch((error) => console.error("SW error:", error));
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  const ctx = useMemo<AdminState>(
    () => ({ user, pending, dataKey, bumpData, refreshCounts }),
    [user, pending, dataKey, bumpData, refreshCounts]
  );

  const wrapperStyle = {
    "--brand": "#111827",
    colorScheme: "light",
  } as CSSProperties;
  const wrapperCls = "min-h-screen bg-neutral-100 text-neutral-900";

  if (isLogin) {
    return (
      <div className={wrapperCls} style={wrapperStyle}>
        {children}
      </div>
    );
  }

  if (checking || !user) {
    return (
      <div className={wrapperCls} style={wrapperStyle}>
        <p className="p-6 text-neutral-500">Loading...</p>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <AdminContext.Provider value={ctx}>
      <div className={wrapperCls} style={wrapperStyle}>
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <p className="font-semibold">
              {siteConfig.name}{" "}
              <span className="font-normal text-neutral-400">Admin</span>
            </p>
            <div className="flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View site"
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              >
                <Icon name="external" />
              </a>
              <button
                type="button"
                aria-label="Log out"
                onClick={async () => {
                  await signOut(auth);
                  router.replace("/admin/login");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              >
                <Icon name="logout" />
              </button>
            </div>
          </div>
        </header>

        {toast && (
          <div className="fixed left-3 right-3 top-16 z-[70] mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg">
            <span>{toast}</span>
            <span className="flex items-center gap-3">
              <Link
                href="/admin/orders"
                onClick={() => setToast(null)}
                className="underline"
              >
                View
              </Link>
              <button type="button" onClick={() => setToast(null)} aria-label="Dismiss">
                ✕
              </button>
            </span>
          </div>
        )}

        <main className="mx-auto max-w-5xl px-4 pb-32 pt-6">{children}</main>

        <nav
          className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl justify-around rounded-2xl border border-neutral-200 bg-white/95 p-1.5 shadow-lg backdrop-blur"
          style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom))" }}
        >
          {tabs.map((t) => {
            const active = isActive(t.href);
            const count = t.badge ? t.badge(pending) : 0;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <span className="relative">
                  <Icon name={t.icon} className="text-lg" />
                  {count > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </AdminContext.Provider>
  );
}