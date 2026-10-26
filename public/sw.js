const CACHE_NAME = 'marley-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html',
  '/credit-auto-reload.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isSensitive(url) {
  const p = url.pathname.toLowerCase();
  if (p.startsWith('/api')) return true;
  if (p.includes('/auth/')) return true;
  if (p.includes('/rest/')) return true;
  if (p.includes('/functions/')) return true;
  if (p.includes('/storage/')) return true;
  if (p.includes('payment') || p.includes('pagamento')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Nunca cachear requisições autenticadas ou sensíveis
  if (req.headers.has('authorization') || req.headers.has('cookie')) return;
  if (isSensitive(url)) return;
  if (url.origin !== self.location.origin) return;

  // Navegação: network-first com fallback para cache/offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // Assets estáticos: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('/offline.html'));
    })
  );
});
