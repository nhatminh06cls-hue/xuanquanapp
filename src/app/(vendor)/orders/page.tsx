'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Phone, MapPin, Package, Check, X, Truck } from 'lucide-react'
import { getMyGarden, getGardenOrders, updateOrderStatus } from '@/lib/actions/vendor'
import { Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const TABS = [
  { value: 'pending',   label: 'Chờ duyệt' },
  { value: 'confirmed', label: 'Xác nhận' },
  { value: 'shipping',  label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'all',       label: 'Tất cả' },
]

const STATUS_CONFIG: Record<string, { label: string; variant: any; nextStatus?: string; nextLabel?: string }> = {
  pending:   { label: 'Chờ xác nhận', variant: 'warning',  nextStatus: 'confirmed', nextLabel: 'Xác nhận' },
  confirmed: { label: 'Đã xác nhận',  variant: 'info',     nextStatus: 'preparing', nextLabel: 'Chuẩn bị hàng' },
  preparing: { label: 'Đang chuẩn bị', variant: 'info',   nextStatus: 'shipping',  nextLabel: 'Giao hàng' },
  shipping:  { label: 'Đang giao',    variant: 'primary',  nextStatus: 'delivered', nextLabel: 'Xác nhận đã giao' },
  delivered: { label: 'Đã giao',      variant: 'success',  nextStatus: undefined },
  cancelled: { label: 'Đã hủy',       variant: 'danger',   nextStatus: undefined },
}

function formatPrice(p: number) {
  return Number(p).toLocaleString('vi-VN') + 'đ'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [garden, setGarden]       = useState<any>(null)
  const [orders, setOrders]       = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [updating, setUpdating]   = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<string | null>(null)

  useEffect(() => {
    getMyGarden().then(g => {
      setGarden(g)
      if (!g) setLoading(false) // Không có vườn → dừng skeleton
    })
  }, [])

  useEffect(() => {
    if (!garden) return
    setLoading(true)
    getGardenOrders(garden.id, activeTab).then(data => {
      setOrders(data)
      setLoading(false)
    })
  }, [garden, activeTab])

  async function handleUpdateStatus(orderId: string, status: string) {
    setUpdating(orderId)
    await updateOrderStatus(orderId, status)
    setUpdating(null)
    // Reload
    const data = await getGardenOrders(garden.id, activeTab)
    setOrders(data)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-0 border-b border-border sticky top-0 z-10">
        <h1 className="text-lg font-bold text-textMain mb-3">Quản lý đơn hàng</h1>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-3">
          {TABS.map(tab => (
            <button key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                activeTab === tab.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-border text-textMuted'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-surface-dark">
              <div className="h-4 skeleton rounded w-1/3 mb-3" />
              <div className="h-3 skeleton rounded w-2/3 mb-2" />
              <div className="h-3 skeleton rounded w-1/2" />
            </div>
          ))
        ) : !garden ? (
          <div className="flex flex-col items-center py-20 text-center px-6">
            <span className="text-5xl mb-4">🌱</span>
            <p className="font-bold text-textMain mb-1">Bạn chưa có nhà vườn</p>
            <p className="text-xs text-textMuted mb-5">Tạo trang nhà vườn để bắt đầu nhận đơn hàng</p>
            <a href="/profile" className="bg-primary text-white font-bold px-6 py-3 rounded-xl text-sm">
              Tạo nhà vườn ngay
            </a>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-4xl mb-3">📦</span>
            <p className="font-bold text-textMain">Không có đơn nào</p>
            <p className="text-xs text-textMuted mt-1">Tab đang chọn: {TABS.find(t => t.value === activeTab)?.label}</p>
          </div>
        ) : (
          orders.map((order: any) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending']
            const isExpanded = expanded === order.id
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-surface-dark shadow-soft overflow-hidden">
                {/* Order header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  className="w-full px-4 py-4 flex items-start justify-between text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-textMain">{order.delivery_name}</span>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-[11px] text-textMuted">{formatDate(order.created_at)}</p>
                    <p className="text-xs font-bold text-primary mt-1">{formatPrice(order.total_amount)}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-textMuted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-surface-dark px-4 pb-4">
                    {/* Contact */}
                    <div className="flex gap-2 mt-3 mb-3">
                      <a href={`tel:${order.delivery_phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-surface border border-border rounded-xl py-2 text-xs font-bold text-textMain hover:bg-surface-dark transition">
                        <Phone className="w-3.5 h-3.5 text-primary" /> {order.delivery_phone}
                      </a>
                      <div className="flex-1 flex items-center justify-center gap-1.5 bg-surface border border-border rounded-xl py-2 text-xs font-bold text-textMain">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-surface rounded-xl p-3 mb-3">
                      <p className="text-[10px] font-bold text-textMuted uppercase mb-2">Sản phẩm</p>
                      {(order.order_items ?? []).map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center py-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            {item.product?.images?.[0] ? (
                              <img src={item.product.images[0]} className="w-8 h-8 rounded-lg object-cover" alt="" />
                            ) : <div className="w-8 h-8 rounded-lg bg-surface-dark flex items-center justify-center text-sm">🌸</div>}
                            <div>
                              <p className="font-semibold text-textMain">{item.product_name}</p>
                              {item.is_wholesale && <span className="text-[9px] text-primary font-bold bg-primary/10 px-1 rounded">Sỉ</span>}
                            </div>
                          </div>
                          <span className="font-bold text-textMain">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 mb-4 text-xs">
                      <div className="flex justify-between text-textMuted"><span>Tiền hàng</span><span>{formatPrice(order.subtotal)}</span></div>
                      <div className="flex justify-between text-textMuted"><span>Phí ship</span><span>{formatPrice(order.shipping_fee)}</span></div>
                      <div className="flex justify-between font-bold text-textMain text-sm pt-1 border-t border-border"><span>Tổng</span><span className="text-primary">{formatPrice(order.total_amount)}</span></div>
                    </div>

                    {/* Action buttons */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div className="flex gap-2">
                        <Button variant="surface" size="sm" className="flex-1"
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          loading={updating === order.id}>
                          <X className="w-3.5 h-3.5" /> Hủy đơn
                        </Button>
                        {cfg.nextStatus && (
                          <Button size="sm" className="flex-2 flex-1"
                            onClick={() => handleUpdateStatus(order.id, cfg.nextStatus!)}
                            loading={updating === order.id}>
                            <Check className="w-3.5 h-3.5" /> {cfg.nextLabel}
                          </Button>
                        )}
                      </div>
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
