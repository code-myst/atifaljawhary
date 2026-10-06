import BottomTabBar, { TabItem } from "@/components/BottomTabBar";
import { getSettings } from "@/lib/getSettings";

export default async function MobileNav() {
  const settings = await getSettings();
  const f = settings.features;

  const items: TabItem[] = [{ href: "/", label: "Home", icon: "house" }];
  if (f.shop) items.push({ href: "/shop", label: "Shop", icon: "bag" });
  if (f.customOrders) {
    items.push({ href: "/custom-order", label: "Custom", icon: "brush" });
  }
  if (f.cart) items.push({ href: "/cart", label: "Cart", icon: "cart" });
  items.push({ href: "/account", label: "Account", icon: "user" });

  return <BottomTabBar items={items} />;
}