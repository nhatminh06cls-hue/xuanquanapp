'use server'

import { createClient } from '@/lib/supabase/server'

// ── Lấy đơn hàng của customer ──────────────────────────────
export async function getMyOrders(limit = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await (supabase as any)
    .from('orders')
    .select(`
      id, status, total_amount, subtotal, shipping_fee,
      payment_method, created_at,
      delivery_name, delivery_phone, delivery_address,
      order_items(id, product_name, quantity, unit_price, subtotal, is_wholesale,
        product:products(images))
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

// ── Lấy chi tiết 1 đơn ────────────────────────────────────
export async function getOrderById(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await (supabase as any)
    .from('orders')
    .select(`
      *, 
      order_items(*, product:products(name, images)),
      garden:gardens(name, phone, address)
    `)
    .eq('id', orderId)
    .eq('customer_id', user.id)
    .single()

  return data
}
