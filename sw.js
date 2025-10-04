const CACHE_NAME = 'ultimate-coder-cache-v1.1'; // Updated cache version for new app
const urlsToCache = [
    '/',
    'index.html',
    'manifest.json',
    'logo.png', // The application icon

    // External CDN resources
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap', // Added Fira Code
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://cdn.jsdelivr.net/npm/lucide-dynamic@latest/dist/lucide.min.js',
    'https://unpkg.com/lucide@latest',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-dark.min.css', // Prism CSS
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js', // Prism Core JS
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-clike.min.js', // Prism languages
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-html.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js'
];

// Install event: caches all defined static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing and caching static assets...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Service Worker: Cache.addAll failed', error);
            })
    );
});

// Activate event: cleans up old caches, ensuring only the current version is active
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating and cleaning old caches...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                    return null;
                })
            );
        }).then(() => {
            // Ensure the service worker takes control of clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event: intercepts network requests
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    const isCacheableAsset = urlsToCache.some(url => {
        if (url === '/' || url === 'index.html') {
            return requestUrl.pathname === '/' || requestUrl.pathname === '/index.html';
        }
        if (!url.startsWith('http')) {
            return requestUrl.pathname === `/${url}`;
        }
        return requestUrl.href.startsWith(url);
    });

    if (event.request.method === 'GET' && isCacheableAsset) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        console.log('Service Worker: Serving from cache:', event.request.url);
                        return response;
                    }
                    console.log('Service Worker: Fetching from network:', event.request.url);
                    return fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.ok) {
                                const responseToCache = networkResponse.clone();
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                            }
                            return networkResponse;
                        })
                        .catch((error) => {
                            console.error('Service Worker: Fetch failed for:', event.request.url, error);
                            return new Response('<h1>You are offline!</h1><p>It looks like you\'re not connected to the internet.</p>', {
                                headers: { 'Content-Type': 'text/html' }
                            });
                        });
                })
        );
    } else {
        event.respondWith(fetch(event.request));
    }
});