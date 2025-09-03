// Basic service worker for offline caching
const CACHE_NAME = 'habit-tracker-cache-v1';
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
  '/src/App.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Try network in background for freshness
        fetch(request).then(resp => {
          caches.open(CACHE_NAME).then(cache => cache.put(request, resp.clone()));
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return resp;
      }).catch(() => cached);
    })
  );
});
