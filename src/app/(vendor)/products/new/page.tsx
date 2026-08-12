'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ImagePlus, X, Package, Tag, DollarSign, Archive, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createProduct } from '@/lib/actions/products-vendor'
import { getCategories } from '@/lib/actions/products'

const UNITS = ['bó', 'bó 10 cành', 'bó 20 cành', 'chậu', 'cây', 'khay 9 cây', 'khay 12 cây', 'hộp', 'túi']

type Category = { id: string; name: string; icon?: string | null }

export default function NewProductPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [allowWholesale, setAllowWholesale] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [catsLoaded, setCatsLoaded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Lazy-load categories
  async function loadCategories() {
    if (catsLoaded) return
    const data = await getCategories()
    setCategories((data as any[]).map(c => ({ id: c.id, name: c.name, icon: c.icon })))
    setCatsLoaded(true)
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    // Dùng URL tạm — trong prod nên upload lên Supabase Storage
    setImageUrl(url)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('allowWholesale', allowWholesale ? 'true' : 'false')
    if (imageUrl) fd.set('imageUrl', imageUrl)

    startTransition(async () => {
      const result = await createProduct(fd)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-textMain">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base text-textMain flex-1">Đăng sản phẩm mới</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 pb-32 space-y-5">
        {/* Image upload */}
        <div className="bg-white rounded-2xl border border-border shadow-soft p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImagePlus className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-textMain">Ảnh sản phẩm</h2>
          </div>

          {imagePreview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-dark">
              <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
              <button type="button"
                onClick={() => { setImagePreview(null); setImageUrl(''); if (fileRef.current) fileRef.current.value = '' }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="block w-full">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
              <div className="w-full aspect-video rounded-xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                <ImagePlus className="w-8 h-8 text-textMuted" />
                <p className="text-sm font-semibold text-textMuted">Chọn ảnh sản phẩm</p>
                <p className="text-[11px] text-textMuted/70">JPG, PNG, WEBP · Tối đa 5MB</p>
              </div>
            </label>
          )}

          {/* Hoặc dán URL ảnh */}
          <div className="mt-3">
            <Input
              label="Hoặc dán URL ảnh có sẵn"
              value={imageUrl.startsWith('blob:') ? '' : imageUrl}
              onChange={e => {
                setImageUrl(e.target.value)
                setImagePreview(e.target.value || null)
              }}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-border shadow-soft p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-textMain">Thông tin sản phẩm</h2>
          </div>

          <Input name="name" label="Tên sản phẩm *" placeholder="Hoa Hồng Ecuador Đỏ" required />

          <div>
            <label className="text-xs font-bold text-textMain mb-1.5 block">Mô tả</label>
            <textarea name="description" rows={3}
              placeholder="Nguồn gốc, đặc điểm, thời gian tươi..."
              className="w-full border border-border rounded-xl px-3.5 py-3 text-sm text-textMain bg-white outline-none resize-none focus:border-primary transition placeholder:text-textMuted/60" />
          </div>

          {/* Category select */}
          <div>
            <label className="text-xs font-bold text-textMain mb-1.5 block">Danh mục</label>
            <div className="relative">
              <select name="categoryId"
                className="w-full border border-border rounded-xl px-3.5 py-3 text-sm text-textMain bg-white outline-none focus:border-primary transition appearance-none pr-8"
                onClick={loadCategories}
                defaultValue="">
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-textMuted pointer-events-none" />
            </div>
          </div>

          {/* Unit select */}
          <div>
            <label className="text-xs font-bold text-textMain mb-1.5 block">Đơn vị tính *</label>
            <div className="relative">
              <select name="unit" required
                className="w-full border border-border rounded-xl px-3.5 py-3 text-sm text-textMain bg-white outline-none focus:border-primary transition appearance-none pr-8"
                defaultValue="">
                <option value="" disabled>-- Chọn đơn vị --</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-textMuted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-border shadow-soft p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-textMain">Giá bán</h2>
          </div>

          <Input name="retailPrice" type="number" label="Giá bán lẻ (đ) *" placeholder="280000" required min={0} />
          <Input name="originalPrice" type="number" label="Giá gốc / Giá cũ (đ) — để tạo badge giảm giá" placeholder="350000" min={0} />

          {/* Wholesale toggle */}
          <div className="flex items-center justify-between py-2 border-t border-surface-dark">
            <div>
              <p className="text-sm font-bold text-textMain">Bán theo giá sỉ</p>
              <p className="text-[11px] text-textMuted">Áp dụng giá đặc biệt khi mua số lượng lớn</p>
            </div>
            <button type="button" onClick={() => setAllowWholesale(w => !w)}
              className={`relative w-11 h-6 rounded-full transition-colors ${allowWholesale ? 'bg-primary' : 'bg-border'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${allowWholesale ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {allowWholesale && (
            <div className="space-y-3 animate-fade-in">
              <Input name="wholesalePrice" type="number" label="Giá sỉ (đ) *" placeholder="220000" min={0} />
              <Input name="wholesaleMinQty" type="number" label="Số lượng tối thiểu để hưởng giá sỉ *" placeholder="5" min={1} />
            </div>
          )}
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-2xl border border-border shadow-soft p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Archive className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-textMain">Kho hàng</h2>
          </div>
          <Input name="stockQuantity" type="number" label="Số lượng tồn kho *" placeholder="50" required min={0} />
          <Input name="lowStockThreshold" type="number" label="Ngưỡng cảnh báo sắp hết hàng" placeholder="10" min={1} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
            ❌ {error}
          </div>
        )}
      </form>

      {/* Fixed bottom submit */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border px-4 py-3 z-30">
        <Button type="submit" form="product-form" className="w-full h-12 text-base" loading={isPending}
          onClick={() => {
            const form = document.querySelector('form') as HTMLFormElement
            form?.requestSubmit()
          }}>
          {isPending ? 'Đang đăng...' : '🌸 Đăng bán sản phẩm'}
        </Button>
      </div>
    </div>
  )
}
