// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.

// Type definitions for service worker
interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<any>): void;
}

interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface PushEvent extends ExtendableEvent {
  data?: {
    json(): any;
    text(): string;
  };
}

interface NotificationEvent extends ExtendableEvent {
  notification: Notification & {
    data?: any;
    close(): void;
  };
}

interface Notification {
  data?: any;
  close(): void;
}

const CACHE_NAME = 'launchify-cache-v1';
const RUNTIME = 'runtime';

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/js/vendors~main.chunk.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// A list of local resources we always want to be cached.
const CACHED_ROUTES = [
  /^\/dashboard/,
  /^\/profile/,
  /^\/static\//,
  /\.(?:png|gif|jpg|jpeg|svg|webp)$/,
  /\.(?:js|css)$/
];

// API routes that should be cached with network-first strategy
const API_ROUTES = [
  /^\/api\/user/,
  /^\/api\/profile/
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Skip waiting forces the waiting service worker to become the active service worker
        return (self as any).skipWaiting();
      })
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event: ExtendableEvent) => {
  const currentCaches = [CACHE_NAME, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => {
      // Claim clients so that the very first page load is controlled by the service worker
      return (self as any).clients.claim();
    })
  );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', (event: FetchEvent) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Handle API requests with network-first strategy
  const isApiRequest = API_ROUTES.some(route => route.test(url.pathname));
  if (isApiRequest) {
    event.respondWith(
      networkFirstStrategy(event.request)
    );
    return;
  }

  // Handle static assets and routes with cache-first strategy
  const isCachedRoute = CACHED_ROUTES.some(route => route.test(url.pathname));
  if (isCachedRoute) {
    event.respondWith(
      cacheFirstStrategy(event.request)
    );
    return;
  }

  // For everything else, use network-first strategy
  event.respondWith(
    networkFirstStrategy(event.request)
  );
});

// Cache-first strategy: Try the cache first, then fall back to network
async function cacheFirstStrategy(request: Request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    // Cache valid responses
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(RUNTIME);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // If both cache and network fail, return a fallback
    return createOfflineFallback();
  }
}

// Network-first strategy: Try the network first, then fall back to cache
async function networkFirstStrategy(request: Request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache valid responses
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(RUNTIME);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If both network and cache fail, return a fallback
    return createOfflineFallback();
  }
}

// Create a fallback response for offline scenarios
function createOfflineFallback() {
  return caches.match('/offline.html')
    .then(response => {
      if (response) {
        return response;
      }
      
      // If offline.html is not in cache, return a simple offline message
      return new Response(
        '<html><body><h1>You are offline</h1><p>Please check your internet connection and try again.</p></body></html>',
        {
          headers: { 'Content-Type': 'text/html' }
        }
      );
    });
}

// Listen for the push event to show notifications
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/badge.png',
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    (self as any).registration.showNotification(data.title, options)
  );
});

// Listen for notification clicks
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      (self as any).clients.matchAll({ type: 'window' }).then((clientList: any[]) => {
        // Check if there is already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is already open, open a new one
        if ((self as any).clients.openWindow) {
          return (self as any).clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
}); 