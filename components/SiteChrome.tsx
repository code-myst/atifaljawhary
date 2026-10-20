"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function SiteChrome({
  header,
  footer,
  floating,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  floating: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  // /work পেজে Navbar, নিচের ট্যাব বার ও ভাসমান বাটন নেই; শুধু Footer
  if (pathname === "/work") {
    return (
      <>
        {children}
        {footer}
      </>
    );
  }

  return (
    <>
      {header}
      {children}
      {footer}
      {floating}
    </>
  );
}
