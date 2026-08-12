'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'

export type NegotiationStatus = 'pending' | 'countered' | 'accepted' | 'rejected' | 'expired' | 'ordered'

// ── Buyer: Tạo deal mới ──────────────────────────────────────
export async function createNegotiation(data: {
  product_id: string
  garden_id:  string
  quantity:   number
  unit:       string
  buyer_price: number
  buyer_note?: string
}) {
  const session = await getCurrentUser()
  if (!session) return { error: 'Bạn cần đăng nhập' }

  const supabase = await createClient()

  // Kiểm tra không tự deal với vườn của mình
  const { data: garden } = await supabase.from('gardens').select('owner_id').eq('id', data.garden_id).single()
  if ((garden as any)?.owner_id === session.user.id) return { error: 'Không thể tự deal với vườn của mình' }

  // Kiểm tra đã có deal pending/countered chưa
  const { data: existing } = await supabase
    .from('price_negotiations')
    .select('id, status')
    .eq('product_id', data.product_id)
    .eq('buyer_id', session.user.id)
    .in('status', ['pending', 'countered'])
    .maybeSingle()

  if (existing) return { error: 'Bạn đang có một deal chờ xử lý cho sản phẩm này', negotiation_id: (existing as any).id }

  const { data: neg, error } = await supabase.from('price_negotiations').insert({
    ...data,
    buyer_id: session.user.id,
  }).select('id').single()

  if (error) return { error: 'Không thể tạo deal: ' + error.message }

  // Gửi tin nhắn đầu tiên
  await supabase.from('negotiation_messages').insert({
    negotiation_id: (neg as any).id,
    sender_id:      session.user.id,
    sender_role:    'buyer',
    message_type:   'offer',
    content:        data.buyer_note || `Tôi muốn mua ${data.quantity} ${data.unit} với giá ${data.buyer_price.toLocaleString('vi-VN')}đ/${data.unit}`,
    offered_price:  data.buyer_price,
  })

  revalidatePath('/deals')
  return { success: true, negotiation_id: (neg as any).id }
}

// ── Seller: Phản giá (counter) ───────────────────────────────
export async function counterNegotiation(negotiationId: string, sellerPrice: number, sellerNote?: string) {
  const session = await getCurrentUser()
  if (!session) return { error: 'Bạn cần đăng nhập' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('price_negotiations')
    .update({ status: 'countered', seller_price: sellerPrice, seller_note: sellerNote ?? null, updated_at: new Date().toISOString() })
    .eq('id', negotiationId)
    .eq('status', 'pending')  // chỉ counter khi đang pending

  if (error) return { error: 'Không thể phản giá' }

  await supabase.from('negotiation_messages').insert({
    negotiation_id: negotiationId,
    sender_id:      session.user.id,
    sender_role:    'seller',
    message_type:   'counter',
    content:        sellerNote || `Tôi đề nghị giá ${sellerPrice.toLocaleString('vi-VN')}đ`,
    offered_price:  sellerPrice,
  })

  revalidatePath(`/deals/${negotiationId}`)
  return { success: true }
}

// ── Accept deal (cả buyer lẫn seller đều có thể accept) ──────
export async function acceptNegotiation(negotiationId: string) {
  const session = await getCurrentUser()
  if (!session) return { error: 'Bạn cần đăng nhập' }

  const supabase = await createClient()

  const { data: neg } = await supabase
    .from('price_negotiations')
    .select('*, product:products(name, unit, garden_id), buyer:profiles!buyer_id(full_name, phone)')
    .eq('id', negotiationId)
    .single()

  if (!neg) return { error: 'Không tìm thấy deal' }
  const n = neg as any

  // Giá chốt = seller_price nếu đã counter, ngược lại = buyer_price
  const finalPrice = n.seller_price ?? n.buyer_price

  // Cập nhật deal thành accepted
  await supabase.from('price_negotiations').update({
    status:      'accepted',
    final_price: finalPrice,
    updated_at:  new Date().toISOString(),
  }).eq('id', negotiationId)

  await supabase.from('negotiation_messages').insert({
    negotiation_id: negotiationId,
    sender_id:      session.user.id,
    sender_role:    n.buyer_id === session.user.id ? 'buyer' : 'seller',
    message_type:   'accept',
    content:        `✅ Đã chốt! Giá ${finalPrice.toLocaleString('vi-VN')}đ × ${n.quantity} ${n.unit}`,
  })

  // Tự động tạo đơn hàng
  const { data: order, error: orderError } = await supabase.from('orders').insert({
    customer_id:      n.buyer_id,
    garden_id:        n.garden_id,
    order_type:       'wholesale',
    delivery_name:    n.buyer?.full_name ?? '',
    delivery_phone:   n.buyer?.phone ?? '',
    delivery_address: '',  // buyer điền sau khi vào trang order
    subtotal:         finalPrice * n.quantity,
    shipping_fee:     30000,
    total_amount:     finalPrice * n.quantity + 30000,
    payment_method:   'bank_transfer',
    payment_status:   'pending',
    note:             `Deal ID: ${negotiationId}`,
  }).select('id').single()

  if (!orderError && order) {
    // Thêm order item
    await supabase.from('order_items').insert({
      order_id:      (order as any).id,
      product_id:    n.product_id,
      product_name:  n.product?.name ?? '',
      unit_price:    finalPrice,
      is_wholesale:  true,
      quantity:      n.quantity,
      subtotal:      finalPrice * n.quantity,
    })

    // Link order vào deal
    await supabase.from('price_negotiations').update({
      status:   'ordered',
      order_id: (order as any).id,
    }).eq('id', negotiationId)
  }

  revalidatePath(`/deals/${negotiationId}`)
  revalidatePath('/account/orders')
  return { success: true, order_id: (order as any)?.id }
}

// ── Reject deal ──────────────────────────────────────────────
export async function rejectNegotiation(negotiationId: string, reason?: string) {
  const session = await getCurrentUser()
  if (!session) return { error: 'Bạn cần đăng nhập' }

  const supabase = await createClient()

  await supabase.from('price_negotiations').update({
    status:     'rejected',
    updated_at: new Date().toISOString(),
  }).eq('id', negotiationId)

  const { data: { user } } = await supabase.auth.getUser()
  const { data: neg } = await supabase.from('price_negotiations').select('buyer_id').eq('id', negotiationId).single()
  
  await supabase.from('negotiation_messages').insert({
    negotiation_id: negotiationId,
    sender_id:      session.user.id,
    sender_role:    (neg as any)?.buyer_id === session.user.id ? 'buyer' : 'seller',
    message_type:   'reject',
    content:        reason || '❌ Deal đã bị từ chối',
  })

  revalidatePath(`/deals/${negotiationId}`)
  return { success: true }
}

// ── Gửi offer giá (cả buyer lẫn seller) ─────────────────────
export async function sendPriceOffer(
  negotiationId: string,
  offeredPrice:  number,
  role:          'buyer' | 'seller',
  note?:         string
) {
  const session = await getCurrentUser()
  if (!session) return { error: 'Bạn cần đăng nhập' }

  const supabase = await createClient()

  // Cập nhật giá trong bảng chính
  const updateField = role === 'buyer' ? { buyer_price: offeredPrice, status: 'countered' }
                                       : { seller_price: offeredPrice, status: 'countered' }

  await supabase.from('price_negotiations')
    .update({ ...updateField, updated_at: new Date().toISOString() })
    .eq('id', negotiationId)

  // Ghi vào messages
  await supabase.from('negotiation_messages').insert({
    negotiation_id: negotiationId,
    sender_id:      session.user.id,
    sender_role:    role,
    message_type:   role === 'buyer' ? 'offer' : 'counter',
    content:        note || `${role === 'buyer' ? 'Buyer' : 'Seller'} đề nghị ${offeredPrice.toLocaleString('vi-VN')}đ`,
    offered_price:  offeredPrice,
  })

  revalidatePath(`/deals/${negotiationId}`)
  return { success: true }
}

// ── Gửi tin nhắn thường ─────────────────────────────────────
export async function sendNegotiationMessage(negotiationId: string, content: string, role: 'buyer' | 'seller') {
  const session = await getCurrentUser()
  if (!session) return { error: 'Bạn cần đăng nhập' }

  const supabase = await createClient()
  await supabase.from('negotiation_messages').insert({
    negotiation_id: negotiationId,
    sender_id:      session.user.id,
    sender_role:    role,
    message_type:   'text',
    content,
  })

  return { success: true }
}

// ── Lấy danh sách deal của buyer ─────────────────────────────
export async function getMyNegotiations() {
  const session = await getCurrentUser()
  if (!session) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('price_negotiations')
    .select(`
      id, status, quantity, unit, buyer_price, seller_price, final_price,
      created_at, updated_at, expires_at,
      product:products(id, name, images),
      garden:gardens(id, name, avatar_url)
    `)
    .eq('buyer_id', session.user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  return (data ?? []) as any[]
}

// ── Lấy deal chi tiết (kèm messages) ────────────────────────
export async function getNegotiationDetail(id: string) {
  const session = await getCurrentUser()
  if (!session) return null

  const supabase = await createClient()
  const [negRes, msgsRes] = await Promise.all([
    supabase.from('price_negotiations').select(`
      id, status, quantity, unit, buyer_price, seller_price, final_price,
      buyer_note, seller_note, created_at, expires_at, order_id,
      product:products(id, name, images, retail_price, wholesale_price, unit),
      garden:gardens(id, name, avatar_url, phone),
      buyer:profiles!buyer_id(id, full_name, avatar_url)
    `).eq('id', id).single(),
    supabase.from('negotiation_messages').select('*').eq('negotiation_id', id).order('created_at'),
  ])

  if (!negRes.data) return null
  return { negotiation: negRes.data as any, messages: msgsRes.data ?? [] }
}

// ── Seller: Lấy deals thuộc vườn ─────────────────────────────
export async function getGardenNegotiations(gardenId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('price_negotiations')
    .select(`
      id, status, quantity, unit, buyer_price, seller_price, final_price,
      created_at, updated_at,
      product:products(id, name, images),
      buyer:profiles!buyer_id(id, full_name, avatar_url, phone)
    `)
    .eq('garden_id', gardenId)
    .order('updated_at', { ascending: false })
    .limit(50)

  return (data ?? []) as any[]
}
