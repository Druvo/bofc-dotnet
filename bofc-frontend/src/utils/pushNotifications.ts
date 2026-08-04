// Real Web Push subscription flow — request permission, subscribe the service
// worker to the push service using the backend's VAPID public key, and hand
// the subscription to the backend so NotificationService can target this
// device. See public/sw.js for the "push"/"notificationclick" handlers.
import axiosApi from "../state/api/axiosBase";
import { API_URL } from "../settings";
import { requestNotificationPermission, isNotificationSupported } from "./browserNotifications";

export const isPushSupported = (): boolean =>
  isNotificationSupported() && "serviceWorker" in navigator && "PushManager" in window;

// Web Push VAPID keys are URL-safe base64; PushManager.subscribe wants a raw Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const { data } = await axiosApi.get(`${API_URL}/notifications/vapid-public-key`);
    const publicKey: string = data.content.publicKey;
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = subscription.toJSON();
  await axiosApi.post(`${API_URL}/notifications/subscribe`, {
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
  });

  return true;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await axiosApi.delete(`${API_URL}/notifications/subscribe?endpoint=${encodeURIComponent(endpoint)}`);
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}
