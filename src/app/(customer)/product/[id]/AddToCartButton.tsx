'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cartStore'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/lib/types/database.types'

/**
 * Client component tách riêng để trang SP có thể là Server Component
 * Xử lý add to cart với quantity picker
 */
export function AddToCartButton({ product, disabled }: { product: Product; disabled?: boolean }) {
  const addItem = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const isWholesaleEligible =
    product.allow_wholesale &&
    product.wholesale_min_qty !== null &&
    qty >= product.wholesale_min_qty!

  function handleAdd() {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="flex-1 flex items-center gap-2">
      {/* Quantity stepper */}
      <div className="flex items-center bg-surface border border-border rounded-xl h-12">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="w-10 h-full flex items-center justify-center text-textMuted hover:text-primary transition"
          aria-label="Giảm"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-sm font-bold text-textMain">{qty}</span>
        <button
          onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}
          className="w-10 h-full flex items-center justify-center text-primary hover:text-primary-600 transition"
          aria-label="Tăng"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Wholesale hint */}
      {isWholesaleEligible && (
        <div className="hidden sm:block text-[10px] text-primary font-bold bg-primary/10 px-2 py-1 rounded">
          Giá sỉ!
        </div>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        disabled={disabled}
        className={cn(
          'flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-all duration-300',
          added
            ? 'bg-success text-white'
            : disabled
              ? 'bg-border text-textMuted cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-600 active:scale-[0.97]'
        )}
      >
        {added ? (
          <><Check className="w-4 h-4" /> Đã thêm!</>
        ) : (
          <><ShoppingCart className="w-4 h-4" /> Mua online</>
        )}
      </button>
    </div>
  )
}
