export function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toLocaleString("en-US")}`;
}

export function formatDate(value: unknown): string {
  const v = value as { toDate?: () => Date } | undefined;
  if (v && typeof v.toDate === "function") {
    return v.toDate().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return "";
}