"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, useCart } from "@/components/Providers";
import { formatPrice } from "@/lib/format";
import { makeOrderNo } from "@/lib/orderTypes";
import type { PaymentMethod } from "@/lib/settingsTypes";

export default function CheckoutForm({
  currency,
  methods,
}: {
  currency: string;
  methods: PaymentMethod[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName((n) => n || user.displayName || "");
      setEmail((e) => e || user.email || "");
    }
  }, [user]);

  const method = methods.find((m) => m.id === methodId);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !address.trim() || address.trim().length < 5) {
      setError("Please enter your name and full address.");
      return;
    }
    if (phone.trim().length < 6) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (methods.length > 0 && !method) {
      setError("Please choose a payment method.");
      return;
    }
    if (method) {
      for (const f of method.fields) {
        if (f.required && !(values[f.id] ?? "").trim()) {
          setError(`Please fill in "${f.label}".`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const orderNo = makeOrderNo();
      const orderItems = items.map((i) => ({
        id: i.id,
        title: i.title,
        price: i.price,
        qty: i.qty,
        image: i.image,
      }));
      const payment = {
        methodId: method?.id ?? "",
        methodName: method?.name ?? "Not specified",
        fields: method
          ? method.fields.map((f) => ({
              label: f.label,
              value: (values[f.id] ?? "").trim().slice(0, 200),
            }))
          : [],
      };

      await addDoc(collection(db, "orders"), {
        orderNo,
        uid: user?.uid ?? null,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          note: note.trim(),
        },
        items: orderItems,
        subtotal,
        total: subtotal,
        payment,
        status: "pending",
        paymentStatus: "pending",
        createdAt: serverTimestamp(),
      });

      try {
        sessionStorage.setItem(
          "last-order",
          JSON.stringify({
            orderNo,
            total: subtotal,
            methodName: payment.methodName,
            items: items.map((i) => ({ title: i.title, qty: i.qty })),
          })
        );
      } catch {
        /* ignore */
      }

      setDone(true);
      clear();
      router.push("/order-success");
    } catch (err) {
      console.error("Order error:", err);
      setError(
        "Could not place the order. Please try again, or order on WhatsApp."
      );
      setSubmitting(false);
    }
  }

  if (items.length === 0 && !done) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: "var(--muted)" }}>Your cart is empty.</p>
        <Link href="/shop" className="btn-gold mt-6">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 lg:grid-cols-[1fr_340px]"
    >
      <div className="flex flex-col gap-8">
        <section className="card p-5">
          <h2 className="font-display text-xl">Your details</h2>
          {!user && (
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Ordering as a guest.{" "}
              <Link
                href="/account"
                className="underline hover:text-[var(--brand-light)]"
              >
                Log in
              </Link>{" "}
              to keep your order history.
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              placeholder="Full name"
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
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <textarea
              className="field sm:col-span-2"
              placeholder="Full delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              autoComplete="street-address"
              required
            />
            <textarea
              className="field sm:col-span-2"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">Payment</h2>

          {methods.length === 0 ? (
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              No online payment method is set up yet. Place your order and we
              will contact you with payment details.
            </p>
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {methods.map((m) => (
                  <label
                    key={m.id}
                    className="cursor-pointer rounded-xl border p-4 transition"
                    style={{
                      borderColor:
                        methodId === m.id ? "var(--brand)" : "var(--line)",
                      background:
                        methodId === m.id
                          ? "color-mix(in srgb, var(--brand), transparent 92%)"
                          : "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={m.id}
                      checked={methodId === m.id}
                      onChange={() => setMethodId(m.id)}
                      className="mr-2"
                    />
                    {m.name}
                  </label>
                ))}
              </div>

              {method && (
                <div
                  className="mt-5 rounded-xl border p-4"
                  style={{ borderColor: "var(--line)" }}
                >
                  {method.number && (
                    <p>
                      Send{" "}
                      <span className="gold-text font-semibold">
                        {formatPrice(subtotal, currency)}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold">{method.number}</span>
                    </p>
                  )}
                  {method.instructions && (
                    <p
                      className="mt-2 whitespace-pre-line text-sm"
                      style={{ color: "var(--muted)" }}
                    >
                      {method.instructions}
                    </p>
                  )}

                  {method.fields.length > 0 && (
                    <div className="mt-4 grid gap-3">
                      {method.fields.map((f) => (
                        <label key={f.id} className="flex flex-col gap-1 text-sm">
                          <span style={{ color: "var(--muted)" }}>
                            {f.label}
                            {f.required && " *"}
                          </span>
                          <input
                            className="field"
                            value={values[f.id] ?? ""}
                            onChange={(e) =>
                              setValues((prev) => ({
                                ...prev,
                                [f.id]: e.target.value,
                              }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <aside className="card h-fit p-5">
        <h2 className="font-display text-xl">Order summary</h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>
                {i.title} × {i.qty}
              </span>
              <span>{formatPrice(i.price * i.qty, currency)}</span>
            </li>
          ))}
        </ul>
        <div
          className="mt-4 flex justify-between border-t pt-4"
          style={{ borderColor: "var(--line)" }}
        >
          <span>Total</span>
          <span className="gold-text text-lg font-semibold">
            {formatPrice(subtotal, currency)}
          </span>
        </div>

        {error && (
          <p className="mt-4 text-sm" style={{ color: "#e57373" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-gold mt-6 w-full justify-center disabled:opacity-60"
        >
          {submitting ? "Placing order..." : "Place order"}
        </button>
        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          Your order stays pending until we verify the payment.
        </p>
      </aside>
    </form>
  );
}