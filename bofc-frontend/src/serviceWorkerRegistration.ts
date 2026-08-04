// Registers public/sw.js. Only runs in production builds served over HTTPS
// (or localhost) — standard CRA pattern, trimmed to what this app needs.

export function register(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}

export function unregister(): void {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((registration) => registration.unregister())
    .catch(() => undefined);
}
