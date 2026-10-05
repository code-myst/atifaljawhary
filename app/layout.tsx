import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Hind_Siliguri, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SiteChrome from "@/components/SiteChrome";
import { getSettings } from "@/lib/getSettings";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const bengali = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "600"],
  variable: "--font-bengali",
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return { title: settings.name, description: settings.tagline };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getSettings();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${bengali.variable}`}
    >
      <body style={{ "--brand": settings.brandColor } as CSSProperties}>
                <SiteChrome
          header={<Navbar />}
          footer={<Footer />}
          floating={<WhatsAppFloat />}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}