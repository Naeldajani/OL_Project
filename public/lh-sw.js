/**
 * Lugdun'Home service worker.
 *
 * Deliberately conservative: navigations go to the network first so a new
 * deploy is picked up immediately, and only same-origin static assets are
 * cached (they carry content hashes, so they can be served cache-first
 * without ever going stale). The cache name is versioned at build time and
 * older caches are dropped on activate.
 */
// Both values are rewritten by scripts/inject-sw-assets.mjs after each build:
// the cache name is versioned per build, and the list holds the hashed JS/CSS
// the app needs. Those load during the very first navigation, before this
// worker controls the page, so they'd never be cached otherwise.
const CACHE = 'lugdunhome-__BUILD_ID__'
const ASSETS = ['__LH_ASSETS__']

const SHELL = new URL('lugdunhome.html', self.location).href
// Vite serves hashed assets with `crossorigin`, and the responses can carry a
// Vary header; without ignoreVary the cached copies never match the requests
// the browser actually makes, so offline silently falls back to the network.
const MATCH_OPTS = { ignoreVary: true }
const PRECACHE = [SHELL, ...ASSETS.filter((a) => !a.startsWith('__')).map((a) => new URL(a, self.location).href)]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches
      .open(CACHE)
      // one failed asset shouldn't abort the whole install
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url)))),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // App shell: network first, fall back to the last good copy when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(
          async () =>
            (await caches.match(request, MATCH_OPTS)) ?? (await caches.match(SHELL, MATCH_OPTS)),
        ),
    )
    return
  }

  // Hashed assets and images: cache first, they never change under a name.
  if (/\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request, MATCH_OPTS).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
  }
})
