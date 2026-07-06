// Bump alongside APP_VERSION in lib/pwa/version.ts on every release.
const CACHE_VERSION = "v1";
const CACHE_NAME = `ms-connect-${CACHE_VERSION}`;
const PRECACHE_URLS = ["/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  // Intentionally no self.skipWaiting() here — the new worker stays "waiting"
  // until the page asks it to take over, so the update banner has something
  // to offer instead of silently swapping caches out from under an open tab.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

// Let the page trigger the waiting worker to take over immediately.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function shouldBypassCache(url) {
  return (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.search.includes("_rsc=")
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (shouldBypassCache(url)) return;

  // Always use the network for navigations so HTML stays in sync with JS chunks.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/") ?? Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          void caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    }),
  );
});
