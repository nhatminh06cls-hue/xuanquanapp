'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Handshake, Loader2, X, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { createNegotiation } from '@/lib/actions/negotiations'

interface Props {
  product: {
    id:               string
    name:             string
    garden_id:        string
    wholesale_price?: number | null
    wholesale_min_qty?: number | null
    retail_price:     number
    unit:             string
  }
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export function DealPriceButton({ product }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [qty, setQty]         = useState(product.wholesale_min_qty ?? 10)
  const [price, setPrice]     = useState(
    product.wholesale_price
      ? Math.round(product.wholesale_price * 0.9)
      : Math.round(product.retail_price * 0.75)
  )
  const [note, setNote]       = useState('')
  const [error, setError]     = useState('')
  const [isPending, start]    = useTransition()

  const refPrice = product.wholesale_price ?? product.retail_price
  const discount = Math.round((1 - price / refPrice) * 100)

  function handleSubmit() {
    if (qty < 1) { setError('Số lượng phải lớn hơn 0'); return }
    if (price < 1000) { setError('Giá tối thiểu 1.000đ'); return }

    start(async () => {
      const res = await createNegotiation({
        product_id:  product.id,
        garden_id:   product.garden_id,
        quantity:    qty,
        unit:        product.unit,
        buyer_price: price,
        buyer_note:  note || undefined,
      })

      if ((res as any).error) {
        if ((res as any).negotiation_id) {
          // Deal đã tồn tại — đi thẳng vào deal đó
          router.push(`/deals/${(res as any).negotiation_id}`)
        } else {
          setError((res as any).error)
        }
      } else if ((res as any).negotiation_id) {
        router.push(`/deals/${(res as any).negotiation_id}`)
      }
    })
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition active:scale-95"
        style={{ borderColor: '#2D5A27', color: '#2D5A27' }}
      >
        <Handshake className="w-4 h-4" /> Deal giá sỉ
      </button>

      {/* Bottom sheet */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 shadow-2xl animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between py-3 mb-4 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-base text-gray-800">🤝 Đề nghị giá sỉ</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{product.name}</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ref price info */}
              <div className="rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2 text-xs"
                style={{ backgroundColor: '#f0f6ef' }}>
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#2D5A27' }} />
                <span style={{ color: '#2D5A27' }}>
                  Giá sỉ niêm yết: <strong>{fmt(product.wholesale_price ?? product.retail_price)}</strong> / {product.unit}
                  {product.wholesale_min_qty && ` (tối thiểu ${product.wholesale_min_qty} ${product.unit})`}
                </span>
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-700 mb-2 block">Số lượng ({product.unit})</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 h-10 border border-gray-200 rounded-xl text-center font-bold text-lg outline-none focus:border-green-600"
                  />
                  <button onClick={() => setQty(q => q + 1)}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-700 mb-2 block">
                  Giá bạn đề nghị (đ / {product.unit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(Math.max(1000, parseInt(e.target.value) || 0))}
                    className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 pr-16 font-bold text-lg outline-none focus:border-green-600 transition"
                    style={{ color: '#2D5A27' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₫/{product.unit}</span>
                </div>
                {discount > 0 && (
                  <p className="text-xs mt-1.5" style={{ color: '#3b82f6' }}>
                    Giảm {discount}% so với giá sỉ · Tổng: <strong>{fmt(price * qty)}</strong>
                  </p>
                )}
              </div>

              {/* Note */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-700 mb-2 block">Ghi chú (tuỳ chọn)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="VD: Mua thường xuyên, cần giao sáng sớm..."
                  className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm outline-none focus:border-green-600 transition"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full h-13 py-3.5 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition disabled:opacity-60"
                style={{ backgroundColor: '#2D5A27' }}
              >
                {isPending
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi...</>
                  : <><Handshake className="w-5 h-5" /> Gửi đề nghị giá</>
                }
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Seller sẽ phản hồi trong vòng 2 giờ
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
