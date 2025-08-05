// service-worker.js

const CACHE_NAME = 'vidcrunch-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/manifest.json',
  '/icons/vidcrunch.svg',
  '/assets/ffmpeg/ffmpeg.min.js',
  '/assets/ffmpeg/ffmpeg-core.js',
  '/assets/ffmpeg/ffmpeg-core.wasm',
  '/assets/ffmpeg/ffmpeg-core.worker.js',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/webfonts/fa-solid-900.woff2',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Fira+Code:wght@400;500;600&display=swap',
  'https://fonts.gstatic.com/s/jetbrainsmono/v23/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2',
  'https://fonts.gstatic.com/s/firacode/v26/uU9NCBsR6Z2vfE9aq3bh3dSD.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching essential assets');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache essential assets', error);
      })
  );
  self.skipWaiting(); // Forces the waiting service worker to become the active service worker
});

self.addEventListener('fetch', event => {
  // Handle navigation requests (page loads) differently
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => {
          return response || fetch(event.request);
        })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        ).catch(() => {
          // If network fails and it's a navigation request, serve the main HTML
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // For other requests, let the error propagate
          throw new Error('Network request failed');
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete, old caches cleared');
      return self.clients.claim(); // Take control of clients immediately
    })
  );
});