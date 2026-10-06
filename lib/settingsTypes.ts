
export type SiteType = "graphic" | "artist" | "both";

export type Features = {
  portfolio: boolean;
  shop: boolean;
  cart: boolean;
  customOrders: boolean;
  testimonials: boolean;
};

export const featureLabels: Record<keyof Features, string> = {
  portfolio: "Portfolio (কাজের নমুনা)",
  shop: "Shop (রেডিমেড প্রোডাক্ট বিক্রি)",
  cart: "Cart (কার্টে যোগ করা)",
  customOrders: "Custom order (অর্ডার নিয়ে আঁকা)",
  testimonials: "Testimonials (ক্লায়েন্টের মতামত)",
};

export const siteTypeLabels: Record<SiteType, string> = {
  graphic: "গ্রাফিক ডিজাইনার",
  artist: "শিল্পী / ক্যালিগ্রাফি (বিক্রি করেন)",
  both: "দুটোই",
};

export const presets: Record<SiteType, Features> = {
  graphic: {
    portfolio: true,
    shop: false,
    cart: false,
    customOrders: true,
    testimonials: true,
  },
  artist: {
    portfolio: false,
    shop: true,
    cart: true,
    customOrders: true,
    testimonials: true,
  },
  both: {
    portfolio: true,
    shop: true,
    cart: true,
    customOrders: true,
    testimonials: true,
  },
};

// Shop বন্ধ থাকলে Cart চালু থাকতে পারবে না
export function normalizeFeatures(f: Features): Features {
  return { ...f, cart: f.shop && f.cart };
}

// শুধু সংখ্যা রাখে (যেমন 8801XXXXXXXXX)
export function cleanWhatsapp(value: string): string {
  return value.replace(/\D/g, "");
}

export function isSiteType(value: unknown): value is SiteType {
  return value === "graphic" || value === "artist" || value === "both";
}

export type Socials = {
  facebook: string;
  instagram: string;
  behance: string;
  linkedin: string;
  youtube: string;
};

export const socialKeys: (keyof Socials)[] = [
  "facebook",
  "instagram",
  "behance",
  "linkedin",
  "youtube",
];

export const socialLabels: Record<keyof Socials, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  behance: "Behance",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

export const emptySocials: Socials = {
  facebook: "",
  instagram: "",
  behance: "",
  linkedin: "",
  youtube: "",
};

// https:// না থাকলে নিজে বসিয়ে দেয়
export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

// "Logo, Branding" -> ["Logo", "Branding"] (সর্বোচ্চ ১২টা)
export function parseSkills(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}
export type PaymentField = { id: string; label: string; required: boolean };

export type PaymentMethod = {
  id: string;
  name: string;
  number: string;
  instructions: string;
  fields: PaymentField[];
};

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function parsePaymentMethods(raw: unknown): PaymentMethod[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((m): PaymentMethod[] => {
    if (!m || typeof m !== "object") return [];
    const o = m as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : "";
    if (!name) return [];

    const fields = Array.isArray(o.fields)
      ? o.fields.flatMap((f): PaymentField[] => {
          if (!f || typeof f !== "object") return [];
          const fo = f as Record<string, unknown>;
          const label = typeof fo.label === "string" ? fo.label : "";
          if (!label) return [];
          return [
            {
              id: typeof fo.id === "string" && fo.id ? fo.id : newId(),
              label,
              required: fo.required !== false,
            },
          ];
        })
      : [];

    return [
      {
        id: typeof o.id === "string" && o.id ? o.id : newId(),
        name,
        number: typeof o.number === "string" ? o.number : "",
        instructions:
          typeof o.instructions === "string" ? o.instructions : "",
        fields,
      },
    ];
  });
}

export function cleanPaymentMethods(methods: PaymentMethod[]): PaymentMethod[] {
  return methods
    .map((m) => ({
      id: m.id || newId(),
      name: m.name.trim().slice(0, 60),
      number: m.number.trim().slice(0, 40),
      instructions: m.instructions.trim().slice(0, 600),
      fields: m.fields
        .map((f) => ({
          id: f.id || newId(),
          label: f.label.trim().slice(0, 60),
          required: f.required,
        }))
        .filter((f) => f.label)
        .slice(0, 8),
    }))
    .filter((m) => m.name)
    .slice(0, 6);
}