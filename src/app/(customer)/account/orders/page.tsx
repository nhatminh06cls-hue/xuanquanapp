'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Package, ChevronRight, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: 'Chờ xác nhận', color: 'text-orange-600 bg-orange-50 border-orange-200', dot: 'bg-orange-400' },
  confirmed: { label: 'Đã xác nhận',  color: 'text-blue-600 bg-blue-50 border-blue-200',      dot: 'bg-blue-400' },
  preparing: { label: 'Đang chuẩn bị',color: 'text-blue-600 bg-blue-50 border-blue-200',      dot: 'bg-blue-400' },
  shipping:  { label: 'Đang giao',    color: 'text-primary bg-primary/10 border-primary/20',  dot: 'bg-primary' },
  delivered: { label: 'Đã giao',      color: 'text-green-600 bg-green-50 border-green-200',   dot: 'bg-green-400' },
  cancelled: { label: 'Đã hủy',       color: 'text-red-500 bg-red-50 border-red-200',         dot: 'bg-red-400' },
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Tiền mặt khi nhận',
  bank_transfer: 'Chuyển khoản',
  e_wallet: 'Ví điện tử',
}

function formatPrice(p: number) {
  return Number(p).toLocaleString('vi-VN') + 'đ'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TABS = [
  { value: 'all',       label: 'Tất cả' },
  { value: 'pending',   label: 'Chờ xác nhận' },
  { value: 'shipping',  label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

export default function MyOrdersPage() {
  const router = useRouter()
  const [orders, setOrders]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login?redirectTo=/account/orders'); return }

      let q = (supabase as any)
        .from('orders')
        .select(`
          id, status, total_amount, subtotal, shipping_fee,
          payment_method, created_at,
          delivery_name, delivery_address,
          order_items(id, product_name, quantity, unit_price, is_wholesale,
            product:products(images))
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      const { data } = await q
      setOrders(data ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab)

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 pt-14 pb-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-textMain" />
          </button>
          <h1 className="text-base font-bold text-textMain">Đơn hàng của tôi</h1>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-3">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                tab === t.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-border text-textMuted'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-surface-dark space-y-2">
              <div className="h-4 skeleton rounded w-1/3" />
              <div className="h-3 skeleton rounded w-1/2" />
              <div className="h-3 skeleton rounded w-2/3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Package className="w-14 h-14 text-border mb-4" />
            <p className="font-bold text-textMain text-base">Chưa có đơn hàng</p>
            <p className="text-sm text-textMuted mt-1 mb-6">
              {tab === 'all' ? 'Bạn chưa đặt hoa lần nào' : 'Không có đơn ở trạng thái này'}
            </p>
            <Link href="/"
              className="bg-primary text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition">
              Khám phá hoa ngay 🌸
            </Link>
          </div>
        ) : (
          filtered.map((order) => {
            const cfg = STATUS_MAP[order.status] ?? STATUS_MAP.pending
            const isOpen = expanded === order.id
            const items: any[] = order.order_items ?? []

            return (
              <div key={order.id}
                className="bg-white rounded-2xl border border-surface-dark shadow-soft overflow-hidden">

                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full px-4 py-4 flex items-start justify-between text-left">
                  <div className="flex-1 min-w-0">
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border mb-2 ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    {/* Summary */}
                    <p className="text-xs text-textMuted">{formatDate(order.created_at)}</p>
                    <p className="text-sm font-bold text-textMain mt-1">
                      {items.length} sản phẩm &nbsp;·&nbsp;
                      <span className="text-primary">{formatPrice(order.total_amount)}</span>
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-textMuted mt-1 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-surface-dark px-4 pb-4">
                    {/* Product list */}
                    <div className="mt-3 space-y-2">
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 py-1.5">
                          {item.product?.images?.[0] ? (
                            <img src={item.product.images[0]} alt={item.product_name}
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-surface-dark" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-xl flex-shrink-0">🌸</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-textMain truncate">{item.product_name}</p>
                            <p className="text-xs text-textMuted">
                              {formatPrice(item.unit_price)} × {item.quantity}
                              {item.is_wholesale && <span className="ml-1 text-[10px] text-primary font-bold bg-primary/10 px-1 rounded">Sỉ</span>}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-textMain flex-shrink-0">
                            {formatPrice(item.unit_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Price breakdown */}
                    <div className="mt-3 pt-3 border-t border-surface-dark space-y-1.5 text-xs">
                      <div className="flex justify-between text-textMuted">
                        <span>Tiền hàng</span><span>{formatPrice(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-textMuted">
                        <span>Phí ship</span><span>{formatPrice(order.shipping_fee)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-textMain pt-1.5 border-t border-border">
                        <span>Tổng thanh toán</span>
                        <span className="text-primary">{formatPrice(order.total_amount)}</span>
                      </div>
                    </div>

                    {/* Delivery & payment */}
                    <div className="mt-3 pt-3 border-t border-surface-dark space-y-1.5 text-xs text-textMuted">
                      <p>📍 {order.delivery_address}</p>
                      <p>💳 {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
                    </div>

                    {/* CTA — reorder or contact */}
                    {order.status === 'delivered' && (
                      <Link href="/"
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-primary/10 text-primary text-sm font-bold py-2.5 rounded-xl hover:bg-primary/15 transition">
                        🌸 Đặt lại
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
