import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { firebaseConfig, VAPID_KEY } from './config'

// Khởi tạo Firebase app (singleton)
function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp(firebaseConfig)
}

// Lấy FCM token — xin quyền thông báo từ browser
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const supported = await isSupported()
    if (!supported) {
      console.warn('[FCM] Not supported in this browser')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[FCM] Permission denied')
      return null
    }

    const app = getFirebaseApp()
    const messaging = getMessaging(app)

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    console.log('[FCM] Token:', token?.slice(0, 20) + '...')
    return token
  } catch (err) {
    console.error('[FCM] Error getting token:', err)
    return null
  }
}

// Lắng nghe thông báo khi app đang mở (foreground)
export async function onForegroundMessage(callback: (payload: any) => void) {
  try {
    const supported = await isSupported()
    if (!supported) return

    const app = getFirebaseApp()
    const messaging = getMessaging(app)
    return onMessage(messaging, callback)
  } catch (err) {
    console.error('[FCM] onForegroundMessage error:', err)
  }
}
