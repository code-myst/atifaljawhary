import { unstable_cache } from "next/cache";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import siteConfig from "@/site.config";
import {
  Features,
  SiteType,
  Socials,
  emptySocials,
  isSiteType,
  normalizeFeatures,
  parseSkills,
  presets,
  socialKeys,
} from "@/lib/settingsTypes";

export type SiteSettings = {
  name: string;
  tagline: string;
  brandColor: string;
  contactEmail: string;
  whatsappNumber: string;
  siteType: SiteType;
  features: Features;
  aboutText: string;
  aboutImage: string;
  skills: string[];
  socials: Socials;
};

export const defaultSettings: SiteSettings = {
  name: siteConfig.name,
  tagline: siteConfig.tagline,
  brandColor: siteConfig.brandColor,
  contactEmail: siteConfig.contact.email,
  whatsappNumber: "",
  siteType: "graphic",
  features: presets.graphic,
  aboutText: "",
  aboutImage: "",
  skills: [],
  socials: emptySocials,
};

const fetchSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const snap = await getDoc(doc(db, "settings", "main"));
    if (!snap.exists()) return defaultSettings;
    const d = snap.data();

    const siteType: SiteType = isSiteType(d.siteType)
      ? d.siteType
      : defaultSettings.siteType;
    const base = presets[siteType];
    const f = (d.features ?? {}) as Partial<Features>;

    const features = normalizeFeatures({
      portfolio: typeof f.portfolio === "boolean" ? f.portfolio : base.portfolio,
      shop: typeof f.shop === "boolean" ? f.shop : base.shop,
      cart: typeof f.cart === "boolean" ? f.cart : base.cart,
      customOrders:
        typeof f.customOrders === "boolean" ? f.customOrders : base.customOrders,
      testimonials:
        typeof f.testimonials === "boolean" ? f.testimonials : base.testimonials,
    });

    const rawSocials = (d.socials ?? {}) as Record<string, unknown>;
    const socials: Socials = { ...emptySocials };
    for (const key of socialKeys) {
      const v = rawSocials[key];
      socials[key] = typeof v === "string" ? v : "";
    }

    return {
      name: d.name ? String(d.name) : defaultSettings.name,
      tagline: d.tagline ? String(d.tagline) : defaultSettings.tagline,
      brandColor: d.brandColor
        ? String(d.brandColor)
        : defaultSettings.brandColor,
      contactEmail: d.contactEmail
        ? String(d.contactEmail)
        : defaultSettings.contactEmail,
      whatsappNumber: d.whatsappNumber ? String(d.whatsappNumber) : "",
      siteType,
      features,
      aboutText: d.aboutText ? String(d.aboutText) : "",
      aboutImage: d.aboutImage ? String(d.aboutImage) : "",
      skills: d.skills ? parseSkills(String(d.skills)) : [],
      socials,
    };
  },
  ["settings"],
  { revalidate: 300, tags: ["settings"] }
);

export async function getSettings(): Promise<SiteSettings> {
  try {
    return await fetchSettings();
  } catch (error) {
    console.error("Settings error:", error);
    return defaultSettings;
  }
}