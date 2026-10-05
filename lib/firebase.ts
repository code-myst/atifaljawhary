import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import siteConfig from "@/site.config";

const app = getApps().length ? getApp() : initializeApp(siteConfig.firebase);

export const db = getFirestore(app);
export const auth = getAuth(app);