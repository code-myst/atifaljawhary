"use client";

import { useEffect, useState } from "react";
import {
  isAlertsOn,
  isSoundOn,
  notificationsSupported,
  playBeep,
  requestNotifyPermission,
  setAlertsOn,
  setSoundOn,
  showSystemNotification,
} from "@/lib/adminNotify";
import { Card, btn } from "@/components/admin/ui";

export default function NotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [alerts, setAlerts] = useState(true);
  const [sound, setSound] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const ok = notificationsSupported();
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
    setAlerts(isAlertsOn());
    setSound(isSoundOn());
  }, []);

  async function enableBanner() {
    const p = await requestNotifyPermission();
    setPermission(p);
    setMessage(
      p === "granted"
        ? "Banner notifications enabled on this device."
        : "Permission was not granted. You can allow it from the browser's site settings."
    );
  }

  return (
    <Card className="mt-6">
      <h2 className="text-lg font-semibold">Notifications</h2>
      <p className="mt-1 text-sm text-neutral-500">
        এই ডিভাইসে নতুন অর্ডার বা কাস্টম অনুরোধ এলে জানানো হবে। এটা কাজ করে
        অ্যাডমিন অ্যাপ <strong>খোলা থাকলে</strong>।
      </p>

      <div className="mt-4 flex flex-col gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={alerts}
            onChange={(e) => {
              setAlerts(e.target.checked);
              setAlertsOn(e.target.checked);
            }}
          />
          Alerts on this device
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sound}
            disabled={!alerts}
            onChange={(e) => {
              setSound(e.target.checked);
              setSoundOn(e.target.checked);
            }}
          />
          Play a sound
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {supported && permission !== "granted" && (
            <button type="button" onClick={enableBanner} className={btn.secondary}>
              Enable banner notifications
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (sound) playBeep();
              void showSystemNotification("Test alert", "Notifications are working.");
            }}
            className={btn.secondary}
          >
            Send test
          </button>
        </div>

        {!supported && (
          <p className="text-xs text-neutral-500">
            এই ব্রাউজারে ব্যানার নোটিফিকেশন নেই। iPhone-এ অ্যাপটা হোম স্ক্রিনে
            ইনস্টল করে খুললে পাওয়া যায়। শব্দ ও ভেতরের বার্তা তবুও কাজ করবে।
          </p>
        )}
        {supported && permission === "denied" && (
          <p className="text-xs text-neutral-500">
            ব্রাউজারে নোটিফিকেশন বন্ধ করা আছে। সাইটের সেটিংস থেকে অনুমতি দিন।
          </p>
        )}
        {message && <p className="text-xs text-neutral-600">{message}</p>}
      </div>
    </Card>
  );
}