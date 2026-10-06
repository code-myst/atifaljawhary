import { getSettings } from "@/lib/getSettings";

export async function GET() {
  const settings = await getSettings();

  const manifest = {
    name: `${settings.name} Admin`,
    short_name: "Admin",
    description: "Manage products, orders and content",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f5f5",
    theme_color: "#111827",
    icons: [
      { src: "/admin/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/admin/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/admin/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}