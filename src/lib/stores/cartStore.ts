import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, CartGroup, Product } from '@/lib/types/database.types'

interface CartState {
  items: CartItem[]

  // Computed (getters)
  totalItems: number
  totalAmount: number
  cartGroups: CartGroup[]

  // Actions
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  clearGardenItems: (gardenId: string) => void
}

/**
 * Zustand store cho giỏ hàng
 * Tự động persist vào localStorage
 *
 * Logic giá sỉ: nếu quantity >= wholesale_min_qty → áp wholesale_price
 */
function resolvePrice(product: Product, quantity: number): { price: number; isWholesale: boolean } {
  if (
    product.allow_wholesale &&
    product.wholesale_price !== null &&
    product.wholesale_min_qty !== null &&
    quantity >= product.wholesale_min_qty
  ) {
    return { price: product.wholesale_price, isWholesale: true }
  }
  return { price: product.retail_price, isWholesale: false }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // ── Computed ──────────────────────────────────────────
      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get totalAmount() {
        return get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
      },

      get cartGroups(): CartGroup[] {
        const { items } = get()
        const groupMap = new Map<string, CartGroup>()

        for (const item of items) {
          const gId = item.product.garden_id
          if (!groupMap.has(gId)) {
            // Cần garden object — tạm thời dùng garden_id
            // Trong thực tế sẽ fetch garden khi mount CartPage
            groupMap.set(gId, {
              garden: { id: gId } as any,
              items: [],
              subtotal: 0,
            })
          }
          const group = groupMap.get(gId)!
          group.items.push(item)
          group.subtotal += item.unit_price * item.quantity
        }

        return Array.from(groupMap.values())
      },

      // ── Actions ───────────────────────────────────────────
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id)

          if (existing) {
            const newQty = existing.quantity + quantity
            const { price, isWholesale } = resolvePrice(product, newQty)
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: newQty, unit_price: price, is_wholesale: isWholesale }
                  : i
              ),
            }
          }

          const { price, isWholesale } = resolvePrice(product, quantity)
          return {
            items: [
              ...state.items,
              { product, quantity, unit_price: price, is_wholesale: isWholesale },
            ],
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.product.id !== productId) return i
            const { price, isWholesale } = resolvePrice(i.product, quantity)
            return { ...i, quantity, unit_price: price, is_wholesale: isWholesale }
          }),
        }))
      },

      clearCart: () => set({ items: [] }),

      clearGardenItems: (gardenId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.garden_id !== gardenId),
        }))
      },
    }),
    {
      name: 'xuanquan-cart',
      storage: createJSONStorage(() => localStorage),
      // Chỉ persist items, không persist computed
      partialize: (state) => ({ items: state.items }),
    }
  )
)
