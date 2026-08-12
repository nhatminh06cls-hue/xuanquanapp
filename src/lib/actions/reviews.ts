'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'

// ── Gửi đánh giá ─────────────────────────────────────────────
export async function submitReview(formData: FormData) {
  const session = await getCurrentUser()
  if (!session) return { error: 'Bạn cần đăng nhập để đánh giá' }

  const product_id = formData.get('product_id') as string
  const order_id   = formData.get('order_id')   as string | null
  const rating     = parseInt(formData.get('rating') as string)
  const content    = (formData.get('content') as string)?.trim() || null

  if (!product_id || !rating || rating < 1 || rating > 5) {
    return { error: 'Dữ liệu không hợp lệ' }
  }

  const supabase = await createClient()

  // Kiểm tra đã đánh giá chưa
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', product_id)
    .eq('customer_id', session.user.id)
    .maybeSingle()

  if (existing) {
    // Cập nhật đánh giá cũ
    const { error } = await supabase
      .from('reviews')
      .update({ rating, content })
      .eq('id', existing.id)
    if (error) return { error: 'Không thể cập nhật đánh giá' }
  } else {
    // Tạo đánh giá mới
    const { error } = await supabase.from('reviews').insert({
      product_id,
      customer_id: session.user.id,
      order_id: order_id || null,
      rating,
      content,
    })
    if (error) return { error: 'Không thể gửi đánh giá: ' + error.message }
  }

  // Cập nhật rating trung bình trên bảng products
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', product_id)

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await supabase
      .from('products')
      .update({ rating: Math.round(avg * 10) / 10, review_count: allReviews.length })
      .eq('id', product_id)
  }

  revalidatePath(`/product/${product_id}`)
  revalidatePath('/account/orders')
  return { success: true }
}

// ── Lấy review của sản phẩm ──────────────────────────────────
export async function getProductReviews(productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select(`
      id, rating, content, created_at,
      customer:profiles(id, full_name, avatar_url)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

// ── Kiểm tra user đã mua sản phẩm chưa ──────────────────────
export async function checkCanReview(productId: string): Promise<{ canReview: boolean; orderId: string | null; existingReview: any | null }> {
  const session = await getCurrentUser()
  if (!session) return { canReview: false, orderId: null, existingReview: null }

  const supabase = await createClient()

  // Kiểm tra đã mua (có order_item với product_id này, đơn đã delivered)
  const { data: orderItem } = await supabase
    .from('order_items')
    .select('order_id, orders!inner(id, status, customer_id)')
    .eq('product_id', productId)
    .eq('orders.customer_id', session.user.id)
    .eq('orders.status', 'delivered')
    .limit(1)
    .maybeSingle()

  // Kiểm tra review hiện tại
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id, rating, content')
    .eq('product_id', productId)
    .eq('customer_id', session.user.id)
    .maybeSingle()

  return {
    canReview: !!orderItem,
    orderId: (orderItem as any)?.order_id ?? null,
    existingReview,
  }
}

// ── Lấy đơn hàng cần đánh giá ────────────────────────────────
export async function getOrdersToReview() {
  const session = await getCurrentUser()
  if (!session) return []

  const supabase = await createClient()

  // Lấy order_items từ đơn đã giao, chưa đánh giá
  const { data } = await supabase
    .from('order_items')
    .select(`
      id, product_id, product_name, product_image, unit_price,
      order:orders!inner(id, status, customer_id, created_at)
    `)
    .eq('order.customer_id', session.user.id)
    .eq('order.status', 'delivered')
    .limit(50)

  if (!data?.length) return []

  // Lọc ra sản phẩm chưa đánh giá
  const productIds = data.map(d => d.product_id)
  const { data: reviewed } = await supabase
    .from('reviews')
    .select('product_id')
    .eq('customer_id', session.user.id)
    .in('product_id', productIds)

  const reviewedIds = new Set(reviewed?.map(r => r.product_id) ?? [])
  return data.filter(d => !reviewedIds.has(d.product_id))
}
