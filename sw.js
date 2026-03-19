// ─────────────────────────────────────────────────────────────────────────────
// Service Worker — Buscador Leyes SENER
//
// Estrategias de caché:
//   • index.html / navegación  → network-first (siempre obtiene el HTML fresco)
//   • /assets/* (hashed)       → cache-first   (el hash garantiza unicidad)
//   • /data/*.json             → network-first (datos siempre frescos)
//   • resto (img, fuentes…)    → stale-while-revalidate
//
// La versión se deriva del query param ?v=BUILD_TIMESTAMP que inyecta Vite en
// cada build, lo que garantiza que un nuevo deploy activa un nuevo SW y limpia
// el caché obsoleto automáticamente.
// ─────────────────────────────────────────────────────────────────────────────

const urlParams = new URLSearchParams(self.location.search);
const buildVersion = urlParams.get('v') || 'v1';
const CACHE_NAME = `leyes-sener-${buildVersion}`;

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  // Activa inmediatamente sin esperar a que se cierren las pestañas anteriores
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/img/logo_sener.png']).catch(() => {})
    )
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => {
            console.log(`[SW] Eliminando caché obsoleto: ${k}`);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo maneja GET del mismo origen
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // ── 1. Navegación (index.html) — NETWORK FIRST ───────────────────────────
  // Siempre obtiene el HTML más reciente del servidor; cae al caché sólo si
  // no hay red (modo offline).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // ── 2. Assets hasheados de Vite (/assets/*) — CACHE FIRST ───────────────
  // El hash del nombre de archivo garantiza que cualquier cambio genera un
  // nombre diferente, por lo que es completamente seguro cachearlos para siempre.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── 3. Datos JSON (/data/*.json) — NETWORK FIRST ────────────────────────
  // Los archivos de ley deben estar siempre frescos.
  if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // ── 4. Resto (imágenes, fuentes, etc.) — STALE-WHILE-REVALIDATE ─────────
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
