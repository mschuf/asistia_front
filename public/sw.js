/**
 * @file sw.js
 * @description Service worker PWA: precache del shell, estrategia network-first en navegación y caché de assets estáticos.
 */
/* asistIA service worker — shell cache mínimo */
const CACHE_VERSION = "asistia-v4";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

/**
 * Precarga URLs del shell en la caché ignorando fallos individuales.
 * @param {Cache} cache - Instancia de caché abierta para la versión activa.
 * @returns {Promise<PromiseSettledResult<void>[]>} Resultados de cada intento de precache.
 */
function precacheUrls(cache) {
  return Promise.allSettled(
    PRECACHE_URLS.map((url) =>
      cache.add(url).catch((error) => {
        console.warn("[asistIA SW] No se pudo precachear:", url, error);
      }),
    ),
  );
}

/** Instala el SW, precachea el shell y activa `skipWaiting` para tomar control de inmediato. */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => precacheUrls(cache))
      .then(() => self.skipWaiting()),
  );
});

/** Elimina cachés obsoletas y reclama clientes al activarse. */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Intercepta GET del mismo origen (excepto `/api`) con network-first en navegación y cache-first en assets. */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/index.html")),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    }),
  );
});
