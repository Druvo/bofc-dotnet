// Minimal service worker — exists to satisfy PWA installability criteria and
// speed up repeat static-asset loads. Deliberately does NOT cache /api or /ws
// traffic: this app shows live finance/auction/match data, and a cache-first
// API response here would mean serving stale bids, balances, or scores.
const CACHE_NAME = "bofc-static-v2";
const PRECACHE_URLS = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Real Web Push — fires even when no tab is open. Payload is the JSON string
// NotificationService.PushToRecipientsAsync sends: { title, body }.
self.addEventListener("push", (event) => {
  let data = { title: "BOFC", body: "" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // ignore malformed payloads, fall back to the default above
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/logo192.png",
        data: { url: "/notifications" },
      }),
      // Let any already-open tab refresh its notification list/badge right
      // away instead of only updating when the OS notification is clicked.
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "push-received" }));
      }),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.postMessage({ type: "notification-click", url });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls, WebSocket upgrades, or non-GET requests —
  // those must always hit the network live.
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/ws/")
  ) {
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Navigation requests (the SPA shell, "/" and any client-side route the
  // server falls back to index.html for) must be network-first. Cache-first
  // here was the actual bug behind every "deploy didn't take" symptom this
  // session - once index.html was cached once, it (and the OLD hashed JS
  // bundle filenames it references) got served forever on every future
  // visit/reload, regardless of how many new versions were deployed. Static
  // assets stay cache-first below since CRA gives each build's JS/CSS a new
  // content hash in the filename - a stale cache entry there is simply never
  // requested again once index.html itself is fresh.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for same-origin static assets (JS/CSS/images/fonts), with a
  // network fallback that also refreshes the cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
