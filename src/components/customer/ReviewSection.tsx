'use client'

import { useState, useTransition, useRef } from 'react'
import { Star, ThumbsUp, Edit3, Send, Loader2 } from 'lucide-react'
import { submitReview } from '@/lib/actions/reviews'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Star Picker ───────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className="w-8 h-8 transition-colors"
            fill={(hovered || value) >= s ? '#E8A317' : 'transparent'}
            stroke={(hovered || value) >= s ? '#E8A317' : '#d1d5db'}
          />
        </button>
      ))}
    </div>
  )
}

// ── Star Display (nhỏ, read-only) ─────────────────────────────
function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`${sz}`}
          fill={rating >= s ? '#E8A317' : 'transparent'}
          stroke={rating >= s ? '#E8A317' : '#d1d5db'} />
      ))}
    </div>
  )
}

// ── Form gửi đánh giá ─────────────────────────────────────────
function ReviewForm({
  productId, orderId, existingReview, onSuccess
}: {
  productId: string
  orderId: string | null
  existingReview: { id: string; rating: number; content: string | null } | null
  onSuccess: () => void
}) {
  const [rating,   setRating]   = useState(existingReview?.rating ?? 0)
  const [content,  setContent]  = useState(existingReview?.content ?? '')
  const [message,  setMessage]  = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const LABEL = ['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Xuất sắc!']

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { setMessage('Vui lòng chọn số sao'); return }

    const fd = new FormData()
    fd.set('product_id', productId)
    fd.set('rating', String(rating))
    fd.set('content', content)
    if (orderId) fd.set('order_id', orderId)

    startTransition(async () => {
      const res = await submitReview(fd)
      if (res?.error) {
        setMessage(res.error)
      } else {
        setMessage('✅ Cảm ơn bạn đã đánh giá!')
        onSuccess()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Stars */}
      <div className="flex flex-col items-center gap-2 py-2">
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && (
          <span className="text-sm font-bold" style={{ color: '#E8A317' }}>{LABEL[rating]}</span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm... (tuỳ chọn)"
        className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-800 bg-white placeholder:text-gray-400 outline-none resize-none focus:border-green-600 transition"
      />
      {content.length > 0 && (
        <p className="text-[10px] text-gray-400 text-right -mt-2">{content.length}/500</p>
      )}

      {/* Message */}
      {message && (
        <p className={`text-xs text-center font-semibold px-3 py-2 rounded-xl ${
          message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>{message}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !rating}
        className="w-full h-11 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
        style={{ backgroundColor: '#2D5A27' }}
      >
        {isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
          : <><Send className="w-4 h-4" /> {existingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}</>
        }
      </button>
    </form>
  )
}

// ── Review Card ───────────────────────────────────────────────
function ReviewCard({ review }: { review: any }) {
  const name = review.customer?.full_name ?? 'Khách hàng ẩn danh'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: '#2D5A27' }}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
            <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(review.created_at)}</span>
          </div>
          <StarDisplay rating={review.rating} />
          {review.content && (
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">{review.content}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main ReviewSection ─────────────────────────────────────────
export function ReviewSection({
  productId,
  initialReviews,
  canReview,
  orderId,
  existingReview,
  avgRating,
  reviewCount,
}: {
  productId:      string
  initialReviews: any[]
  canReview:      boolean
  orderId:        string | null
  existingReview: any | null
  avgRating:      number
  reviewCount:    number
}) {
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-800">Đánh giá sản phẩm</h3>
            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarDisplay rating={Math.round(avgRating)} size="sm" />
                <span className="text-sm font-bold" style={{ color: '#E8A317' }}>
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">({reviewCount} đánh giá)</span>
              </div>
            )}
          </div>

          {/* Nút viết đánh giá */}
          {canReview && !submitted && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
              style={{
                backgroundColor: showForm ? '#f0f6ef' : '#2D5A27',
                color: showForm ? '#2D5A27' : '#ffffff',
              }}
            >
              {existingReview
                ? <><Edit3 className="w-3.5 h-3.5" /> Sửa đánh giá</>
                : <><Star className="w-3.5 h-3.5" fill="currentColor" /> Viết đánh giá</>
              }
            </button>
          )}
        </div>

        {/* Badge chưa mua */}
        {!canReview && (
          <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            <span>Mua hàng để để lại đánh giá</span>
          </div>
        )}
      </div>

      {/* Form đánh giá */}
      {showForm && canReview && !submitted && (
        <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
          <ReviewForm
            productId={productId}
            orderId={orderId}
            existingReview={existingReview}
            onSuccess={() => { setSubmitted(true); setShowForm(false) }}
          />
        </div>
      )}

      {submitted && (
        <div className="px-4 py-3 bg-green-50 border-b border-green-100">
          <p className="text-sm text-green-700 font-semibold text-center">
            ✅ Đánh giá của bạn đã được ghi nhận. Cảm ơn!
          </p>
        </div>
      )}

      {/* List reviews */}
      <div className="px-4">
        {initialReviews.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-3xl">🌸</span>
            <p className="text-sm text-gray-500 mt-2">Chưa có đánh giá nào</p>
            <p className="text-xs text-gray-400 mt-1">Hãy là người đầu tiên chia sẻ cảm nhận!</p>
          </div>
        ) : (
          <div>
            {initialReviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}
