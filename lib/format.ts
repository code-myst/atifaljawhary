export function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toLocaleString("en-US")}`;
}