'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Send, CheckCircle2, XCircle,
  DollarSign, ShoppingBag, Phone, Clock, Loader2, Tag
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  acceptNegotiation, rejectNegotiation,
  sendNegotiationMessage, sendPriceOffer
} from '@/lib/actions/negotiations'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_CFG = {
  pending:   { label: 'Chờ phản hồi',    color: '#f59e0b', bg: '#fef3c7' },
  countered: { label: 'Có đề nghị mới',  color: '#3b82f6', bg: '#eff6ff' },
  accepted:  { label: 'Đã chốt ✅',      color: '#16a34a', bg: '#dcfce7' },
  rejected:  { label: 'Đã từ chối',      color: '#dc2626', bg: '#fee2e2' },
  expired:   { label: 'Hết hạn',         color: '#6b7280', bg: '#f3f4f6' },
  ordered:   { label: 'Đã tạo đơn 🛒',   color: '#2D5A27', bg: '#f0f6ef' },
} as Record<string, { label: string; color: string; bg: string }>

// ── Message bubble ─────────────────────────────────────────────
function MessageBubble({ msg, isMine }: { msg: any; isMine: boolean }) {
  const isOffer   = msg.message_type === 'offer' || msg.message_type === 'counter'
  const isSystem  = ['accept', 'reject', 'system'].includes(msg.message_type)

  // Tin hệ thống — hiện giữa
  if (isSystem) {
    const icon = msg.message_type === 'accept' ? '✅' : msg.message_type === 'reject' ? '❌' : 'ℹ️'
    return (
      <div className="flex justify-center my-2">
        <div className="rounded-2xl px-4 py-2 text-center border border-gray-100 bg-gray-50 max-w-[85%]">
          <p className="text-xs font-bold text-gray-600">{icon} {msg.content}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{fmtTime(msg.created_at)}</p>
        </div>
      </div>
    )
  }

  // Tin offer giá — hiện bên gửi nhưng có card đặc biệt
  if (isOffer) {
    return (
      <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[78%] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-4 py-3" style={{ backgroundColor: isMine ? '#2D5A27' : '#ffffff' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="w-3 h-3" style={{ color: isMine ? '#86efac' : '#f59e0b' }} />
              <span className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: isMine ? '#86efac' : '#f59e0b' }}>
                {isMine ? 'Đề nghị của bạn' : 'Đề nghị giá'}
              </span>
            </div>
            <p className="text-xl font-bold" style={{ color: isMine ? '#ffffff' : '#2D5A27' }}>
              {fmt(msg.offered_price)}
            </p>
            {msg.content && (
              <p className="text-xs mt-1" style={{ color: isMine ? 'rgba(255,255,255,0.75)' : '#6b7280' }}>
                {msg.content}
              </p>
            )}
            <p className="text-[10px] mt-1 text-right" style={{ color: isMine ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}>
              {fmtTime(msg.created_at)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Tin nhắn thường
  return (
    <div className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm ${
        isMine ? 'rounded-br-sm' : 'rounded-bl-sm'
      }`} style={{
        backgroundColor: isMine ? '#2D5A27' : '#ffffff',
        color: isMine ? '#ffffff' : '#2C352D',
        border: isMine ? 'none' : '1px solid #e2e8f0',
      }}>
        <p className="text-sm leading-relaxed">{msg.content}</p>
        <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/50' : 'text-gray-400'}`}>
          {fmtTime(msg.created_at)}
        </p>
      </div>
    </div>
  )
}

// ── Inline offer form ──────────────────────────────────────────
function OfferInput({
  negId, role, lastPrice, onDone,
}: {
  negId: string; role: 'buyer' | 'seller'; lastPrice: number; onDone: () => void
}) {
  const [price, setPrice] = useState(lastPrice)
  const [note, setNote]   = useState('')
  const [busy, start]     = useTransition()

  function submit() {
    if (price < 1000) return
    start(async () => {
      await sendPriceOffer(negId, price, role, note || undefined)
      onDone()
    })
  }

  return (
    <div className="rounded-2xl border-2 p-3 space-y-2 mx-1"
      style={{ borderColor: '#2D5A27', backgroundColor: '#f0f6ef' }}>
      <p className="text-xs font-bold" style={{ color: '#2D5A27' }}>💰 Đề nghị giá mới</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full h-10 border-2 border-white rounded-xl px-3 font-bold text-base outline-none focus:border-green-600 bg-white transition"
            style={{ color: '#2D5A27' }}
            autoFocus
          />
        </div>
        <span className="text-xs text-gray-500">₫/đơn vị</span>
      </div>
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Ghi chú (tuỳ chọn)"
        className="w-full h-9 border border-white rounded-xl px-3 text-xs bg-white outline-none focus:border-green-500"
      />
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || price < 1000}
          className="flex-1 h-9 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1 disabled:opacity-50"
          style={{ backgroundColor: '#2D5A27' }}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Gửi đề nghị
        </button>
        <button onClick={onDone}
          className="px-4 h-9 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white">
          Huỷ
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function DealChatClient({
  initialData, myId, myRole,
}: {
  initialData: { negotiation: any; messages: any[] }
  myId: string
  myRole: 'buyer' | 'seller'
}) {
  const router = useRouter()
  const [neg, setNeg]         = useState(initialData.negotiation)
  const [msgs, setMsgs]       = useState(initialData.messages)
  const [text, setText]       = useState('')
  const [showOffer, setShowOffer] = useState(false)
  const [isPending, start]    = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, showOffer])

  // Supabase Realtime
  useEffect(() => {
    const supabase = createClient()
    const ch = supabase.channel(`deal-${neg.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'negotiation_messages',
        filter: `negotiation_id=eq.${neg.id}`,
      }, p => setMsgs(prev => [...prev, p.new]))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'price_negotiations',
        filter: `id=eq.${neg.id}`,
      }, p => setNeg((prev: any) => ({ ...prev, ...p.new })))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [neg.id])

  const sendText = useCallback(() => {
    const t = text.trim()
    if (!t) return
    setText('')
    start(async () => { await sendNegotiationMessage(neg.id, t, myRole) })
  }, [text, neg.id, myRole])

  const handleAccept = () => start(async () => {
    const res = await acceptNegotiation(neg.id)
    if ((res as any).order_id) router.push('/account/orders')
  })

  const handleReject = () => {
    if (!confirm('Từ chối deal này?')) return
    start(async () => { await rejectNegotiation(neg.id) })
  }

  const isActive   = ['pending', 'countered'].includes(neg.status)
  const statusCfg  = STATUS_CFG[neg.status] ?? STATUS_CFG.pending
  const product    = neg.product
  const garden     = neg.garden
  const latestOffer = neg.seller_price ?? neg.buyer_price

  // Lấy giá offer gần nhất từ messages
  const lastOfferMsg = [...msgs].reverse().find((m: any) =>
    m.message_type === 'offer' || m.message_type === 'counter'
  )
  const suggestPrice = lastOfferMsg?.offered_price ?? latestOffer

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm text-gray-800 truncate">{product?.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-gray-400">{neg.quantity} {neg.unit}</span>
              {garden?.phone && isActive && (
                <a href={`tel:${garden.phone}`} className="text-[11px] flex items-center gap-0.5"
                  style={{ color: '#2D5A27' }}>
                  <Phone className="w-3 h-3" /> Gọi
                </a>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* ── Deal summary strip ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {product?.images?.[0]
            ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xl">🌸</div>
          }
        </div>
        <div className="flex-1 min-w-0 text-xs">
          <span className="text-gray-500">Giá ban đầu: </span>
          <span className="font-bold text-gray-700">{fmt(neg.buyer_price)}</span>
          {neg.seller_price && (
            <> → <span className="font-bold" style={{ color: '#3b82f6' }}>{fmt(neg.seller_price)}</span></>
          )}
          {neg.final_price && (
            <> → <span className="font-bold" style={{ color: '#16a34a' }}>Chốt {fmt(neg.final_price)}</span></>
          )}
        </div>
        {/* Link đơn hàng */}
        {neg.status === 'ordered' && neg.order_id && (
          <Link href="/account/orders"
            className="text-[11px] font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-white flex-shrink-0"
            style={{ backgroundColor: '#2D5A27' }}>
            <ShoppingBag className="w-3 h-3" /> Xem đơn
          </Link>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {msgs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🤝</p>
            <p className="text-sm">Bắt đầu thương lượng nào!</p>
          </div>
        )}
        {msgs.map((msg: any) => (
          <MessageBubble key={msg.id} msg={msg} isMine={msg.sender_id === myId} />
        ))}

        {/* Inline offer form */}
        {showOffer && isActive && (
          <div className="mt-2">
            <OfferInput
              negId={neg.id}
              role={myRole}
              lastPrice={suggestPrice}
              onDone={() => setShowOffer(false)}
            />
          </div>
        )}

        {/* Accepted banner */}
        {neg.status === 'accepted' && neg.final_price && (
          <div className="rounded-2xl p-4 text-center mt-3"
            style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
            <p className="font-bold text-lg" style={{ color: '#16a34a' }}>
              ✅ Chốt {fmt(neg.final_price)} × {neg.quantity} {neg.unit}
            </p>
            <p className="text-sm mt-0.5" style={{ color: '#15803d' }}>
              Tổng = {fmt(neg.final_price * neg.quantity)} (chưa phí ship)
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Bottom bar ── */}
      {isActive ? (
        <div className="bg-white border-t border-gray-100 px-3 py-3 flex-shrink-0 space-y-2.5">
          {/* Action row */}
          <div className="flex gap-2">
            <button onClick={handleAccept} disabled={isPending}
              className="flex-1 h-10 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: '#16a34a' }}>
              <CheckCircle2 className="w-4 h-4" />
              Chốt {latestOffer ? fmt(latestOffer) : ''}
            </button>
            <button onClick={() => { setShowOffer(v => !v) }}
              className="flex-1 h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 border-2 transition"
              style={{
                borderColor: '#2D5A27',
                color: showOffer ? '#ffffff' : '#2D5A27',
                backgroundColor: showOffer ? '#2D5A27' : 'transparent',
              }}>
              <DollarSign className="w-4 h-4" />
              Đề giá
            </button>
            <button onClick={handleReject} disabled={isPending}
              className="w-10 h-10 rounded-xl border border-red-200 flex items-center justify-center hover:bg-red-50"
              style={{ color: '#dc2626' }}>
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Chat input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText() } }}
              placeholder="Nhắn tin..."
              className="flex-1 h-11 border border-gray-200 rounded-2xl px-4 text-sm outline-none focus:border-green-600 bg-gray-50 transition"
            />
            <button onClick={sendText} disabled={!text.trim() || isPending}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 transition"
              style={{ backgroundColor: '#2D5A27' }}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0 text-center">
          <span className="text-sm font-bold" style={{ color: statusCfg.color }}>
            <Clock className="w-4 h-4 inline mr-1" />{statusCfg.label}
          </span>
        </div>
      )}
    </div>
  )
}
