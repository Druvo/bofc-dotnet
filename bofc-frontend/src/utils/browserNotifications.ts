// Notification permission helpers. History/delivery now live server-side
// (see state/features/notifications/notificationSlice.ts + public/sw.js's
// "push" handler) — this file used to also keep a localStorage-backed log,
// replaced by the backend's permanent per-account history.

const STORAGE_KEY = "bofc.notificationsEnabled";

export const isNotificationSupported = (): boolean =>
  typeof window !== "undefined" && "Notification" in window;

export const getNotificationPermission = (): NotificationPermission | "unsupported" =>
  isNotificationSupported() ? Notification.permission : "unsupported";

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
};

// User-level opt-in, separate from browser permission — lets someone grant
// permission once but still turn alerts off from the app's own UI.
export const isNotificationsEnabled = (): boolean =>
  localStorage.getItem(STORAGE_KEY) === "true" && getNotificationPermission() === "granted";

export const setNotificationsEnabled = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEY, String(enabled));
};

interface ShowNotificationOptions extends NotificationOptions {
  onClick?: () => void;
}

// In-tab-only popup for live events (auction bids/sales) that aren't part of
// the admin-broadcast/permanent-history system — nothing persisted here.
export const showBrowserNotification = (
  title: string,
  options?: ShowNotificationOptions
): Notification | undefined => {
  if (!isNotificationsEnabled()) return undefined;

  const { onClick, ...rest } = options || {};
  const notification = new Notification(title, { icon: "/logo192.png", ...rest });
  notification.onclick = () => {
    window.focus();
    onClick?.();
    notification.close();
  };
  return notification;
};
