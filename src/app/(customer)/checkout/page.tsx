'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, CreditCard, Truck, CheckCircle2, Phone, User, Copy, ExternalLink } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

function formatPrice(p: number) {
  return p.toLocaleString('vi-VN') + 'đ'
}

// Thông tin tài khoản ngân hàng của làng hoa
const BANK_INFO = {
  bankId:    'MB',           // Mã ngân hàng VietQR (MB = MBBank)
  account:   '1234567890',   // ← Thay số tài khoản thật vào đây
  name:      'LANG HOA XUAN QUAN',
  template:  'compact',
}

function getVietQRUrl(amount: number, orderId: string) {
  const info = encodeURIComponent(`DH ${orderId.slice(-6).toUpperCase()}`)
  return `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.account}-${BANK_INFO.template}.png?amount=${amount}&addInfo=${info}&accountName=${encodeURIComponent(BANK_INFO.name)}`
}

const PAYMENT_METHODS = [
  { value: 'cod',           label: 'Tiền mặt khi nhận hàng (COD)', icon: '💵', desc: 'Thanh toán cho shipper khi nhận hàng' },
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng',        icon: '🏦', desc: 'QR code · Miễn phí · Xác nhận nhanh' },
]

type Step = 'address' | 'payment' | 'confirm' | 'success'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalAmount, clearCart } = useCartStore()

  const [step,      setStep]      = useState<Step>('address')
  const [isLoading, setIsLoading] = useState(false)
  const [orderId,   setOrderId]   = useState('')
  const [copied,    setCopied]    = useState(false)

  const [form, setForm] = useState({
    fullName: '', phone: '', address: '',
    note: '', paymentMethod: 'cod' as string,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const shippingFee = 30_000
  const total = totalAmount + shippingFee

  function validateAddress() {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên'
    if (!form.phone.trim() || form.phone.length < 9) e.phone = 'Số điện thoại không hợp lệ'
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePlaceOrder() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login?redirectTo=/checkout'); return }

      const gardenGroups = items.reduce((acc, item) => {
        const gId = item.product.garden_id
        if (!acc[gId]) acc[gId] = []
        acc[gId].push(item)
        return acc
      }, {} as Record<string, typeof items>)

      let lastOrderId = ''
      for (const [gardenId, gardenItems] of Object.entries(gardenGroups)) {
        const subtotal = gardenItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
        const { data: order, error: orderError } = await (supabase.from('orders').insert as any)({
          customer_id:      user.id,
          garden_id:        gardenId,
          order_type:       gardenItems.some(i => i.is_wholesale) ? 'wholesale' : 'retail',
          delivery_name:    form.fullName,
          delivery_phone:   form.phone,
          delivery_address: form.address,
          note:             form.note || null,
          subtotal,
          shipping_fee:     shippingFee,
          total_amount:     subtotal + shippingFee,
          payment_method:   form.paymentMethod,
          payment_status:   form.paymentMethod === 'cod' ? 'pending' : 'awaiting_transfer',
        }).select('id').single() as any

        if (orderError || !order) throw orderError

        await (supabase.from('order_items').insert as any)(
          gardenItems.map(item => ({
            order_id:      order.id,
            product_id:    item.product.id,
            product_name:  item.product.name,
            unit_price:    item.unit_price,
            is_wholesale:  item.is_wholesale,
            quantity:      item.quantity,
            subtotal:      item.unit_price * item.quantity,
            product_image: item.product.images?.[0] ?? null,
          }))
        )
        lastOrderId = order.id
      }

      setOrderId(lastOrderId)
      clearCart()
      setStep('success')
    } catch (err) {
      console.error(err)
      alert('Đã có lỗi xảy ra. Vui lòng thử lại!')
    } finally {
      setIsLoading(false)
    }
  }

  function copyAccount() {
    navigator.clipboard.writeText(BANK_INFO.account)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (items.length === 0 && step !== 'success') {
    router.replace('/cart')
    return null
  }

  // ─── SUCCESS SCREEN ───────────────────────────────────────────
  if (step === 'success') {
    const isBankTransfer = form.paymentMethod === 'bank_transfer'
    const shortId = orderId.slice(-6).toUpperCase()

    return (
      <div className="min-h-screen bg-surface pb-10">
        {/* Header */}
        <div className="bg-white px-4 pt-14 pb-4 border-b border-border text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: '#dcfce7' }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: '#16a34a' }} />
          </div>
          <h1 className="text-lg font-serif font-bold text-textMain">Đặt hàng thành công! 🎉</h1>
          <p className="text-xs text-textMuted mt-1">Mã đơn: <span className="font-bold text-textMain">#{shortId}</span></p>
        </div>

        <div className="px-4 py-5 space-y-4">
          {/* Payment instruction */}
          {isBankTransfer ? (
            <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-dark">
                <p className="font-bold text-sm text-textMain">📲 Quét QR để thanh toán</p>
                <p className="text-xs text-textMuted mt-0.5">Chuyển đúng số tiền, đơn hàng tự xác nhận</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center py-5 px-4">
                <div className="rounded-2xl overflow-hidden border-4 border-primary/10 shadow-lg">
                  <img
                    src={getVietQRUrl(total, orderId)}
                    alt="QR chuyển khoản"
                    className="w-56 h-56 object-cover"
                  />
                </div>
              </div>

              {/* Bank details */}
              <div className="px-4 pb-4 space-y-2">
                <div className="bg-surface rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted">Ngân hàng</span>
                    <span className="font-bold text-textMain">{BANK_INFO.bankId}Bank</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted">Số tài khoản</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-textMain">{BANK_INFO.account}</span>
                      <button onClick={copyAccount}
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition"
                        style={{ backgroundColor: copied ? '#dcfce7' : '#f0f6ef' }}>
                        <Copy className="w-3 h-3" style={{ color: '#2D5A27' }} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted">Chủ tài khoản</span>
                    <span className="font-bold text-textMain">{BANK_INFO.name}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border">
                    <span className="text-textMuted">Số tiền</span>
                    <span className="font-bold text-lg" style={{ color: '#2D5A27' }}>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted">Nội dung CK</span>
                    <span className="font-bold text-textMain">DH {shortId}</span>
                  </div>
                </div>

                <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a' }}>
                  ⚠️ <span className="font-bold" style={{ color: '#854d0e' }}>Nhập đúng nội dung</span>
                  <span style={{ color: '#a16207' }}> "DH {shortId}" để hệ thống tự xác nhận đơn hàng</span>
                </div>
              </div>
            </div>
          ) : (
            /* COD instruction */
            <div className="bg-white rounded-2xl border border-border shadow-soft p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: '#f0f6ef' }}>💵</div>
                <div>
                  <p className="font-bold text-sm text-textMain">Thanh toán khi nhận hàng</p>
                  <p className="text-xs text-textMuted">Chuẩn bị tiền mặt khi nhận hàng</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-textMuted">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#2D5A27' }}>1</span>
                  <span>Nhà vườn xác nhận đơn trong 30 phút</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#2D5A27' }}>2</span>
                  <span>Shipper liên hệ trước khi giao</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#2D5A27' }}>3</span>
                  <span>Thanh toán <strong className="text-textMain">{formatPrice(total)}</strong> khi nhận hàng</span>
                </div>
              </div>
            </div>
          )}

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-border shadow-soft p-4">
            <p className="font-bold text-sm text-textMain mb-3">Chi tiết đơn hàng</p>
            <div className="space-y-1.5 text-xs text-textMuted">
              <div className="flex justify-between">
                <span>Tiền hàng</span>
                <span className="font-semibold text-textMain">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí ship</span>
                <span className="font-semibold text-textMain">{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-bold text-sm">
                <span className="text-textMain">Tổng cộng</span>
                <span style={{ color: '#2D5A27' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <button onClick={() => router.push('/')}
            className="w-full h-12 rounded-2xl font-bold text-sm text-white transition"
            style={{ backgroundColor: '#2D5A27' }}>
            Tiếp tục mua sắm
          </button>
          <button onClick={() => router.push('/account/orders')}
            className="w-full text-sm font-semibold py-2 transition"
            style={{ color: '#2D5A27' }}>
            Xem đơn hàng của tôi →
          </button>
        </div>
      </div>
    )
  }

  // ─── CHECKOUT STEPS ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => step === 'address' ? router.back() : setStep('address')} className="text-textMain">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base text-textMain">Thanh toán</h1>
        </div>
        <div className="flex gap-1 mt-3">
          {(['address', 'payment', 'confirm'] as const).map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-colors"
              style={{ backgroundColor: ['address','payment','confirm'].indexOf(step as any) >= i ? '#2D5A27' : '#F4EFE6' }} />
          ))}
        </div>
      </div>

      <div className="px-4 py-5 pb-36">

        {/* STEP 1: Address */}
        {step === 'address' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-border shadow-soft p-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" style={{ color: '#2D5A27' }} />
                <h2 className="font-bold text-sm text-textMain">Địa chỉ giao hàng</h2>
              </div>
              <div className="space-y-3">
                <Input label="Họ và tên người nhận" value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  leftIcon={<User className="w-4 h-4" />} error={errors.fullName} placeholder="Nguyễn Văn A" />
                <Input label="Số điện thoại" type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  leftIcon={<Phone className="w-4 h-4" />} error={errors.phone} placeholder="0912 345 678" />
                <div>
                  <label className="text-xs font-bold text-textMain mb-1.5 block">Địa chỉ nhận hàng</label>
                  <textarea value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    rows={3} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className={`w-full border rounded-xl px-3.5 py-3 text-sm text-textMain bg-white placeholder:text-textMuted/60 outline-none resize-none transition ${errors.address ? 'border-red-400' : 'border-border'}`}
                    style={{ '--tw-ring-color': '#2D5A27' } as any} />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
                <Input label="Ghi chú (tuỳ chọn)" value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Giao giờ hành chính, nhắn vào cổng..." />
              </div>
            </div>

            <div className="rounded-xl p-3 flex items-start gap-2.5 text-xs"
              style={{ backgroundColor: '#f0f6ef', border: '1px solid rgba(45,90,39,0.15)' }}>
              <Truck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#2D5A27' }} />
              <p className="text-textMuted">
                <span className="font-bold" style={{ color: '#2D5A27' }}>Miễn phí ship</span> cho đơn hàng đầu tiên.
                Đơn tiếp theo: {formatPrice(shippingFee)}.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Payment */}
        {step === 'payment' && (
          <div className="animate-fade-in space-y-3">
            <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-dark flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: '#2D5A27' }} />
                <h2 className="font-bold text-sm text-textMain">Phương thức thanh toán</h2>
              </div>
              <div className="divide-y divide-surface-dark">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.value} onClick={() => setForm(f => ({ ...f, paymentMethod: m.value }))}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left transition"
                    style={{ backgroundColor: form.paymentMethod === m.value ? '#f0f6ef' : undefined }}>
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-textMain">{m.label}</p>
                      <p className="text-[11px] text-textMuted mt-0.5">{m.desc}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition"
                      style={{ borderColor: form.paymentMethod === m.value ? '#2D5A27' : '#E2E8F0' }}>
                      {form.paymentMethod === m.value &&
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#2D5A27' }} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview QR nếu chọn chuyển khoản */}
            {form.paymentMethod === 'bank_transfer' && (
              <div className="bg-white rounded-2xl border border-border p-4 text-center animate-fade-in">
                <p className="text-xs font-bold text-textMain mb-3">👀 Preview QR — sẽ hiện sau khi đặt hàng</p>
                <div className="inline-flex rounded-2xl overflow-hidden border-4 border-primary/10">
                  <img src={getVietQRUrl(total, 'PREVIEW')} alt="QR preview" className="w-44 h-44 object-cover" />
                </div>
                <p className="text-[11px] text-textMuted mt-2">Quét QR bằng app ngân hàng bất kỳ</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-border shadow-soft p-4">
              <h2 className="font-bold text-sm mb-3 text-textMain">Xác nhận đơn hàng</h2>
              <div className="space-y-2 text-xs text-textMuted mb-4">
                <div className="flex gap-2">
                  <span className="font-bold text-textMain w-24 flex-shrink-0">Người nhận:</span>
                  <span>{form.fullName} · {form.phone}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-textMain w-24 flex-shrink-0">Địa chỉ:</span>
                  <span>{form.address}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-textMain w-24 flex-shrink-0">Thanh toán:</span>
                  <span>{PAYMENT_METHODS.find(m => m.value === form.paymentMethod)?.label}</span>
                </div>
              </div>
              <div className="border-t border-surface-dark pt-3 space-y-2">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between text-xs">
                    <span className="text-textMuted truncate max-w-[200px]">{item.product.name} × {item.quantity}</span>
                    <span className="font-bold text-textMain flex-shrink-0">{formatPrice(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs pt-2 border-t border-surface-dark">
                  <span className="text-textMuted">Phí ship</span><span>{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span className="text-textMain">Tổng cộng</span>
                  <span style={{ color: '#2D5A27' }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border px-4 py-3 z-30">
        {step === 'address' && (
          <button className="w-full h-12 rounded-2xl font-bold text-sm text-white transition"
            style={{ backgroundColor: '#2D5A27' }}
            onClick={() => { if (validateAddress()) setStep('payment') }}>
            Tiếp theo: Chọn thanh toán →
          </button>
        )}
        {step === 'payment' && (
          <button className="w-full h-12 rounded-2xl font-bold text-sm text-white transition"
            style={{ backgroundColor: '#2D5A27' }}
            onClick={() => setStep('confirm')}>
            Kiểm tra đơn hàng →
          </button>
        )}
        {step === 'confirm' && (
          <button className="w-full h-12 rounded-2xl font-bold text-sm text-white transition flex items-center justify-center gap-2"
            style={{ backgroundColor: isLoading ? '#4E9E48' : '#2D5A27' }}
            disabled={isLoading}
            onClick={handlePlaceOrder}>
            {isLoading ? (
              <><span className="animate-spin border-2 border-white/40 border-t-white rounded-full w-4 h-4" /> Đang xử lý...</>
            ) : (
              <>🛒 Đặt hàng · {formatPrice(total)}</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
