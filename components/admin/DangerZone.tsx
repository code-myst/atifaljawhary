"use client";

import { useState } from "react";
import {
  collection,
  getDocs,
  limit,
  query,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteCloudinaryImages } from "@/lib/adminApi";
import { useAdmin } from "@/components/admin/AdminShell";
import { Card, btn, inputCls } from "@/components/admin/ui";

export default function DangerZone() {
  const { bumpData } = useAdmin();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  async function wipe(name: "orders" | "requests"): Promise<string[]> {
    const images: string[] = [];
    let deleted = 0;
    for (;;) {
      const snap = await getDocs(query(collection(db, name), limit(400)));
      if (snap.empty) break;

      if (name === "requests") {
        snap.docs.forEach((d) => {
          const imgs = d.data().images;
          if (Array.isArray(imgs)) {
            imgs.forEach((u) => {
              if (typeof u === "string") images.push(u);
            });
          }
        });
      }

      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      deleted += snap.size;
      setProgress(`Deleting ${name}... ${deleted}`);
    }
    return images;
  }

  async function handleReset() {
    if (text !== "RESET") return;
    if (
      !window.confirm(
        "সব অর্ডার, কাস্টম অনুরোধ ও হিসাব মুছে যাবে। এটা আর ফেরানো যাবে না। চালিয়ে যাবেন?"
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await wipe("orders");
      const images = await wipe("requests");
      if (images.length > 0) {
        setProgress("Removing request images...");
        await deleteCloudinaryImages(images);
      }
      setProgress("Done. Dashboard has been reset.");
      setText("");
      bumpData();
    } catch (e) {
      console.error("Reset error:", e);
      setProgress("Reset failed. Some data may have been deleted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6 border-red-200">
      <h2 className="text-lg font-semibold text-red-700">Reset dashboard</h2>
      <p className="mt-1 text-sm text-neutral-600">
        এটা <strong>সব অর্ডার, কাস্টম অনুরোধ (ও তাদের ছবি) এবং হিসাব</strong> মুছে
        একদম নতুন করে শুরু করবে। প্রোডাক্ট, প্রজেক্ট, রিভিউ, টেস্টিমনিয়াল, সেটিংস ও
        গ্রাহকের অ্যাকাউন্ট মুছবে না। স্টকও আগের মতো থাকবে।
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className={inputCls}
          placeholder='Type "RESET" to confirm'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || text !== "RESET"}
          onClick={handleReset}
          className={btn.danger}
        >
          {busy ? "Working..." : "Reset"}
        </button>
      </div>
      {progress && <p className="mt-2 text-sm text-neutral-600">{progress}</p>}
    </Card>
  );
}