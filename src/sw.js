// `jwwatchnight/src/sw.js`
const CACHE_NAME = 'jwwatch-v1';

// Only stable, non-hashed outputs
const PRECACHE_URLS = [
    `${self.registration.scope}`,
    `${self.registration.scope}index.html`,
    `${self.registration.scope}manifest.json`,
    `${self.registration.scope}favicon.ico`
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.map(n => (n !== CACHE_NAME) && caches.delete(n)))
        )
    );
    self.clients.claim();
});

// Fetch strategies:
// - Navigations: network first, fallback to cached index.html
// - Local built assets (JS/CSS/img): stale-while-revalidate
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Handle SPA navigations
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() =>
                caches.match(`${self.registration.scope}index.html`)
            )
        );
        return;
    }

    // Ignore non-GET
    if (req.method !== 'GET') return;

    // Stale-while-revalidate for local static assets
    event.respondWith(
        caches.match(req).then(cached => {
            const network = fetch(req).then(res => {
                if (
                    res &&
                    res.status === 200 &&
                    (res.type === 'basic' || res.type === 'cors')
                ) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
                }
                return res;
            }).catch(() => cached);
            return cached || network;
        })
    );
});