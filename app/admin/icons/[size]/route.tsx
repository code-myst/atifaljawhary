import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/getSettings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const px = size === "512" ? 512 : size === "180" ? 180 : 192;

  const settings = await getSettings();
  const first = settings.name.trim().charAt(0);
  const letter = /[A-Za-z0-9]/.test(first) ? first.toUpperCase() : "A";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f1d98a, #d4af37 55%, #9a7b1c)",
          color: "#17130a",
          fontSize: px * 0.5,
          fontWeight: 700,
        }}
      >
        {letter}
      </div>
    ),
    {
      width: px,
      height: px,
      headers: { "Cache-Control": "public, max-age=86400" },
    }
  );
}