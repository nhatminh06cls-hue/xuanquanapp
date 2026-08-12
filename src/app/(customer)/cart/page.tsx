'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBasket, Minus, Plus, Trash2, ChevronLeft, Store } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cartStore'
import { Button } from '@/components/ui/button'

function formatPrice(p: number) {
  return p.toLocaleString('vi-VN') + 'đ'
}

export default function CartPage() {
  const router = useRouter()
  const { items, totalItems, totalAmount, updateQuantity, removeItem, clearCart } = useCartStore()

  // Group by garden
  const groups = items.reduce((acc, item) => {
    const gId = item.product.garden_id
    if (!acc[gId]) acc[gId] = { gardenName: (item.product as any).garden?.name ?? 'Nhà vườn', items: [] }
    acc[gId].items.push(item)
    return acc
  }, {} as Record<string, { gardenName: string; items: typeof items }>)

  if (totalItems === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-surface">
        <div className="w-20 h-20 bg-surface-dark rounded-full flex items-center justify-center mb-4">
          <ShoppingBasket className="w-10 h-10 text-textMuted" />
        </div>
        <h2 className="font-bold text-lg text-textMain mb-2">Giỏ hàng trống</h2>
        <p className="text-sm text-textMuted mb-6">Khám phá hoa tươi và thêm vào giỏ ngay!</p>
        <Button onClick={() => router.push('/')} className="px-8">Khám phá ngay</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-textMain">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base text-textMain flex-1">Giỏ hàng</h1>
          <span className="text-xs text-textMuted">{totalItems} sản phẩm</span>
          <button onClick={() => { if (confirm('Xóa toàn bộ giỏ hàng?')) clearCart() }}
            className="text-danger text-xs font-bold hover:underline ml-2">Xóa tất cả</button>
        </div>
      </div>

      <div className="px-4 py-4 pb-36 space-y-4">
        {Object.entries(groups).map(([gardenId, group]) => {
          const groupTotal = group.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
          return (
            <div key={gardenId} className="bg-white rounded-2xl border border-surface-dark shadow-soft overflow-hidden">
              {/* Garden header */}
              <div className="px-4 py-3 border-b border-surface-dark flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-textMain">{group.gardenName}</span>
              </div>

              {/* Items */}
              <div className="divide-y divide-surface-dark">
                {group.items.map((item) => (
                  <div key={item.product.id} className="p-4 flex gap-3">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-dark flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-textMain line-clamp-1">{item.product.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-primary">{formatPrice(item.unit_price)}</span>
                        {item.is_wholesale && (
                          <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">Giá sỉ</span>
                        )}
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-surface border border-border rounded-full overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-danger transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-sm font-bold text-textMain">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-primary transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-textMain">{formatPrice(item.unit_price * item.quantity)}</span>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-textMuted hover:text-danger transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Group subtotal */}
              <div className="px-4 py-3 bg-surface border-t border-surface-dark flex justify-between items-center">
                <span className="text-xs text-textMuted">Tổng nhà vườn</span>
                <span className="text-sm font-bold text-primary">{formatPrice(groupTotal)}</span>
              </div>
            </div>
          )
        })}

        {/* Wholesale hint */}
        {items.some(i => !i.is_wholesale && i.product.allow_wholesale && i.product.wholesale_min_qty) && (
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-3 text-xs text-textMuted">
            💡 <span className="font-semibold text-primary">Mẹo:</span> Tăng số lượng để được áp dụng giá sỉ tự động!
          </div>
        )}
      </div>

      {/* Fixed bottom checkout bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border px-4 py-3 safe-bottom z-30">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-textMuted font-medium">Tổng cộng ({totalItems} sp)</span>
          <span className="text-lg font-bold text-primary">{formatPrice(totalAmount)}</span>
        </div>
        <Link href="/checkout">
          <Button className="w-full h-12 text-base">Tiến hành thanh toán →</Button>
        </Link>
      </div>
    </div>
  )
}
