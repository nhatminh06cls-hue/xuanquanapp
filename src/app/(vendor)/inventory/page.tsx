'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Package, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react'
import { getMyGarden, getVendorProducts, updateStock, toggleProductStatus } from '@/lib/actions/vendor'
import { Badge } from '@/components/ui/card'

function formatPrice(p: number) {
  return Number(p).toLocaleString('vi-VN') + 'đ'
}

export default function InventoryPage() {
  const [garden, setGarden]     = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [editQty, setEditQty]   = useState<Record<string, number>>({})
  const [saving, setSaving]     = useState<string | null>(null)

  useEffect(() => {
    getMyGarden().then(async (raw) => {
      const g = raw as any
      setGarden(g)
      if (g) {
        const p = await getVendorProducts(g.id)
        setProducts(p as any[])
        const qtyMap: Record<string, number> = {}
        p.forEach((prod: any) => { qtyMap[prod.id] = prod.stock_quantity })
        setEditQty(qtyMap)
      }
      setLoading(false)
    })
  }, [])

  async function handleSaveStock(productId: string) {
    if (!garden) return
    setSaving(productId)
    await updateStock(productId, editQty[productId], garden.id)
    const updated = await getVendorProducts(garden.id)
    setProducts(updated)
    setSaving(null)
  }

  async function handleToggle(productId: string, current: boolean) {
    await toggleProductStatus(productId, !current)
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !current } : p))
  }

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0)
  const outOfStock       = products.filter(p => p.stock_quantity === 0)

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 border-b border-border sticky top-0 z-10">
        <h1 className="text-lg font-bold text-textMain">Kho hàng</h1>
        <p className="text-xs text-textMuted mt-0.5">{products.length} sản phẩm · {outOfStock.length} hết hàng · {lowStockProducts.length} sắp hết</p>
      </div>

      <div className="px-4 py-4">
        {/* Alerts */}
        {(outOfStock.length > 0 || lowStockProducts.length > 0) && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-4 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-orange-800 mb-0.5">Cần nhập thêm hàng!</p>
              {outOfStock.length > 0 && <p className="text-orange-700">Hết hàng: {outOfStock.map(p => p.name).join(', ')}</p>}
              {lowStockProducts.length > 0 && <p className="text-orange-700">Sắp hết: {lowStockProducts.map(p => `${p.name} (còn ${p.stock_quantity})`).join(', ')}</p>}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-surface-dark">
                <div className="flex gap-3">
                  <div className="w-14 h-14 skeleton rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 skeleton rounded w-2/3 mb-2" />
                    <div className="h-3 skeleton rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product: any) => {
              const qty = editQty[product.id] ?? product.stock_quantity
              const hasChanged = qty !== product.stock_quantity
              const isLow = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0
              const isOut = product.stock_quantity === 0

              return (
                <div key={product.id} className={`bg-white rounded-2xl border shadow-soft overflow-hidden ${
                  isOut ? 'border-red-200' : isLow ? 'border-orange-200' : 'border-surface-dark'
                }`}>
                  <div className="p-4">
                    <div className="flex gap-3 mb-3">
                      {/* Product image */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-dark flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-textMain truncate">{product.name}</h3>
                        <p className="text-xs text-primary font-semibold">{formatPrice(product.retail_price)} / {product.unit}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {isOut  && <Badge variant="danger">Hết hàng</Badge>}
                          {isLow  && !isOut && <Badge variant="warning">Sắp hết</Badge>}
                          {!isOut && !isLow && <Badge variant="success">Còn hàng</Badge>}
                          {product.allow_wholesale && <Badge variant="primary">Có giá sỉ</Badge>}
                        </div>
                      </div>

                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggle(product.id, product.is_active)}
                        className="flex-shrink-0"
                        title={product.is_active ? 'Đang bán — nhấn để ẩn' : 'Đang ẩn — nhấn để hiện'}
                      >
                        {product.is_active
                          ? <ToggleRight className="w-6 h-6 text-primary" />
                          : <ToggleLeft className="w-6 h-6 text-textMuted" />}
                      </button>
                    </div>

                    {/* Stock editor */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-textMuted font-medium flex-shrink-0">Tồn kho:</span>
                      <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => setEditQty(prev => ({ ...prev, [product.id]: Math.max(0, (prev[product.id] ?? 0) - 1) }))}
                          className="w-9 h-9 flex items-center justify-center text-textMuted hover:text-danger hover:bg-red-50 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={qty}
                          onChange={e => setEditQty(prev => ({ ...prev, [product.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-12 text-center text-sm font-bold bg-transparent border-none outline-none text-textMain"
                        />
                        <button
                          onClick={() => setEditQty(prev => ({ ...prev, [product.id]: (prev[product.id] ?? 0) + 1 }))}
                          className="w-9 h-9 flex items-center justify-center text-textMuted hover:text-primary hover:bg-primary/5 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-textMuted">{product.unit}</span>

                      {hasChanged && (
                        <button
                          onClick={() => handleSaveStock(product.id)}
                          disabled={saving === product.id}
                          className="ml-auto bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-primary-600 transition"
                        >
                          {saving === product.id ? '...' : 'Lưu'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
