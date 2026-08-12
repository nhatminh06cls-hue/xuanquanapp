'use client'

import { useEffect, useCallback, useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/messaging'
import { createClient } from '@/lib/supabase/client'

// Lưu FCM token vào Supabase profiles
async function saveFcmToken(token: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await (supabase as any)
    .from('profiles')
    .update({ fcm_token: token, fcm_updated_at: new Date().toISOString() })
    .eq('id', user.id)
}

// Toast thông báo foreground
function NotificationToast({ notification, onClose }: {
  notification: { title: string; body: string; url?: string }
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[400px] z-[9999] animate-slide-down">
      <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#f0f6ef' }}>
            <Bell className="w-5 h-5" style={{ color: '#2D5A27' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{notification.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        {notification.url && (
          <a href={notification.url}
            className="block px-4 py-2 text-xs font-bold text-center border-t border-gray-100 transition"
            style={{ color: '#2D5A27', backgroundColor: '#f0f6ef' }}
            onClick={onClose}>
            Xem chi tiết →
          </a>
        )}
      </div>
    </div>
  )
}

// Hook chính — dùng trong layout
export function usePushNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [toast, setToast] = useState<{ title: string; body: string; url?: string } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const enable = useCallback(async () => {
    const token = await requestNotificationPermission()
    if (token) {
      await saveFcmToken(token)
      setPermission('granted')
    } else {
      setPermission(Notification.permission)
    }
  }, [])

  // Lắng nghe foreground messages
  useEffect(() => {
    let unsub: (() => void) | undefined
    onForegroundMessage((payload) => {
      const { title, body } = payload.notification ?? {}
      if (title) {
        setToast({ title, body: body ?? '', url: payload.data?.url })
      }
    }).then(fn => { unsub = fn })

    return () => { unsub?.() }
  }, [])

  return { permission, enable, toast, clearToast: () => setToast(null) }
}

// Nút bật thông báo — đặt trong account page
export function NotificationToggleButton() {
  const { permission, enable } = usePushNotification()

  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: '#2D5A27' }}>
        <Bell className="w-4 h-4" />
        <span className="font-semibold">Thông báo đã bật</span>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <BellOff className="w-4 h-4" />
        <span>Thông báo bị chặn (bật trong cài đặt trình duyệt)</span>
      </div>
    )
  }

  return (
    <button onClick={enable}
      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm text-white transition w-full justify-center"
      style={{ backgroundColor: '#2D5A27' }}>
      <Bell className="w-4 h-4" />
      Bật thông báo đơn hàng
    </button>
  )
}

// Provider bọc toàn app — đặt trong layout
export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { toast, clearToast } = usePushNotification()

  return (
    <>
      {children}
      {toast && (
        <NotificationToast notification={toast} onClose={clearToast} />
      )}
    </>
  )
}
