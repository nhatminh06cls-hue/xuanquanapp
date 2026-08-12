import Link from 'next/link'
import { MapPin, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/lib/types/database.types'

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ'
}

interface ProductCardProps {
  product: Product
  gardenName?: string
  distanceKm?: number
  onAddToCart?: (product: Product) => void
  className?: string
}

/**
 * Card sản phẩm — dùng ở trang chủ và trang search
 * Thiết kế theo prototype: ảnh trên, giá dưới, nút + góc phải
 */
export function ProductCard({
  product,
  gardenName,
  distanceKm,
  onAddToCart,
  className,
}: ProductCardProps) {
  const hasDiscount = product.original_price && product.original_price > product.retail_price
  const isLowStock = product.stock_quantity <= product.low_stock_threshold

  return (
    <div className={cn('bg-white rounded-2xl p-3 shadow-soft border border-surface-dark flex flex-col', className)}>
      {/* Ảnh */}
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative h-28 bg-surface-dark rounded-xl mb-3 overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🌸</div>
          )}

          {/* Badge khoảng cách */}
          {distanceKm !== undefined && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-bold text-primary shadow-sm flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {distanceKm.toFixed(1)}km
            </div>
          )}

          {/* Badge sắp hết */}
          {isLowStock && product.stock_quantity > 0 && (
            <div className="absolute top-2 left-2 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
              Còn {product.stock_quantity} {product.unit}
            </div>
          )}

          {/* Badge hết hàng */}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
              <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Hết hàng</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <Link href={`/product/${product.id}`} className="flex-1">
        <h3 className="text-sm font-bold text-textMain mb-0.5 line-clamp-1">{product.name}</h3>
        {gardenName && (
          <p className="text-[10px] text-textMuted mb-2 truncate">{gardenName}</p>
        )}
      </Link>

      {/* Giá + nút thêm */}
      <div className="flex justify-between items-center mt-auto">
        <div>
          <span className="font-bold text-primary text-sm">{formatPrice(product.retail_price)}</span>
          {hasDiscount && (
            <span className="text-[10px] text-textMuted line-through ml-1">
              {formatPrice(product.original_price!)}
            </span>
          )}
        </div>
        <button
          onClick={() => onAddToCart?.(product)}
          disabled={product.stock_quantity === 0}
          aria-label={`Thêm ${product.name} vào giỏ`}
          className="w-7 h-7 bg-surface-dark rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Skeleton placeholder khi đang load
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-3 border border-surface-dark">
      <div className="h-28 skeleton rounded-xl mb-3" />
      <div className="h-3 skeleton rounded mb-1.5 w-3/4" />
      <div className="h-2.5 skeleton rounded mb-3 w-1/2" />
      <div className="flex justify-between items-center">
        <div className="h-4 skeleton rounded w-16" />
        <div className="w-7 h-7 skeleton rounded-full" />
      </div>
    </div>
  )
}
