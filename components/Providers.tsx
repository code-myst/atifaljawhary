"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

/* ---------- Auth ---------- */
type AuthState = { user: User | null; loading: boolean };
const AuthContext = createContext<AuthState>({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

/* ---------- Cart ---------- */
export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string;
  qty: number;
  stock: number;
};

type CartState = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartState>({
  items: [],
  count: 0,
  subtotal: 0,
  add: () => {},
  setQty: () => {},
  remove: () => {},
  clear: () => {},
});
export const useCart = () => useContext(CartContext);

const STORAGE_KEY = "cart-v1";

function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r): CartItem[] => {
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    const qty = Math.floor(Number(o.qty));
    const price = Number(o.price);
    if (!id || !Number.isFinite(price) || !Number.isFinite(qty) || qty < 1) {
      return [];
    }
    return [
      {
        id,
        title: String(o.title ?? ""),
        price,
        image: String(o.image ?? ""),
        qty,
        stock: Math.max(1, Math.floor(Number(o.stock) || 1)),
      },
    ];
  });
}

export default function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(sanitize(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const add = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      setItems((prev) => {
        const found = prev.find((p) => p.id === item.id);
        if (found) {
          return prev.map((p) =>
            p.id === item.id
              ? { ...p, ...item, qty: Math.min(item.stock, p.qty + qty) }
              : p
          );
        }
        return [...prev, { ...item, qty: Math.min(item.stock, qty) }];
      });
    },
    []
  );

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, qty: Math.max(1, Math.min(p.stock, Math.floor(qty))) }
          : p
      )
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const cart = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.qty, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear]
  );

  const authValue = useMemo(() => ({ user, loading }), [user, loading]);

  return (
    <AuthContext.Provider value={authValue}>
      <CartContext.Provider value={cart}>{children}</CartContext.Provider>
    </AuthContext.Provider>
  );
}