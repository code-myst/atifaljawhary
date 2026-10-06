import { createHash } from "crypto";
import siteConfig from "@/site.config";

export const runtime = "nodejs";

// অ্যাডমিনের লগইন টোকেন Firebase দিয়ে যাচাই করে
async function verifyAdmin(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${siteConfig.firebase.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!res.ok) return false;
    const json = (await res.json()) as { users?: { email?: string }[] };
    const email = json.users?.[0]?.email ?? "";
    return email.toLowerCase() === siteConfig.adminEmail.toLowerCase();
  } catch {
    return false;
  }
}

// https://res.cloudinary.com/<cloud>/image/upload/v123/<public_id>.jpg -> <public_id>
function publicIdFromUrl(url: string, cloudName: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "res.cloudinary.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] !== cloudName || parts[1] !== "image" || parts[2] !== "upload") {
      return null;
    }
    const rest = parts.slice(3);
    const vIdx = rest.findIndex((p) => /^v\d+$/.test(p));
    const idParts = vIdx >= 0 ? rest.slice(vIdx + 1) : rest;
    if (idParts.length === 0) return null;
    const id = decodeURIComponent(idParts.join("/")).replace(/\.[A-Za-z0-9]+$/, "");
    return id || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdmin(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !apiSecret) {
    return Response.json(
      { error: "Cloudinary keys are not configured" },
      { status: 500 }
    );
  }

  let body: { urls?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const urls = Array.isArray(body.urls)
    ? body.urls.filter((u): u is string => typeof u === "string").slice(0, 20)
    : [];

  const cloud = siteConfig.cloudinary.cloudName;
  const results: { url: string; result: string }[] = [];

  for (const url of urls) {
    const publicId = publicIdFromUrl(url, cloud);
    if (!publicId) {
      results.push({ url, result: "skipped" });
      continue;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const form = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
    });

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/image/destroy`,
        { method: "POST", body: form }
      );
      const json = (await res.json().catch(() => ({}))) as { result?: string };
      results.push({ url, result: json.result ?? "error" });
    } catch {
      results.push({ url, result: "error" });
    }
  }

  return Response.json({ results });
}