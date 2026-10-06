import siteConfig from "@/site.config";

const MAX_SIDE = 1600;

async function shrink(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

    if (scale === 1 && file.size < 700 * 1024) {
      bitmap.close();
      return file;
    }

    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await shrink(file);
  const body = new FormData();
  body.append("file", blob);
  body.append("upload_preset", siteConfig.cloudinary.uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${siteConfig.cloudinary.cloudName}/image/upload`,
    { method: "POST", body }
  );
  if (!res.ok) throw new Error("Upload failed");
  const json = await res.json();
  return String(json.secure_url);
}