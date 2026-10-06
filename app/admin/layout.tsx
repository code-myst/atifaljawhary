import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  manifest: "/admin/manifest.webmanifest",
  robots: { index: false, follow: false },
  icons: { apple: "/admin/icons/180" },
  appleWebApp: { capable: true, title: "Admin", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#111827" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}