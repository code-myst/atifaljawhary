import { auth } from "@/lib/firebase";

// Cloudinary থেকে ছবি মোছে। ব্যর্থ হলে false দেয়, কিন্তু কোনো কাজ আটকায় না।
export async function deleteCloudinaryImages(urls: string[]): Promise<boolean> {
  const clean = Array.from(
    new Set(urls.filter((u) => u.includes("res.cloudinary.com")))
  );
  if (clean.length === 0) return true;

  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return false;

    let ok = true;
    for (let i = 0; i < clean.length; i += 20) {
      const res = await fetch("/api/admin/cloudinary-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ urls: clean.slice(i, i + 20) }),
      });
      if (!res.ok) ok = false;
    }
    return ok;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}