'use client'

import { ProductCard } from '@/components/customer/ProductCard'
import { useCartStore } from '@/lib/stores/cartStore'

interface Props {
  products: any[]
  gardenName: string
}

export function GardenProductGrid({ products, gardenName }: Props) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          gardenName={gardenName}
          onAddToCart={addItem}
        />
      ))}
    </div>
  )
}
