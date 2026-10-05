"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import siteConfig from "@/site.config";
import {
  Features,
  SiteType,
  Socials,
  cleanWhatsapp,
  emptySocials,
  featureLabels,
  isSiteType,
  normalizeFeatures,
  normalizeUrl,
  parseSkills,
  presets,
  siteTypeLabels,
  socialKeys,
  socialLabels,
} from "@/lib/settingsTypes";

export default function AdminSettings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const [name, setName] = useState(siteConfig.name);
  const [tagline, setTagline] = useState(siteConfig.tagline);
  const [brandColor, setBrandColor] = useState(siteConfig.brandColor);
  const [contactEmail, setContactEmail] = useState(siteConfig.contact.email);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [siteType, setSiteType] = useState<SiteType>("graphic");
  const [features, setFeatures] = useState<Features>(presets.graphic);
  const [aboutText, setAboutText] = useState("");
  const [aboutImage, setAboutImage] = useState("");
  const [skills, setSkills] = useState("");
  const [socials, setSocials] = useState<Socials>(emptySocials);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && u.email === siteConfig.adminEmail) {
        setUser(u);
      } else {
        if (u) await signOut(auth);
        router.replace("/admin/login");
      }
      setChecking(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (!snap.exists()) return;
        const d = snap.data();
        if (d.name) setName(String(d.name));
        if (d.tagline) setTagline(String(d.tagline));
        if (d.brandColor) setBrandColor(String(d.brandColor));
        if (d.contactEmail) setContactEmail(String(d.contactEmail));
        if (d.whatsappNumber) setWhatsappNumber(String(d.whatsappNumber));
        if (d.aboutText) setAboutText(String(d.aboutText));
        if (d.aboutImage) setAboutImage(String(d.aboutImage));
        if (d.skills) setSkills(String(d.skills));

        const rawSocials = (d.socials ?? {}) as Record<string, unknown>;
        const loaded: Socials = { ...emptySocials };
        for (const key of socialKeys) {
          const v = rawSocials[key];
          loaded[key] = typeof v === "string" ? v : "";
        }
        setSocials(loaded);

        const type: SiteType = isSiteType(d.siteType) ? d.siteType : "graphic";
        setSiteType(type);
        const base = presets[type];
        const f = (d.features ?? {}) as Partial<Features>;
        setFeatures(
          normalizeFeatures({
            portfolio:
              typeof f.portfolio === "boolean" ? f.portfolio : base.portfolio,
            shop: typeof f.shop === "boolean" ? f.shop : base.shop,
            cart: typeof f.cart === "boolean" ? f.cart : base.cart,
            customOrders:
              typeof f.customOrders === "boolean"
                ? f.customOrders
                : base.customOrders,
            testimonials:
              typeof f.testimonials === "boolean"
                ? f.testimonials
                : base.testimonials,
          })
        );
      } catch (error) {
        console.error("Load settings error:", error);
        setMessage("Could not load settings.");
      }
    })();
  }, [user]);

  function changeSiteType(t: SiteType) {
    setSiteType(t);
    setFeatures(presets[t]);
  }

  function toggleFeature(key: keyof Features, value: boolean) {
    setFeatures((prev) => normalizeFeatures({ ...prev, [key]: value }));
  }

  async function handleAboutImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", siteConfig.cloudinary.uploadPreset);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${siteConfig.cloudinary.cloudName}/image/upload`,
        { method: "POST", body }
      );
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      setAboutImage(json.secure_url);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Image upload failed. Check cloud name and preset.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const cleanSocials: Socials = { ...emptySocials };
      for (const key of socialKeys) {
        cleanSocials[key] = normalizeUrl(socials[key]);
      }
      const cleanSkills = parseSkills(skills).join(", ");

      await setDoc(
        doc(db, "settings", "main"),
        {
          name: name.trim(),
          tagline: tagline.trim(),
          brandColor,
          contactEmail: contactEmail.trim(),
          whatsappNumber: cleanWhatsapp(whatsappNumber),
          siteType,
          features: normalizeFeatures(features),
          aboutText: aboutText.trim(),
          aboutImage,
          skills: cleanSkills,
          socials: cleanSocials,
        },
        { merge: true }
      );

      setWhatsappNumber(cleanWhatsapp(whatsappNumber));
      setSocials(cleanSocials);
      setSkills(cleanSkills);
      setMessage("Saved. সাইটে পরিবর্তন আসতে সর্বোচ্চ ৫ মিনিট লাগতে পারে।");
    } catch (error) {
      console.error("Save settings error:", error);
      setMessage("Could not save. Check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  if (checking || !user) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <main className="mx-auto max-w-xl p-4">
      <div className="py-6">
        <Link href="/admin" className="text-sm text-gray-600 hover:underline">
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Site Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Site name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded border p-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tagline
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="rounded border p-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Brand color
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="h-10 w-20 rounded border"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contact email
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
            className="rounded border p-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          WhatsApp number (দেশের কোডসহ, + ছাড়া)
          <input
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="8801XXXXXXXXX"
            inputMode="numeric"
            className="rounded border p-2 text-base"
          />
        </label>

        <fieldset className="rounded border p-4">
          <legend className="px-1 text-sm font-semibold">সাইটের ধরন</legend>
          <select
            value={siteType}
            onChange={(e) => changeSiteType(e.target.value as SiteType)}
            className="mb-3 w-full rounded border p-2 text-base"
          >
            {(Object.keys(siteTypeLabels) as SiteType[]).map((t) => (
              <option key={t} value={t}>
                {siteTypeLabels[t]}
              </option>
            ))}
          </select>
          <p className="mb-3 text-xs text-gray-500">
            ধরন বদলালে নিচের সুইচগুলো নিজে সাজবে। চাইলে আলাদা করে বদলানো যায়।
          </p>

          <div className="flex flex-col gap-2">
            {(Object.keys(featureLabels) as (keyof Features)[]).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={features[key]}
                  disabled={key === "cart" && !features.shop}
                  onChange={(e) => toggleFeature(key, e.target.checked)}
                />
                {featureLabels[key]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded border p-4">
          <legend className="px-1 text-sm font-semibold">About</legend>
          <p className="mb-3 text-xs text-gray-500">
            লেখা খালি রাখলে সাইটে About সেকশন দেখাবে না।
          </p>

          <label className="flex flex-col gap-1 text-sm">
            About text
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              rows={6}
              className="rounded border p-2 text-base"
            />
          </label>

          <label className="mt-3 flex flex-col gap-1 text-sm">
            Skills (কমা দিয়ে আলাদা করুন)
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Logo Design, Branding, Calligraphy"
              className="rounded border p-2 text-base"
            />
          </label>

          <div className="mt-3 text-sm">
            <p className="mb-1">Photo (ঐচ্ছিক)</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleAboutImage(e.target.files?.[0])}
            />
            {uploading && <p className="text-gray-500">Uploading...</p>}
            {aboutImage && (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aboutImage}
                  alt="About preview"
                  className="h-24 w-20 rounded border object-cover"
                />
                <button
                  type="button"
                  onClick={() => setAboutImage("")}
                  className="rounded border px-3 py-1 text-xs"
                >
                  Remove photo
                </button>
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="rounded border p-4">
          <legend className="px-1 text-sm font-semibold">Social links</legend>
          <p className="mb-3 text-xs text-gray-500">
            যেগুলোর লিংক দেবেন শুধু সেগুলোই সাইটে দেখাবে।
          </p>
          <div className="flex flex-col gap-3">
            {socialKeys.map((key) => (
              <label key={key} className="flex flex-col gap-1 text-sm">
                {socialLabels[key]}
                <input
                  value={socials[key]}
                  onChange={(e) =>
                    setSocials((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder="https://..."
                  className="rounded border p-2 text-base"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>
    </main>
  );
}