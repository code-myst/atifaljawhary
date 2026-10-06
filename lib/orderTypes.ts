export const orderStatusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const;

export const paymentStatusLabels = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
} as const;

export type OrderStatus = keyof typeof orderStatusLabels;
export type PaymentStatus = keyof typeof paymentStatusLabels;

export function makeOrderNo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += chars[b % chars.length];
  return `ORD-${s}`;
}