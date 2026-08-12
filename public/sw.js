// Service Worker cho Làng Hoa Xuân Quan PWA
const CACHE_NAME = 'xuanquan-v1'

// Các tài nguyên tĩnh được cache khi cài đặt
const STATIC_ASSETS = [
  '/',
  '/shop',
  '/manifest.json',
  '/hero-village.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// ── Install: cache static assets ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Bỏ qua lỗi nếu 1 file không cache được
      })
    })
  )
  self.skipWaiting()
})

// ── Activate: xóa cache cũ ────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: Network first, fallback to cache ───────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Chỉ xử lý request cùng origin
  if (url.origin !== location.origin) return

  // API calls → network only, không cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return
  }

  // Navigation requests → Network first, fallback cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match('/') )
    )
    return
  }

  // Static assets → Cache first, fallback network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
