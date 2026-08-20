'use client'

import { useState, useTransition, useRef } from 'react'
import { createGarden } from '@/lib/actions/vendor'
import { Store, Loader2, Check, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CreateGardenForm() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router  = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    setResult(null)
    startTransition(async () => {
      const res = await createGarden(fd)
      if (res?.success) {
        setResult({ success: true })
        setTimeout(() => router.push('/dashboard'), 1200)
      } else {
        setResult(res ?? null)
      }
    })
  }

  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Header */}
      <div className="bg-primary px-5 pt-14 pb-8">
        <p className="text-white/70 text-xs mb-1">Bắt đầu hành trình của bạn</p>
        <h1 className="text-2xl font-serif font-bold text-white">🌸 Tạo nhà vườn</h1>
        <p className="text-white/60 text-xs mt-1.5">
          Điền thông tin cơ bản để bắt đầu bán hàng trên Xuân Quan
        </p>
      </div>

      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl border border-border shadow-soft p-5">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

            {/* Tên vườn */}
            <div>
              <label className="block text-xs font-bold text-textMain mb-1.5">
                🏡 Tên nhà vườn <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="VD: Nhà Vườn Hồng Đức"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition"
              />
              <p className="text-[10px] text-textMuted mt-1">Tên này sẽ hiển thị với khách hàng</p>
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-xs font-bold text-textMain mb-1.5">
                📍 Địa chỉ <span className="text-red-500">*</span>
              </label>
              <input
                name="address"
                required
                defaultValue="Thôn Xuân Quan, Văn Giang, Hưng Yên"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* SĐT */}
            <div>
              <label className="block text-xs font-bold text-textMain mb-1.5">
                📞 Số điện thoại
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="0912345678"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-xs font-bold text-textMain mb-1.5">
                📝 Mô tả ngắn
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Vườn hoa của gia đình, chuyên hoa hồng & hoa lan..."
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition resize-none"
              />
            </div>

            {/* Kết quả */}
            {result?.error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{result.error}</p>
              </div>
            )}
            {result?.success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700 font-semibold">
                  Tạo nhà vườn thành công! Đang chuyển đến dashboard...
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || result?.success}
              className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition disabled:opacity-60 mt-2"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                : <><Store className="w-4 h-4" /> Tạo nhà vườn</>
              }
            </button>
          </form>
        </div>

        {/* Info tip */}
        <div className="mt-4 bg-secondary/10 border border-secondary/25 rounded-2xl p-4">
          <p className="text-xs font-bold text-secondary mb-1">💡 Sau khi tạo vườn</p>
          <p className="text-[11px] text-textMuted leading-relaxed">
            Bạn có thể thêm sản phẩm, chỉnh câu chuyện nhà vườn và quản lý đơn hàng từ dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
