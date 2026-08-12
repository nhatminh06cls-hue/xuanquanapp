'use server'

import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/types/database.types'

// ── PRODUCTS ──────────────────────────────────────────────

export async function getFeaturedProducts(limit = 6) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`*, garden:gardens(id, name, address, avatar_url)`)
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('sold_count', { ascending: false })
    .limit(limit)

  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function searchProducts({
  query = '',
  categoryId,
  minPrice,
  maxPrice,
  gardenId,
  page = 1,
  limit = 12,
}: {
  query?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  gardenId?: string
  page?: number
  limit?: number
}) {
  const supabase = await createClient()
  let q = supabase
    .from('products')
    .select(`*, garden:gardens(id, name, address, avatar_url, lat, lng), category:categories(id, name, slug)`, { count: 'exact' })
    .eq('is_active', true)
    .gt('stock_quantity', 0)

  if (query) q = q.ilike('name', `%${query}%`)
  if (categoryId) q = q.eq('category_id', categoryId)
  if (minPrice !== undefined) q = q.gte('retail_price', minPrice)
  if (maxPrice !== undefined) q = q.lte('retail_price', maxPrice)
  if (gardenId) q = q.eq('garden_id', gardenId)

  const from = (page - 1) * limit
  const { data, error, count } = await q.range(from, from + limit - 1).order('created_at', { ascending: false })

  if (error) { console.error(error); return { products: [], total: 0 } }
  return { products: data ?? [], total: count ?? 0 }
}

export async function getProductById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      garden:gardens(id, name, address, ward, phone, avatar_url, cover_url, lat, lng, is_open, rating, review_count),
      category:categories(id, name, slug),
      reviews(id, rating, content, created_at, customer:profiles(id, full_name, avatar_url))
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

export async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data ?? []
}

// ── GARDENS ───────────────────────────────────────────────

export async function getAllGardens() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gardens')
    .select('*, products(count)')
    .order('rating', { ascending: false })
  return data ?? []
}

export async function getGardenById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gardens')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function getGardenProducts(gardenId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('garden_id', gardenId)
    .eq('is_active', true)
    .order('sold_count', { ascending: false })
  return data ?? []
}
