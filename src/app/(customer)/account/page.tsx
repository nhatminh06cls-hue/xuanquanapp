'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, ShoppingBag, Store, ChevronRight, LogOut, Phone, MapPin, Settings, Bell, Handshake } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NotificationToggleButton } from '@/components/shared/PushNotification'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser]       = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [orders, setOrders]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { setLoading(false); return }
      setUser(u)

      const { data: p } = await (supabase as any).from('profiles').select('*').eq('id', u.id).single()
      setProfile(p)

      const { data: o } = await (supabase as any)
        .from('orders').select('id, status, total_amount, created_at, order_items(id)')
        .eq('customer_id', u.id).order('created_at', { ascending: false }).limit(5)
      setOrders(o ?? [])
      setLoading(false)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending:   { label: 'Chờ xác nhận', color: 'text-orange-600 bg-orange-50' },
    confirmed: { label: 'Đã xác nhận',  color: 'text-blue-600 bg-blue-50' },
    preparing: { label: 'Chuẩn bị',     color: 'text-blue-600 bg-blue-50' },
    shipping:  { label: 'Đang giao',    color: 'text-primary bg-primary/10' },
    delivered: { label: 'Đã giao',      color: 'text-green-600 bg-green-50' },
    cancelled: { label: 'Đã hủy',       color: 'text-red-600 bg-red-50' },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="bg-white px-5 pt-14 pb-6">
          <div className="w-16 h-16 skeleton rounded-full mb-3" />
          <div className="h-5 skeleton rounded w-32 mb-2" />
          <div className="h-3 skeleton rounded w-24" />
        </div>
      </div>
    )
  }

  // Chưa đăng nhập
  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-bold text-lg text-textMain mb-2">Đăng nhập để tiếp tục</h2>
        <p className="text-sm text-textMuted mb-6">Theo dõi đơn hàng, lưu sản phẩm yêu thích</p>
        <Link href="/auth/login"
          className="w-full max-w-xs bg-primary text-white font-bold py-3 rounded-xl text-center block hover:bg-primary/90 transition">
          Đăng nhập / Đăng ký
        </Link>
      </div>
    )
  }

  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Người dùng'
  const isVendor    = profile?.role === 'vendor'

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Profile header */}
      <div className="bg-gradient-to-br from-primary to-secondary px-5 pt-14 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{displayName}</h1>
            <p className="text-sm text-white/75">{profile?.phone ?? user?.email ?? ''}</p>
            {isVendor && (
              <span className="mt-1 inline-block bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                🌿 Nhà vườn
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Vendor shortcut */}
        {isVendor && (
          <Link href="/dashboard"
            className="block bg-primary text-white rounded-2xl px-4 py-3.5 shadow-card flex items-center gap-3 hover:bg-primary/90 transition active:scale-[0.98]">
            <Store className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-bold text-sm">Quản lý nhà vườn</p>
              <p className="text-xs text-white/75">Dashboard · Đơn hàng · Kho</p>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </Link>
        )}

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-dark flex justify-between items-center">
            <h2 className="font-bold text-sm text-textMain flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" /> Đơn hàng gần đây
            </h2>
            <Link href="/account/orders" className="text-xs font-bold text-primary">Xem tất cả</Link>
          </div>

          {orders.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm text-textMuted font-medium">Chưa có đơn hàng nào</p>
              <Link href="/" className="text-xs font-bold text-primary mt-2 block">Khám phá hoa ngay →</Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-dark">
              {orders.map((order: any) => {
                const cfg = STATUS_MAP[order.status] ?? STATUS_MAP.pending
                return (
                  <div key={order.id} className="px-4 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-textMain">
                        {order.order_items?.length ?? 0} sản phẩm
                      </p>
                      <p className="text-[11px] text-textMuted mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{Number(order.total_amount).toLocaleString('vi-VN')}đ</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Menu items */}
        <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
          {[
            { href: '/deals',                 icon: Handshake, label: 'Deal giá sỉ của tôi' },
            { href: '/account/settings',      icon: Settings,  label: 'Cài đặt tài khoản' },
            { href: '/account/addresses',     icon: MapPin,    label: 'Địa chỉ giao hàng' },
            { href: '/account/notifications', icon: Bell,      label: 'Thông báo' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-4 border-b border-surface-dark last:border-0 hover:bg-surface transition">
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="flex-1 text-sm font-semibold text-textMain">{label}</span>
              <ChevronRight className="w-4 h-4 text-textMuted" />
            </Link>
          ))}
        </div>

        {/* Push notification toggle */}
        <div className="bg-white rounded-2xl border border-border shadow-soft p-4">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">🔔 Thông báo</p>
          <NotificationToggleButton />
          <p className="text-[10px] text-textMuted mt-2 text-center">Nhận thông báo khi đơn hàng được xác nhận &amp; giao</p>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full bg-white border border-red-200 rounded-2xl px-4 py-4 flex items-center gap-3 text-danger hover:bg-red-50 transition shadow-soft">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-bold">Đăng xuất</span>
        </button>

        <p className="text-center text-[11px] text-textMuted/60 pb-4">Làng Hoa Xuân Quan · v1.0.0</p>
      </div>
    </div>
  )
}
