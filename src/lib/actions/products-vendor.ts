'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login')

  const supabase = await createClient()

  // Lấy garden của vendor
  const { data: garden } = await supabase
    .from('gardens').select('id').eq('owner_id', session.user.id).single()
  if (!garden) return { error: 'Không tìm thấy nhà vườn' }

  const name         = formData.get('name') as string
  const description  = formData.get('description') as string
  const categoryId   = formData.get('categoryId') as string
  const unit         = formData.get('unit') as string
  const retailPrice  = Number(formData.get('retailPrice'))
  const originalPrice = formData.get('originalPrice') ? Number(formData.get('originalPrice')) : null
  const allowWholesale = formData.get('allowWholesale') === 'true'
  const wholesalePrice = allowWholesale ? Number(formData.get('wholesalePrice')) : null
  const wholesaleMinQty = allowWholesale ? Number(formData.get('wholesaleMinQty')) : null
  const stockQuantity = Number(formData.get('stockQuantity'))
  const lowStockThreshold = Number(formData.get('lowStockThreshold') ?? 10)
  const imageUrl = formData.get('imageUrl') as string

  if (!name || !retailPrice || !unit) return { error: 'Vui lòng điền đủ thông tin bắt buộc' }

  const { error } = await (supabase as any).from('products').insert({
    garden_id: (garden as any).id,
    category_id: categoryId || null,
    name, description: description || null,
    unit, retail_price: retailPrice,
    original_price: originalPrice,
    allow_wholesale: allowWholesale,
    wholesale_price: wholesalePrice,
    wholesale_min_qty: wholesaleMinQty,
    stock_quantity: stockQuantity,
    low_stock_threshold: lowStockThreshold,
    images: imageUrl ? [imageUrl] : [],
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/inventory')
  revalidatePath('/')
  redirect('/inventory')
}

export async function uploadProductImage(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const ext  = file.name.split('.').pop()
  const path = `products/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('product-images').upload(path, file)
  if (error) return { error: error.message }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return { url: data.publicUrl }
}
