'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'

// ── Lấy garden của vendor hiện tại ────────────────────────
export async function getMyGarden() {
  const session = await getCurrentUser()
  if (!session) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('gardens')
    .select('*')
    .eq('owner_id', session.user.id)
    .single()
  return data
}

// ── Dashboard stats ────────────────────────────────────────
export async function getDashboardStats(gardenId: string) {
  const supabase = await createClient()

  const [ordersRes, revenueRes, productsRes, lowStockRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('garden_id', gardenId).eq('status', 'pending'),
    supabase.from('orders').select('total_amount').eq('garden_id', gardenId).eq('payment_status', 'paid'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('garden_id', gardenId).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('garden_id', gardenId).gt('stock_quantity', 0).lt('stock_quantity', 10),
  ])

  const totalRevenue = (revenueRes.data ?? []).reduce((s: number, o: any) => s + Number(o.total_amount), 0)

  return {
    pendingOrders: ordersRes.count ?? 0,
    totalRevenue,
    activeProducts: productsRes.count ?? 0,
    lowStockProducts: lowStockRes.count ?? 0,
  }
}

// ── Lấy đơn hàng của garden ────────────────────────────────
export async function getGardenOrders(gardenId: string, status?: string) {
  const supabase = await createClient()
  let q = supabase
    .from('orders')
    .select(`*, order_items(*, product:products(name, images)), customer:profiles(full_name, phone)`)
    .eq('garden_id', gardenId)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') q = q.eq('status', status)

  const { data } = await q
  return data ?? []
}

// ── Cập nhật trạng thái đơn ───────────────────────────────
export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return { error: error.message }
  revalidatePath('/orders')
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Lấy sản phẩm trong kho ────────────────────────────────
export async function getVendorProducts(gardenId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name, slug)')
    .eq('garden_id', gardenId)
    .order('created_at', { ascending: false })
  return data ?? []
}

// ── Cập nhật số lượng kho ──────────────────────────────────
export async function updateStock(productId: string, newQty: number, gardenId: string, note?: string) {
  const supabase = await createClient()

  // Lấy stock hiện tại
  const { data: product } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single() as any

  if (!product) return { error: 'Không tìm thấy sản phẩm' }

  const diff = newQty - (product as any).stock_quantity
  const action = diff > 0 ? 'restock' : 'adjustment'

  // Cập nhật stock
  await (supabase as any).from('products').update({ stock_quantity: newQty }).eq('id', productId)

  // Ghi log
  await (supabase as any).from('inventory_logs').insert({
    product_id: productId,
    garden_id: gardenId,
    action,
    quantity: diff,
    note: note ?? (diff > 0 ? 'Nhập kho thủ công' : 'Điều chỉnh kho'),
  })

  revalidatePath('/inventory')
  return { success: true }
}

// ── Toggle trạng thái sản phẩm ────────────────────────────
export async function toggleProductStatus(productId: string, isActive: boolean) {
  const supabase = await createClient()
  await (supabase as any).from('products').update({ is_active: isActive }).eq('id', productId)
  revalidatePath('/inventory')
  revalidatePath('/products')
}

// ── Báo cáo thuế ──────────────────────────────────────────
export async function getTaxReport(gardenId: string, from: string, to: string) {
  const supabase = await createClient()

  // Doanh thu từ đơn đã giao
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(product_name, quantity, unit_price, is_wholesale, subtotal)')
    .eq('garden_id', gardenId)
    .eq('status', 'delivered')
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at')

  // Nhập kho trong kỳ
  const { data: restocks } = await supabase
    .from('inventory_logs')
    .select('*, product:products(name)')
    .eq('garden_id', gardenId)
    .eq('action', 'restock')
    .gte('created_at', from)
    .lte('created_at', to)

  const totalRevenue   = (orders ?? []).reduce((s, o: any) => s + Number(o.total_amount), 0)
  const totalOrders    = (orders ?? []).length
  const totalRestockCost = (restocks ?? []).reduce((s, r: any) => s + Math.abs(r.quantity) * (r.unit_cost ?? 0), 0)
  const estimatedProfit = totalRevenue - totalRestockCost

  return { orders: orders ?? [], restocks: restocks ?? [], totalRevenue, totalOrders, totalRestockCost, estimatedProfit }
}

// ── Cập nhật câu chuyện nhà vườn ──────────────────────────
export async function updateGardenStory(formData: FormData) {
  const session = await getCurrentUser()
  if (!session) return { error: 'Chưa đăng nhập' }

  const supabase = await createClient()

  const { data: garden } = await supabase
    .from('gardens')
    .select('id')
    .eq('owner_id', session.user.id)
    .single()

  if (!garden) return { error: 'Không tìm thấy nhà vườn' }

  const tagline   = formData.get('tagline') as string
  const story     = formData.get('story') as string
  const specialty = formData.get('specialty') as string
  const openHours = formData.get('open_hours') as string

  const { error } = await (supabase as any)
    .from('gardens')
    .update({
      tagline:    tagline    || null,
      story:      story      || null,
      specialty:  specialty  || null,
      open_hours: openHours  || null,
    })
    .eq('id', (garden as any).id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/')
  return { success: true }
}

// ── Cập nhật thông tin cơ bản vườn ────────────────────────
export async function updateGardenInfo(formData: FormData) {
  const session = await getCurrentUser()
  if (!session) return { error: 'Chưa đăng nhập' }

  const supabase = await createClient()

  const { data: garden } = await supabase
    .from('gardens')
    .select('id')
    .eq('owner_id', session.user.id)
    .single()

  if (!garden) return { error: 'Không tìm thấy nhà vườn' }

  const name        = formData.get('name') as string
  const phone       = formData.get('phone') as string
  const address     = formData.get('address') as string
  const description = formData.get('description') as string
  const isOpen      = formData.get('is_open') === 'true'

  if (!name || !address) return { error: 'Vui lòng nhập tên và địa chỉ vườn' }

  const { error } = await (supabase as any)
    .from('gardens')
    .update({ name, phone, address, description, is_open: isOpen })
    .eq('id', (garden as any).id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/')
  return { success: true }
}

// ── Tạo nhà vườn mới ──────────────────────────────────────
export async function createGarden(formData: FormData) {
  const session = await getCurrentUser()
  if (!session) return { error: 'Chưa đăng nhập' }

  const name        = (formData.get('name') as string)?.trim()
  const address     = (formData.get('address') as string)?.trim()
  const phone       = (formData.get('phone') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()

  if (!name || !address) return { error: 'Vui lòng nhập tên và địa chỉ vườn' }

  const supabase = await createClient()

  // Kiểm tra đã có vườn chưa
  const { data: existing } = await supabase
    .from('gardens').select('id').eq('owner_id', session.user.id).single()

  if (existing) return { error: 'Bạn đã có nhà vườn rồi' }

  const { error } = await (supabase as any).from('gardens').insert({
    owner_id:    session.user.id,
    name,
    address:     address || 'Xuân Quan, Văn Giang, Hưng Yên',
    phone:       phone   || null,
    description: description || null,
    is_open:     true,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  revalidatePath('/')
  return { success: true }
}
