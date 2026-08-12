'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, EyeOff, Edit3, Package, TrendingUp, AlertCircle } from 'lucide-react'
import { getMyGarden, getVendorProducts, toggleProductStatus } from '@/lib/actions/vendor'
import type { Product } from '@/lib/types/database.types'

function formatPrice(p: number) {
  return Number(p).toLocaleString('vi-VN') + 'đ'
}

export default function VendorProductsPage() {
  const [garden, setGarden]       = useState<any>(null)
  const [products, setProducts]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const [filter, setFilter]       = useState<'all' | 'active' | 'inactive' | 'lowstock'>('all')
  const [toggling, setToggling]   = useState<string | null>(null)

  useEffect(() => {
    getMyGarden().then(async (g) => {
      setGarden(g)
      if (g) {
        const data = await getVendorProducts(g.id) as unknown as Product[]
        setProducts(data)
      }
      setLoading(false)
    })
  }, [])

  async function handleToggle(product: Product) {
    setToggling(product.id)
    await toggleProductStatus(product.id, !product.is_active)
    setProducts(prev => prev.map(p =>
      p.id === product.id ? { ...p, is_active: !p.is_active } : p
    ))
    setToggling(null)
  }

  const filtered = products.filter(p => {
    const matchQuery = p.name.toLowerCase().includes(query.toLowerCase())
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? p.is_active :
      filter === 'inactive' ? !p.is_active :
      /* lowstock */          p.stock_quantity > 0 && p.stock_quantity < p.low_stock_threshold
    return matchQuery && matchFilter
  })

  // Stats
  const totalActive   = products.filter(p => p.is_active).length
  const totalInactive = products.filter(p => !p.is_active).length
  const lowStock      = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < p.low_stock_threshold).length
  const outOfStock    = products.filter(p => p.stock_quantity === 0).length

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <div className="bg-white border-b border-border px-5 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-bold text-textMain">Sản phẩm của tôi</h1>
          <Link href="/products/new"
            className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/90 transition active:scale-95">
            <Plus className="w-3.5 h-3.5" /> Thêm mới
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 focus-within:border-primary transition mb-3">
          <Search className="w-4 h-4 text-textMuted flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="flex-1 text-sm bg-transparent outline-none text-textMain placeholder:text-textMuted/60"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {[
            { value: 'all',      label: `Tất cả (${products.length})` },
            { value: 'active',   label: `Đang bán (${totalActive})` },
            { value: 'inactive', label: `Tạm dừng (${totalInactive})` },
            { value: 'lowstock', label: `Sắp hết (${lowStock})` },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                filter === f.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white border-border text-textMuted'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-3 gap-3 px-4 pt-4">
          <div className="bg-white rounded-xl border border-border p-3 text-center shadow-soft">
            <p className="text-xl font-bold text-green-600">{totalActive}</p>
            <p className="text-[10px] text-textMuted font-semibold mt-0.5">Đang bán</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 text-center shadow-soft">
            <p className="text-xl font-bold text-orange-500">{lowStock}</p>
            <p className="text-[10px] text-textMuted font-semibold mt-0.5">Sắp hết hàng</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-3 text-center shadow-soft">
            <p className="text-xl font-bold text-red-500">{outOfStock}</p>
            <p className="text-[10px] text-textMuted font-semibold mt-0.5">Hết hàng</p>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-dark p-4 flex gap-3">
              <div className="w-16 h-16 skeleton rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton rounded w-2/3" />
                <div className="h-3 skeleton rounded w-1/3" />
                <div className="h-3 skeleton rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Package className="w-14 h-14 text-border mb-4" />
            <p className="font-bold text-textMain">
              {query ? `Không tìm thấy "${query}"` : 'Chưa có sản phẩm'}
            </p>
            <p className="text-sm text-textMuted mt-1 mb-6">
              {query ? 'Thử từ khóa khác' : 'Thêm sản phẩm đầu tiên để bắt đầu bán hàng'}
            </p>
            {!query && (
              <Link href="/products/new"
                className="bg-primary text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition flex items-center gap-2">
                <Plus className="w-4 h-4" /> Thêm sản phẩm
              </Link>
            )}
          </div>
        ) : (
          filtered.map(product => {
            const isLow    = product.stock_quantity > 0 && product.stock_quantity < product.low_stock_threshold
            const isOut    = product.stock_quantity === 0
            const imgSrc   = product.images?.[0]

            return (
              <div key={product.id}
                className={`bg-white rounded-2xl border shadow-soft overflow-hidden transition ${
                  product.is_active ? 'border-surface-dark' : 'border-border opacity-70'
                }`}>
                <div className="flex gap-3 p-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface border border-surface-dark">
                    {imgSrc ? (
                      <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-textMain leading-tight truncate">{product.name}</p>
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggle(product)}
                        disabled={toggling === product.id}
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition ${
                          product.is_active
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-surface text-textMuted hover:bg-surface-dark'
                        } ${toggling === product.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={product.is_active ? 'Đang bán — nhấn để tạm dừng' : 'Đang tạm dừng — nhấn để bán'}
                      >
                        {toggling === product.id
                          ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : product.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-primary">{formatPrice(product.retail_price)}</span>
                      {product.original_price && product.original_price > product.retail_price && (
                        <span className="text-[11px] text-textMuted line-through">{formatPrice(product.original_price)}</span>
                      )}
                      {product.allow_wholesale && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Có bán sỉ</span>
                      )}
                    </div>

                    {/* Stock badge */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {isOut ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Hết hàng
                        </span>
                      ) : isLow ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Còn {product.stock_quantity} {product.unit}
                        </span>
                      ) : (
                        <span className="text-[11px] text-textMuted">Kho: {product.stock_quantity} {product.unit}</span>
                      )}

                      <span className="text-[11px] text-textMuted">
                        · <TrendingUp className="w-2.5 h-2.5 inline" /> {product.sold_count ?? 0} đã bán
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="border-t border-surface-dark flex divide-x divide-surface-dark">
                  <Link href={`/inventory`}
                    className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-textMuted hover:bg-surface hover:text-textMain transition">
                    <Package className="w-3.5 h-3.5" /> Cập nhật kho
                  </Link>
                  <Link href={`/products/new?edit=${product.id}`}
                    className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-textMuted hover:bg-surface hover:text-textMain transition">
                    <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
