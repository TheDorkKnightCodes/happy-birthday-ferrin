const CACHE_VERSION = "v1.2.1"; // ⬅️ bump this on every release
const CACHE_NAME = `runner-cache-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./js/main.js",
  "./js/MenuScene.js",
  "./js/RunnerScene.js",
  "./js/CatcherScene.js",
  "./js/InboxScene.js",
  "./resources/ogg/ohoknvm.ogg",
  "./resources/ogg/partofmyplan.ogg",
  "./resources/ogg/watchthis.ogg",
  "./resources/mp3/ohoknvm.mp3",
  "./resources/mp3/partofmyplan.mp3",
  "./resources/mp3/watchthis.mp3",
  "./resources/mp3/Outro.mp3",
  "./resources/mp3/wishes.mp3",
  "./resources/wav/collect_2.wav",
  "./resources/wav/Hit4.wav",
  "./resources/wav/jump_1.wav",
  "./resources/wav/jump_2.wav",
  "./resources/png/model.png",
  "./resources/png/model_arms_up.png",
  "./resources/png/ocean_and_islands_night.png",
  "./css/styles.css",
  "./manifest.json",
  "./resources/png/model.png"
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