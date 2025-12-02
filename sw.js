// sw.js - VERSIÓN CORREGIDA
const CACHE_NAME = 'tienda-pwa-v3';
const urlsToCache = [
  './',
  './index.html',
  './tienda.html', 
  './admin.html',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto, agregando archivos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // SOLUCIÓN: Ignorar requests no HTTP/HTTPS
  const url = new URL(event.request.url);
  
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return; // Ignorar chrome-extension:, data:, etc.
  }
  
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            
            // SOLUCIÓN: Verificar nuevamente antes de cachear
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
            return new Response('Sin conexión', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
