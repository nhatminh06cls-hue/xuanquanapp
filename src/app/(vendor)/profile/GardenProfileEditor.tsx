'use client'

import { useState, useTransition, useRef } from 'react'
import { updateGardenStory, updateGardenInfo } from '@/lib/actions/vendor'
import { BookOpen, Store, Check, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface Garden {
  id: string
  name: string
  description: string | null
  address: string
  phone: string | null
  is_open: boolean
  tagline: string | null
  story: string | null
  specialty: string | null
  open_hours: string | null
}

// ─────────────────────────────────────────────────────────────
// Story Form
// ─────────────────────────────────────────────────────────────
function StoryForm({ garden }: { garden: Garden }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    setResult(null)
    startTransition(async () => {
      const res = await updateGardenStory(fd)
      setResult(res)
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Specialty */}
      <div>
        <label className="block text-xs font-bold text-textMain mb-1.5">
          🏷️ Chuyên môn / Thế mạnh
        </label>
        <input
          name="specialty"
          defaultValue={garden.specialty ?? ''}
          placeholder="VD: Chuyên hoa hồng nhập khẩu cao cấp"
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition"
        />
        <p className="text-[10px] text-textMuted mt-1">Hiển thị như nhãn nhỏ trên thẻ vườn</p>
      </div>

      {/* Tagline */}
      <div>
        <label className="block text-xs font-bold text-textMain mb-1.5">
          💬 Tagline — câu slogan ngắn
        </label>
        <input
          name="tagline"
          defaultValue={garden.tagline ?? ''}
          placeholder='VD: "Ba thế hệ gắn bó với hoa"'
          maxLength={120}
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition"
        />
        <p className="text-[10px] text-textMuted mt-1">Tối đa 120 ký tự. Hiển thị in nghiêng trên trang chủ</p>
      </div>

      {/* Story */}
      <div>
        <label className="block text-xs font-bold text-textMain mb-1.5">
          📖 Câu chuyện của vườn
        </label>
        <textarea
          name="story"
          defaultValue={garden.story ?? ''}
          rows={5}
          placeholder="Kể về lịch sử hình thành, gia đình, đam mê với hoa... Câu chuyện chân thực giúp khách hàng kết nối và tin tưởng hơn."
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition resize-none leading-relaxed"
        />
        <p className="text-[10px] text-textMuted mt-1">Nên từ 50–200 từ. Kể thật, đừng quảng cáo</p>
      </div>

      {/* Open hours */}
      <div>
        <label className="block text-xs font-bold text-textMain mb-1.5">
          🕐 Giờ mở cửa
        </label>
        <input
          name="open_hours"
          defaultValue={garden.open_hours ?? ''}
          placeholder="VD: 6:00 – 20:00 hàng ngày"
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition"
        />
      </div>

      {/* Result */}
      {result?.error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{result.error}</p>
        </div>
      )}
      {result?.success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-xs text-green-700 font-semibold">Đã lưu thành công! Câu chuyện đã được cập nhật trên trang chủ.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
        {isPending ? 'Đang lưu...' : 'Lưu câu chuyện'}
      </button>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
// Info Form
// ─────────────────────────────────────────────────────────────
function InfoForm({ garden }: { garden: Garden }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [isOpen, setIsOpen] = useState(garden.is_open)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    fd.set('is_open', String(isOpen))
    setResult(null)
    startTransition(async () => {
      const res = await updateGardenInfo(fd)
      setResult(res)
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-textMain mb-1.5">Tên nhà vườn *</label>
        <input
          name="name"
          defaultValue={garden.name}
          required
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary transition"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-textMain mb-1.5">Địa chỉ *</label>
        <input
          name="address"
          defaultValue={garden.address}
          required
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary transition"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-textMain mb-1.5">Số điện thoại</label>
        <input
          name="phone"
          type="tel"
          defaultValue={garden.phone ?? ''}
          placeholder="0912345678"
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-textMain mb-1.5">Mô tả ngắn</label>
        <textarea
          name="description"
          defaultValue={garden.description ?? ''}
          rows={3}
          placeholder="Mô tả 1-2 câu về nhà vườn..."
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition resize-none"
        />
      </div>

      {/* Open/Close toggle */}
      <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
        <div>
          <p className="text-sm font-bold text-textMain">Trạng thái vườn</p>
          <p className="text-xs text-textMuted mt-0.5">{isOpen ? 'Khách có thể đặt hàng' : 'Vườn đang tạm nghỉ'}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-6 rounded-full transition-colors ${isOpen ? 'bg-green-500' : 'bg-border'} relative`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${isOpen ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      {result?.error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{result.error}</p>
        </div>
      )}
      {result?.success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-xs text-green-700 font-semibold">Đã lưu thành công!</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
        {isPending ? 'Đang lưu...' : 'Cập nhật thông tin'}
      </button>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
// Collapsible section
// ─────────────────────────────────────────────────────────────
function Section({ title, subtitle, icon, children, defaultOpen = false }: {
  title: string
  subtitle: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface/50 transition"
      >
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-textMain">{title}</p>
          <p className="text-[11px] text-textMuted mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-textMuted" /> : <ChevronDown className="w-4 h-4 text-textMuted" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-border/50">{children}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────
export function GardenProfileEditor({ garden }: { garden: Garden }) {
  return (
    <div className="space-y-4">
      <Section
        title="Câu chuyện nhà vườn"
        subtitle="Tagline, story, chuyên môn — hiển thị trên trang chủ"
        icon={<BookOpen className="w-4 h-4 text-primary" />}
        defaultOpen={true}
      >
        <div className="pt-3">
          <StoryForm garden={garden} />
        </div>
      </Section>

      <Section
        title="Thông tin cơ bản"
        subtitle="Tên, địa chỉ, điện thoại, trạng thái"
        icon={<Store className="w-4 h-4 text-primary" />}
      >
        <div className="pt-3">
          <InfoForm garden={garden} />
        </div>
      </Section>
    </div>
  )
}
