import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, ClipboardList, TrendingUp, AlertTriangle, ChevronRight, Plus, Newspaper, Handshake } from 'lucide-react'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/actions/auth'
import { getMyGarden, getDashboardStats, getGardenOrders } from '@/lib/actions/vendor'
import { getGardenNegotiations } from '@/lib/actions/negotiations'
import { Badge } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Dashboard | Xuân Quan Vendor' }

function formatPrice(p: number) {
  if (p >= 1_000_000) return (p / 1_000_000).toFixed(1) + ' tr'
  if (p >= 1_000)     return Math.round(p / 1_000) + 'k'
  return p.toLocaleString('vi-VN')
}

const statusConfig: Record<string, { label: string; variant: any }> = {
  pending:   { label: 'Chờ xác nhận', variant: 'warning' },
  confirmed: { label: 'Đã xác nhận',  variant: 'info' },
  preparing: { label: 'Đang chuẩn bị', variant: 'info' },
  shipping:  { label: 'Đang giao',    variant: 'primary' },
  delivered: { label: 'Đã giao',      variant: 'success' },
  cancelled: { label: 'Đã hủy',       variant: 'danger' },
}

export default async function DashboardPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login?redirectTo=/dashboard')

  const raw = await getMyGarden()
  if (!raw) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <span className="text-5xl mb-4">🌱</span>
        <h2 className="font-bold text-lg text-textMain mb-2">Bạn chưa có nhà vườn</h2>
        <p className="text-sm text-textMuted mb-6">Tạo trang nhà vườn để bắt đầu bán hàng</p>
        <Link href="/products/new" className="bg-primary text-white font-bold px-6 py-3 rounded-xl text-sm">
          Tạo nhà vườn ngay
        </Link>
      </div>
    )
  }
  const garden = raw as any
  const [stats, recentOrders, deals] = await Promise.all([
    getDashboardStats(garden.id),
    getGardenOrders(garden.id, 'pending'),
    getGardenNegotiations(garden.id),
  ])
  const pendingDeals = deals.filter((d: any) => ['pending', 'countered'].includes(d.status))

  const statCards = [
    { icon: ClipboardList, label: 'Đơn chờ duyệt',   value: stats.pendingOrders,    color: 'text-orange-500 bg-orange-50',  href: '/orders' },
    { icon: Handshake,     label: 'Deal đang thương lượng', value: pendingDeals.length, color: 'text-blue-500 bg-blue-50',     href: '/dashboard#deals' },
    { icon: TrendingUp,    label: 'Doanh thu tháng',  value: formatPrice(stats.totalRevenue), color: 'text-green-600 bg-green-50', href: '/reports' },
    { icon: Package,       label: 'Sắp hết hàng',    value: stats.lowStockProducts, color: 'text-red-500 bg-red-50',      href: '/inventory' },
  ]

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="bg-primary px-5 pt-14 pb-6">
        <p className="text-white/70 text-xs mb-0.5">Xin chào 👋</p>
        <h1 className="text-xl font-serif font-bold text-white">{garden.name}</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <div className={`w-2 h-2 rounded-full ${garden.is_open ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white/80 text-xs">{garden.is_open ? 'Đang mở cửa' : 'Đã đóng cửa'}</span>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {statCards.map(({ icon: Icon, label, value, color, href }) => (
            <Link key={label} href={href} className="bg-white rounded-2xl p-4 shadow-soft border border-surface-dark block active:scale-[0.98] transition-transform">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold text-textMain">{value}</div>
              <div className="text-[11px] text-textMuted mt-0.5">{label}</div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-border shadow-soft mb-5 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-dark">
            <h2 className="font-bold text-sm text-textMain">Thao tác nhanh</h2>
          </div>
          <div className="divide-y divide-surface-dark">
            {[
              { href: '/products/new', icon: Plus,         label: 'Đăng bán sản phẩm mới',       color: 'text-primary bg-primary/10' },
              { href: '/profile',      icon: Newspaper,     label: 'Câu chuyện &amp; Hồ sơ vườn',     color: 'text-violet-500 bg-violet-50' },
              { href: '/orders',       icon: ClipboardList, label: 'Xem tất cả đơn hàng',          color: 'text-orange-500 bg-orange-50' },
              { href: '/inventory',    icon: Package,       label: 'Cập nhật kho hàng',           color: 'text-blue-500 bg-blue-50' },
              { href: '/reports',      icon: TrendingUp,    label: 'Xuất báo cáo thuế',            color: 'text-green-600 bg-green-50' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface transition active:bg-surface-dark">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-textMain flex-1">{label}</span>
                <ChevronRight className="w-4 h-4 text-textMuted" />
              </Link>
            ))}
          </div>
        </div>

        {/* Deals đang chờ */}
        {pendingDeals.length > 0 && (
          <div id="deals" className="bg-white rounded-2xl border border-border shadow-soft mb-5 overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-dark flex items-center justify-between">
              <h2 className="font-bold text-sm text-textMain flex items-center gap-2">
                <Handshake className="w-4 h-4 text-blue-500" />
                Deal đang thương lượng
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingDeals.length}
                </span>
              </h2>
            </div>
            <div className="divide-y divide-surface-dark">
              {pendingDeals.slice(0, 5).map((deal: any) => {
                const isCounted = deal.status === 'countered'
                return (
                  <Link key={deal.id} href={`/deals/${deal.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface transition active:bg-surface-dark">
                    {/* Avatar buyer */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: '#2D5A27' }}>
                      {deal.buyer?.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-textMain truncate">
                          {deal.buyer?.full_name ?? 'Ẩn danh'}
                        </p>
                        {isCounted && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
                            MỚI
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-textMuted truncate">
                        {deal.product?.name} · {deal.quantity} {deal.unit}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: '#2D5A27' }}>
                        {deal.buyer_price?.toLocaleString('vi-VN')}đ
                      </p>
                      {deal.seller_price && (
                        <p className="text-[10px] text-blue-500 font-semibold">
                          → {deal.seller_price?.toLocaleString('vi-VN')}đ
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-textMuted" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Pending orders */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-2xl border border-border shadow-soft mb-5 overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-dark flex justify-between items-center">
              <h2 className="font-bold text-sm text-textMain">
                Đơn chờ xác nhận
                {stats.pendingOrders > 0 && (
                  <span className="ml-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{stats.pendingOrders}</span>
                )}
              </h2>
              <Link href="/orders" className="text-xs font-bold text-primary">Xem tất cả</Link>
            </div>
            <div className="divide-y divide-surface-dark">
              {recentOrders.slice(0, 3).map((order: any) => (
                <Link key={order.id} href={`/orders`} className="flex items-center justify-between px-4 py-3.5 hover:bg-surface transition">
                  <div>
                    <p className="text-sm font-bold text-textMain">{order.delivery_name}</p>
                    <p className="text-[11px] text-textMuted mt-0.5">{order.order_items?.length ?? 0} sản phẩm · {order.delivery_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatPrice(Number(order.total_amount))}đ</p>
                    <Badge variant="warning" className="mt-1">Chờ xác nhận</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
