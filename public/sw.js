// Service Worker cho Làng Hoa Xuân Quan PWA
const CACHE_NAME = 'xuanquan-v3'

// Chỉ cache assets tĩnh thực sự (không phải HTML routes)
const STATIC_ASSETS = [
  '/manifest.json',
  '/hero-village.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/logo-xuanquan.png',
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

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Chỉ xử lý request cùng origin
  if (url.origin !== location.origin) return

  // ── Navigation (click link, browser back/forward) ──────────
  // KHÔNG cache HTML routes — để Next.js và middleware xử lý đúng
  // Cũ: fallback về '/' gây lỗi khi navigate từ / sang /account
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Offline fallback: thử match chính xác URL đó (nếu đã cache)
        // KHÔNG fallback về '/' vì sẽ trả về trang chủ cho mọi route
        return caches.match(request)
      })
    )
    return
  }

  // ── Next.js internal requests → network only ───────────────
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return
  }

  // ── Static assets → Cache first, fallback network ──────────
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
