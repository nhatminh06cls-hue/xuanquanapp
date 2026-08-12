'use client'

import { ProductCard } from '@/components/customer/ProductCard'
import { useCartStore } from '@/lib/stores/cartStore'
import type { Product } from '@/lib/types/database.types'

/**
 * Wrapper client component để truyền onAddToCart vào ProductCard
 * Tách riêng để homepage (Server Component) không bị lỗi
 */
export function HomeProductCard({
  product,
  gardenName,
}: {
  product: Product & { garden?: { id: string; name: string } | null }
  gardenName?: string
}) {
  const addItem = useCartStore((s) => s.addItem)
  return (
    <ProductCard
      product={product}
      gardenName={gardenName}
      onAddToCart={addItem}
    />
  )
}
