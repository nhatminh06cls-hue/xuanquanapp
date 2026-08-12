'use client'

import { useEffect } from 'react'

/**
 * Đăng ký Service Worker cho PWA
 * Đặt trong layout để chạy 1 lần khi app khởi động
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service Worker đã đăng ký:', reg.scope)
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker lỗi:', err)
      })
  }, [])

  return null
}
