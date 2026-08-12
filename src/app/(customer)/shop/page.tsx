'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, X, SlidersHorizontal, ShoppingCart } from 'lucide-react'
import { searchProducts, getCategories } from '@/lib/actions/products'
import { ProductCard, ProductCardSkeleton } from '@/components/customer/ProductCard'
import { useCartStore } from '@/lib/stores/cartStore'
import type { Category, Product } from '@/lib/types/database.types'

const PRICE_RANGES = [
  { label: 'Dưới 100k',   min: 0,      max: 100000  },
  { label: '100k–300k',   min: 100000, max: 300000  },
  { label: '300k–500k',   min: 300000, max: 500000  },
  { label: 'Trên 500k',   min: 500000, max: undefined },
]

export default function ShopPage() {
  const addItem  = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  const [query,       setQuery]       = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [priceRange,  setPriceRange]  = useState(-1)
  const [showFilters, setShowFilters] = useState(false)
  const [categories,  setCategories]  = useState<Category[]>([])
  const [products,    setProducts]    = useState<Product[]>([])
  const [total,       setTotal]       = useState(0)
  const [isLoading,   setIsLoading]   = useState(false)

  useEffect(() => { getCategories().then(setCategories) }, [])

  const doSearch = useCallback(async () => {
    setIsLoading(true)
    const range = PRICE_RANGES[priceRange]
    const { products: p, total: t } = await searchProducts({
      query,
      categoryId: categoryId || undefined,
      minPrice: range?.min,
      maxPrice: range?.max,
    })
    setProducts(p as any)
    setTotal(t)
    setIsLoading(false)
  }, [query, categoryId, priceRange])

  useEffect(() => {
    const t = setTimeout(doSearch, 350)
    return () => clearTimeout(t)
  }, [doSearch])

  const hasFilters = !!categoryId || priceRange >= 0

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="pt-14 pb-3 px-5">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-serif font-bold text-textMain">Mua sắm</h1>
            <div className="flex items-center gap-2">
              {/* Giỏ hàng */}
              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 bg-primary/8 hover:bg-primary/15 border border-primary/20 text-primary px-3 py-1.5 rounded-xl text-xs font-bold transition"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Giỏ hàng
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              {/* Lọc */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  hasFilters
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-textMuted border-border'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Lọc{hasFilters ? ` (${(categoryId ? 1 : 0) + (priceRange >= 0 ? 1 : 0)})` : ''}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-white border border-border rounded-2xl px-4 py-3 focus-within:border-primary transition shadow-sm">
            <Search className="w-4 h-4 text-textMuted flex-shrink-0" />
            <input
              autoComplete="off"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm hoa hồng, lan hồ điệp, cây cảnh..."
              className="flex-1 bg-transparent outline-none text-sm text-textMain placeholder:text-textMuted/50"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-textMuted hover:text-textMain transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3 pb-0.5">
            <button
              onClick={() => setCategoryId('')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition flex-shrink-0 ${
                !categoryId ? 'bg-primary text-white border-primary' : 'bg-white border-border text-textMuted'
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition flex-shrink-0 ${
                  categoryId === cat.id
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-white border-border text-textMuted'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-5 pb-4 border-t border-border bg-white">
            <p className="text-xs font-bold text-textMuted uppercase tracking-wide pt-3 mb-2">Khoảng giá</p>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setPriceRange(priceRange === i ? -1 : i)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                    priceRange === i
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface border-border text-textMuted hover:border-primary/30'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {hasFilters && (
              <button
                onClick={() => { setCategoryId(''); setPriceRange(-1) }}
                className="mt-3 text-xs text-red-500 font-bold underline underline-offset-2"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div className="px-5 py-4 pb-28">
        <p className="text-xs text-textMuted font-semibold mb-4">
          {isLoading ? 'Đang tìm...' : `${total} sản phẩm`}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map((i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                gardenName={(p as any).garden?.name}
                onAddToCart={addItem}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔍</span>
            <p className="font-bold text-textMain mb-1">Không tìm thấy sản phẩm</p>
            <p className="text-sm text-textMuted">Thử tìm với từ khóa khác</p>
          </div>
        )}
      </div>
    </div>
  )
}
