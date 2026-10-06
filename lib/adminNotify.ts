const ON_KEY = "admin-alerts-on";
const SOUND_KEY = "admin-alerts-sound";

function read(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}

function write(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export const isAlertsOn = () => read(ON_KEY, true);
export const setAlertsOn = (v: boolean) => write(ON_KEY, v);
export const isSoundOn = () => read(SOUND_KEY, true);
export const setSoundOn = (v: boolean) => write(SOUND_KEY, v);

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return Notification.requestPermission();
}

export function playBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    /* ignore */
  }
}

export async function showSystemNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") {
    return;
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration("/admin/");
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: "/admin/icons/192",
        tag: "admin-alert",
      });
      return;
    }
    new Notification(title, { body, icon: "/admin/icons/192" });
  } catch {
    /* ignore */
  }
}

export function notifyAdmin(title: string, body: string) {
  if (!isAlertsOn()) return;
  if (isSoundOn()) playBeep();
  void showSystemNotification(title, body);
}