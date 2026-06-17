// ============================================================
// SERVICE WORKER — offline cache for AppSec Hub
// Strategy: cache-first for everything. After the first successful
// load, the app works fully offline. Update CACHE_VERSION below
// whenever you add new lesson/note files so the cache refreshes.
// ============================================================

const CACHE_VERSION = 'appsec-hub-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './manifest.json',
  './icon.svg',
];

// Lesson and note files — add new filenames here as you build more days.
const LESSON_ASSETS = [
  './lessons/day-01-http-interactive.html',
  './lessons/day-02-linux-interactive.html',
  './lessons/day-03-networking-interactive.html',
  './lessons/day-04-python-interactive.html',
  './lessons/interview-prep-days-1-4.html',
];

const NOTE_ASSETS = [
  './notes/day-01-revision-notes.md',
  './notes/day-02-revision-notes.md',
  './notes/day-03-revision-notes.md',
  './notes/day-04-revision-notes.md',
  './notes/days-05-25-revision-notes.md',
  './notes/day-0-verification-checklist.md',
  './notes/github-push-guide.md',
];

const ALL_ASSETS = [...CORE_ASSETS, ...LESSON_ASSETS, ...NOTE_ASSETS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Cache each asset individually so one missing file doesn't
      // block the whole install (e.g. a day you haven't built yet).
      return Promise.all(
        ALL_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('SW: could not cache', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests within our own origin
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Cache anything new we successfully fetch (e.g. a newly
          // added lesson file) so it's available offline next time.
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline and not cached — return a minimal fallback for HTML requests
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return new Response(
              '<html><body style="background:#0a0a0f;color:#9a93b0;font-family:sans-serif;padding:40px;text-align:center;"><h2 style="color:#fff;">This page isn\'t cached yet</h2><p>Connect to the internet once to download it, then it\'ll work offline forever.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
    })
  );
});
