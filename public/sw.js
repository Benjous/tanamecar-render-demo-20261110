const PAGE_CACHE = 'taname-pages-v1';
const SHELL_CACHE = 'taname-shell-v1';

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const shell = await caches.open(SHELL_CACHE);
        await shell.addAll(['/offline.html', '/login']);
        try {
            const response = await fetch('/build/manifest.json', { cache: 'no-store' });
            if (response.ok) {
                const manifest = await response.json();
                const urls = new Set(['/build/manifest.json']);
                Object.values(manifest).forEach((entry) => {
                    if (entry.file) urls.add(`/build/${entry.file}`);
                    (entry.css ?? []).forEach((file) => urls.add(`/build/${file}`));
                    (entry.assets ?? []).forEach((file) => urls.add(`/build/${file}`));
                });
                await shell.addAll([...urls]);
            }
        } catch {
            // Le shell reste utilisable avec les pages déjà mises en cache.
        }
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => ![PAGE_CACHE, SHELL_CACHE].includes(key)).map((key) => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'clear-pages') {
        event.waitUntil(caches.delete(PAGE_CACHE));
    }
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith((async () => {
        try {
            const response = await fetch(event.request);
            if (response && response.ok) {
                const cache = await caches.open(PAGE_CACHE);
                if (url.pathname !== '/up') {
                    cache.put(event.request, response.clone());
                }
            }
            return response;
        } catch {
            const cached = await caches.match(event.request);
            if (cached && url.pathname !== '/up') {
                return cached;
            }

            if (url.pathname === '/up') {
                return new Response(JSON.stringify({ status: 'serveur local indisponible' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                });
            }

            if (event.request.mode === 'navigate') {
                return (await caches.match('/offline.html')) ?? new Response('Serveur local indisponible.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                });
            }

            return new Response(JSON.stringify({ message: 'Serveur TANAME indisponible.' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
            });
        }
    })());
});
