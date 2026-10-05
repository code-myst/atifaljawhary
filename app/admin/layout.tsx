import type { CSSProperties, ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-white text-neutral-900"
      style={{ "--brand": "#1f2937", colorScheme: "light" } as CSSProperties}
    >
      {children}
    </div>
  );
}