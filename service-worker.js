const CACHE_VERSION = "v1.1.1"; // ⬅️ bump this on every release
const CACHE_NAME = `runner-cache-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./js/main.js",
  "./js/MenuScene.js",
  "./js/RunnerScene.js",
  "./manifest.json",
  "./resources/model.png"
];

// Install: cache new version
self.addEventListener("install", event => {
  self.skipWaiting(); // activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate: clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith("runner-cache-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for game assets
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});