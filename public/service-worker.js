// Versioned service worker with optimizations: navigation preload, cache trimming, split strategies
// Increment SW_VERSION when deploying new UI so clients refresh automatically
const SW_VERSION = 'v4-20250903-2';
const PRECACHE_PREFIX = 'habit-precache-';
const RUNTIME_PREFIX = 'habit-runtime-';
const PRECACHE = `${PRECACHE_PREFIX}${SW_VERSION}`;
const RUNTIME = `${RUNTIME_PREFIX}v1`;
const RUNTIME_MAX_ENTRIES = 200;

// Core assets that should always be cacheable (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/firebase-config.js',
  '/vendor/react.production.min.js',
  '/vendor/react-dom.production.min.js',
  '/vendor/babel.min.js',
  '/vendor/tailwindcdn.js',
  '/src/utils.js',
  '/src/components/AddHabit.js',
  '/src/components/HabitScheduleButton.js',
  '/src/components/MiniCalendar.js',
  '/src/components/MonthYearPicker.js',
  '/src/components/ContributionCalendar.js',
  '/src/App.js'
];

async function trimCache(cacheName, maxEntries){
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if(keys.length <= maxEntries) return;
  // delete oldest (FIFO)
  for(let i=0; i< keys.length - maxEntries; i++){
    await cache.delete(keys[i]);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Enable navigation preload for faster first paint
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => (k.startsWith(PRECACHE_PREFIX) && k !== PRECACHE) || (k.startsWith(RUNTIME_PREFIX) && k !== RUNTIME)).map(k => caches.delete(k)));
    await self.clients.claim();
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      client.postMessage({ type: 'SW_ACTIVATED', version: SW_VERSION });
    }
  })());
});

// Listen for explicit skip waiting messages (when update found)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data.type === 'GET_VERSION') event.ports?.[0]?.postMessage?.(SW_VERSION);
});

// Strategy:
//  - Navigation requests: network-first with preload, fallback to precache index
//  - Same-origin static assets: stale-while-revalidate (runtime cache)
//  - Cross-origin: network-first, fallback to cache if previously stored
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Ignore non-http(s) schemes (e.g. chrome-extension, devtools)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith((async () => {
      try {
        const preload = event.preloadResponse ? await event.preloadResponse : null;
        if (preload) {
          const cache = await caches.open(PRECACHE);
          cache.put('/index.html', preload.clone());
          return preload;
        }
        const networkResp = await fetch(request, { cache: 'no-store' });
        const cache = await caches.open(PRECACHE);
        cache.put('/index.html', networkResp.clone());
        return networkResp;
      } catch {
        const cached = await caches.match('/index.html');
        return cached || new Response('<!doctype html><title>Offline</title><meta charset="utf-8"/><body style="font-family:system-ui;background:#0f172a;color:#f1f5f9;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div><h1 style="margin:0 0 8px;font-size:22px;">Offline</h1><p style="margin:0 0 16px;font-size:14px;opacity:.8;">You are offline. Changes will sync when reconnected.</p><button onclick="location.reload()" style="padding:8px 14px;border:1px solid #16a34a;background:#16a34a;color:#fff;border-radius:6px;cursor:pointer;">Retry</button></div></body>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // Static same-origin assets (stale-while-revalidate)
  if (isSameOrigin) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then(async resp => {
        if (resp.ok) {
          await cache.put(request, resp.clone());
          trimCache(RUNTIME, RUNTIME_MAX_ENTRIES);
        }
        return resp;
      }).catch(() => undefined);
      return cached || fetchPromise || new Response(null, { status: 504 });
    })());
    return;
  }

  // Cross-origin: try network then cache
  event.respondWith((async () => {
    try {
      const resp = await fetch(request);
  if (resp && resp.status === 200 && resp.type === 'basic' && (url.protocol === 'http:' || url.protocol === 'https:')) {
        const cache = await caches.open(RUNTIME);
        cache.put(request, resp.clone());
        trimCache(RUNTIME, RUNTIME_MAX_ENTRIES);
      }
      return resp;
    } catch {
      const cached = await caches.match(request);
      return cached || new Response(null, { status: 504 });
    }
  })());
});
