// Firebase Service Worker — xử lý background push notification
// https://firebase.google.com/docs/cloud-messaging/js/receive

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey:            'AIzaSyAyuc4_VtPEV7hyPu3uOvcOysoZhrN7CJw',
  authDomain:        'xuanquan-flowers.firebaseapp.com',
  projectId:         'xuanquan-flowers',
  storageBucket:     'xuanquan-flowers.firebasestorage.app',
  messagingSenderId: '617900306531',
  appId:             '1:617900306531:web:4145ba6cb2e4c184b1c856',
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

// Xử lý background notification (khi app đóng / tab ẩn)
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload)

  const title = payload.notification?.title ?? 'Làng Hoa Xuân Quan'
  const body  = payload.notification?.body  ?? ''
  const icon  = payload.notification?.icon  ?? '/icon-192.png'

  self.registration.showNotification(title, {
    body,
    icon,
    badge:   '/icon-72.png',
    tag:     payload.data?.orderId ?? 'xuanquan-noti',
    data:    payload.data ?? {},
    vibrate: [200, 100, 200],
  })
})

// Mở app khi click notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Nếu đang có tab mở → focus
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      // Không có tab → mở mới
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
