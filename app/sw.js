// ============================================================
// SERVICE WORKER — offline cache for AppSec Hub
// Strategy: cache-first for everything. After the first successful
// load, the app works fully offline. Update CACHE_VERSION below
// whenever you add new lesson/note files so the cache refreshes.
// ============================================================

const CACHE_VERSION = 'appsec-hub-v4';

// These are the app "shell" files — they change every time you ship an update.
// We use network-first for these so a phone with an old cached version
// always picks up new code on next load (as long as it has internet that moment).
// Everything else (lessons, notes) uses cache-first since that content
// is more static and you want instant offline loads.
const SHELL_ASSETS = ['./', './index.html', './app.js', './data.js', './sw.js'];

const CORE_ASSETS = [
  './manifest.json',
  './icon.svg',
];

// Lesson and note files — add new filenames here as you build more days.
const LESSON_ASSETS = [
  './lessons/day-01-http-interactive.html',
  './lessons/day-02-linux-interactive.html',
  './lessons/day-03-networking-interactive.html',
  './lessons/day-04-python-interactive.html',
  './lessons/day-05-architecture-interactive.html',
  './lessons/day-06-owasp-interactive.html',
  './lessons/day-07-burpsuite-interactive.html',
  './lessons/day-08-sqli-interactive.html',
  './lessons/day-09-xss-interactive.html',
  './lessons/interview-prep-days-1-4.html',
];

const NOTE_ASSETS = [
  './notes/day-01-revision-notes.md',
  './notes/day-02-revision-notes.md',
  './notes/day-03-revision-notes.md',
  './notes/day-04-revision-notes.md',
  './notes/day-05-revision-notes.md',
  './notes/day-06-revision-notes.md',
  './notes/day-07-revision-notes.md',
  './notes/day-08-revision-notes.md',
  './notes/day-09-revision-notes.md',
  './notes/days-05-25-revision-notes.md',
  './notes/day-0-verification-checklist.md',
  './notes/github-push-guide.md',
];

const ALL_ASSETS = [...SHELL_ASSETS, ...CORE_ASSETS, ...LESSON_ASSETS, ...NOTE_ASSETS];

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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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

  // The Cache API only supports http/https requests. Browser extensions
  // (ad blockers, password managers, etc.) sometimes generate their own
  // chrome-extension:// or other non-http requests that pass through this
  // listener — caching those throws. Let the browser handle those normally.
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return;
  }

  const url = new URL(event.request.url);
  const path = url.pathname;
  const isShellRequest =
    path.endsWith('/') ||
    path.endsWith('/index.html') ||
    path.endsWith('/app.js') ||
    path.endsWith('/data.js') ||
    path.endsWith('/sw.js');

  if (isShellRequest) {
    // NETWORK-FIRST: always try to get the latest shell code.
    // Falls back to cache only if genuinely offline.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // CACHE-FIRST: lessons, notes, icons — static content, instant offline loads.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
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
