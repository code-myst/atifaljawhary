export type Project = {
  id: string;
  title: string;
  category: string;
  imageUrl?: string;
  description?: string;
};

const siteConfig = {
  // ---- ক্লায়েন্ট অনুযায়ী বদলাবে ----
  name: "Demo Studio",
  tagline: "Design that tells your story",
  brandColor: "#d4af37",
  currency: "৳",
  contact: { email: "hello@example.com" },
  adminEmail: "your-admin@email.com",

  firebase: {
    apiKey: "AIzaSyCs4xJg4Vaa8fWMXKq1yOA5rMr8jff0lbE",
    authDomain: "designersite.firebaseapp.com",
    projectId: "designersite",
    storageBucket: "designersite.firebasestorage.app",
    messagingSenderId: "987866658664",
    appId: "1:987866658664:web:5cc64f40e1620d315248dd",
  },

  cloudinary: {
    cloudName: "wswiilug",
    uploadPreset: "atifaj",
  },

  // ---- Firestore খালি থাকলে এগুলো দেখাবে ----
  projects: [
    { id: "1", title: "Brand Identity", category: "Branding" },
    { id: "2", title: "Mobile App UI", category: "UI/UX" },
    { id: "3", title: "Poster Series", category: "Print" },
    { id: "4", title: "Landing Page", category: "Web" },
  ] as Project[],
};

export default siteConfig;
