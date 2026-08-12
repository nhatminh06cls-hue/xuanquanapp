import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMyNegotiations } from '@/lib/actions/negotiations'
import { getCurrentUser } from '@/lib/actions/auth'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

const STATUS_CFG = {
  pending:   { label: 'Chờ phản hồi',   color: '#f59e0b', bg: '#fef3c7', dot: '🟡' },
  countered: { label: 'Có phản giá mới', color: '#3b82f6', bg: '#eff6ff', dot: '🔵' },
  accepted:  { label: 'Đã chốt ✅',     color: '#16a34a', bg: '#dcfce7', dot: '🟢' },
  rejected:  { label: 'Đã từ chối',     color: '#dc2626', bg: '#fee2e2', dot: '🔴' },
  expired:   { label: 'Hết hạn',        color: '#6b7280', bg: '#f3f4f6', dot: '⚫' },
  ordered:   { label: 'Đã tạo đơn',    color: '#2D5A27', bg: '#f0f6ef', dot: '🛒' },
} as Record<string, any>

export default async function DealsPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/auth/login?redirectTo=/deals')

  const deals = await getMyNegotiations()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/account" className="text-gray-700"><ChevronLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="font-bold text-base text-gray-800">Deal giá sỉ</h1>
            <p className="text-[11px] text-gray-400">{deals.length} deal đang hoạt động</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🤝</span>
            <p className="font-bold text-gray-700">Chưa có deal nào</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Tìm sản phẩm sỉ và bấm "Deal giá" để bắt đầu</p>
            <Link href="/shop"
              className="px-6 py-3 rounded-2xl font-bold text-sm text-white"
              style={{ backgroundColor: '#2D5A27' }}>
              Xem sản phẩm sỉ
            </Link>
          </div>
        ) : (
          deals.map((deal: any) => {
            const cfg = STATUS_CFG[deal.status] ?? STATUS_CFG.pending
            const img = deal.product?.images?.[0]
            return (
              <Link key={deal.id} href={`/deals/${deal.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="flex items-center gap-3 p-4">
                  {/* Product image */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {img
                      ? <img src={img} alt={deal.product?.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm text-gray-800 truncate">{deal.product?.name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">{deal.garden?.name} · {deal.quantity} {deal.unit}</p>

                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-400">Đề: <span className="font-bold text-gray-700">{fmt(deal.buyer_price)}</span></span>
                      {deal.seller_price && (
                        <span className="text-xs text-gray-400">Phản: <span className="font-bold text-blue-600">{fmt(deal.seller_price)}</span></span>
                      )}
                      {deal.final_price && (
                        <span className="text-xs text-gray-400">Chốt: <span className="font-bold" style={{ color: '#2D5A27' }}>{fmt(deal.final_price)}</span></span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>

                {/* Timestamp */}
                <div className="px-4 pb-3 flex items-center gap-1 text-[10px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  {new Date(deal.updated_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {deal.status === 'countered' && (
                    <span className="ml-2 font-bold animate-pulse" style={{ color: '#3b82f6' }}>• Có phản hồi mới!</span>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
