'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, SlidersHorizontal, MapPin } from 'lucide-react'
import { searchProducts, getCategories } from '@/lib/actions/products'
import { ProductCard, ProductCardSkeleton } from '@/components/customer/ProductCard'
import { TopBar } from '@/components/shared/TopBar'
import { Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/stores/cartStore'
import type { Category, Product } from '@/lib/types/database.types'

const PRICE_RANGES = [
  { label: 'Dưới 100k',     min: 0,       max: 100000 },
  { label: '100k – 300k',   min: 100000,  max: 300000 },
  { label: '300k – 500k',   min: 300000,  max: 500000 },
  { label: 'Trên 500k',     min: 500000,  max: undefined },
]

function SearchPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const addItem = useCartStore((s) => s.addItem)

  const [query, setQuery]               = useState(params.get('q') ?? '')
  const [categoryId, setCategoryId]     = useState(params.get('categoryId') ?? '')
  const [gardenId]                      = useState(params.get('gardenId') ?? '')  // read-only từ URL
  const [gardenName, setGardenName]     = useState(params.get('gardenName') ?? '')
  const [priceRange, setPriceRange]     = useState<number>(-1)
  const [showFilters, setShowFilters]   = useState(false)
  const [categories, setCategories]     = useState<Category[]>([])
  const [products, setProducts]         = useState<Product[]>([])
  const [total, setTotal]               = useState(0)
  const [isLoading, setIsLoading]       = useState(false)

  // Load categories once
  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  // Debounced search
  const doSearch = useCallback(async () => {
    setIsLoading(true)
    const range = PRICE_RANGES[priceRange]
    const { products: p, total: t } = await searchProducts({
      query,
      categoryId: categoryId || undefined,
      gardenId: gardenId || undefined,
      minPrice: range?.min,
      maxPrice: range?.max,
    })
    setProducts(p as any)
    setTotal(t)
    setIsLoading(false)
  }, [query, categoryId, gardenId, priceRange])

  useEffect(() => {
    const timer = setTimeout(doSearch, 400)
    return () => clearTimeout(timer)
  }, [doSearch])

  const clearFilters = () => {
    setQuery('')
    setCategoryId('')
    setPriceRange(-1)
  }

  const hasActiveFilters = categoryId || priceRange >= 0

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white z-20 shadow-sm">
        <div className="pt-14 pb-3 px-5">
          {/* Search input */}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => router.back()} className="text-textMain flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5 focus-within:border-primary transition">
              <Search className="w-4 h-4 text-textMuted flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hoa hồng, lan hồ điệp..."
                className="flex-1 bg-transparent outline-none text-sm text-textMain placeholder:text-textMuted/60"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-textMuted">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition ${
                hasActiveFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-textMuted'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Category chips - ẩn khi đang lọc theo vườn */}
          {!gardenId && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setCategoryId('')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition ${
                !categoryId ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-textMuted'
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition ${
                  categoryId === cat.id
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-surface border-border text-textMuted'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-5 pb-4 border-t border-border bg-surface">
            <div className="pt-3">
              <p className="text-xs font-bold text-textMuted uppercase mb-2">Khoảng giá</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((range, i) => (
                  <button
                    key={i}
                    onClick={() => setPriceRange(priceRange === i ? -1 : i)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                      priceRange === i
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-border text-textMuted hover:border-primary/30'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-3 text-xs text-danger font-bold underline underline-offset-2">
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Garden filter banner */}
      {gardenId && (
        <div className="mx-5 mt-4 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-primary">🌸 Đang xem sản phẩm của vườn</p>
            <p className="text-sm font-bold text-textMain mt-0.5">{gardenName || 'Nhà vườn'}</p>
          </div>
          <button onClick={() => router.push('/map')}
            className="text-[11px] text-primary font-bold underline underline-offset-2">
            Xem tất cả →
          </button>
        </div>
      )}

      {/* Results */}
      <div className="px-5 py-4">

        <p className="text-xs text-textMuted font-semibold mb-4">
          {isLoading ? 'Đang tìm...' : `${total} kết quả phù hợp`}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🔍</span>
            <p className="font-bold text-textMain mb-1">Không tìm thấy kết quả</p>
            <p className="text-sm text-textMuted">Thử tìm với từ khóa khác hoặc xóa bộ lọc</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-textMuted text-sm">Đang tải...</div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}
