'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Download, Calendar, DollarSign, ShoppingBag, Package } from 'lucide-react'
import { getMyGarden, getTaxReport } from '@/lib/actions/vendor'
import { Button } from '@/components/ui/button'

function formatPrice(p: number) {
  return Number(p).toLocaleString('vi-VN') + 'đ'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getMonthRange(offset = 0) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset
  const from = new Date(year, month, 1).toISOString()
  const to   = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
  return { from, to }
}

const PRESETS = [
  { label: 'Tháng này',   ...getMonthRange(0) },
  { label: 'Tháng trước', ...getMonthRange(-1) },
  { label: 'Quý này',     from: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString(), to: new Date().toISOString() },
]

export default function ReportsPage() {
  const [garden, setGarden] = useState<any>(null)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activePreset, setActivePreset] = useState(0)
  const [from, setFrom] = useState(PRESETS[0].from.slice(0, 10))
  const [to,   setTo]   = useState(PRESETS[0].to.slice(0, 10))

  useEffect(() => {
    getMyGarden().then((g: any) => {
      setGarden(g)
      if (g) fetchReport(g.id, PRESETS[0].from, PRESETS[0].to)
    })
  }, [])

  async function fetchReport(gardenId: string, fromDate: string, toDate: string) {
    setLoading(true)
    const data = await getTaxReport(gardenId, fromDate, toDate)
    setReport(data)
    setLoading(false)
  }

  function applyPreset(idx: number) {
    setActivePreset(idx)
    const p = PRESETS[idx]
    setFrom(p.from.slice(0, 10))
    setTo(p.to.slice(0, 10))
    if (garden) fetchReport(garden.id, p.from, p.to)
  }

  function applyCustom() {
    if (garden) fetchReport(garden.id, from, to)
  }

  function exportCSV() {
    if (!report) return
    const rows = [
      ['Ngày đặt', 'Khách hàng', 'Địa chỉ', 'Loại', 'Tổng tiền'],
      ...(report.orders ?? []).map((o: any) => [
        formatDate(o.created_at), o.delivery_name, o.delivery_address,
        o.order_type === 'wholesale' ? 'Sỉ' : 'Lẻ',
        o.total_amount,
      ]),
      [],
      ['', '', '', 'Tổng doanh thu', report.totalRevenue],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `bao-cao-${from}-${to}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-textMain">Báo cáo thuế</h1>
            <p className="text-xs text-textMuted mt-0.5">Doanh thu & đơn hàng để kê khai</p>
          </div>
          <Button variant="surface" size="sm" onClick={exportCSV} disabled={!report || loading}>
            <Download className="w-3.5 h-3.5" /> Xuất CSV
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Period selector */}
        <div className="bg-white rounded-2xl border border-border shadow-soft p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-textMain">Chọn kỳ báo cáo</h2>
          </div>

          {/* Preset tabs */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {PRESETS.map((p, i) => (
              <button key={p.label} onClick={() => applyPreset(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                  activePreset === i ? 'bg-primary text-white border-primary' : 'border-border text-textMuted bg-white hover:bg-surface'
                }`}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-textMuted mb-1 block">Từ ngày</label>
              <input type="date" value={from} onChange={e => { setFrom(e.target.value); setActivePreset(-1) }}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-textMain bg-white outline-none focus:border-primary transition" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-textMuted mb-1 block">Đến ngày</label>
              <input type="date" value={to} onChange={e => { setTo(e.target.value); setActivePreset(-1) }}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-textMain bg-white outline-none focus:border-primary transition" />
            </div>
            <Button size="sm" onClick={applyCustom} loading={loading}>Xem</Button>
          </div>
        </div>

        {/* Summary cards */}
        {report && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: DollarSign, label: 'Tổng doanh thu', value: formatPrice(report.totalRevenue), color: 'text-green-600 bg-green-50', sub: 'Đơn đã giao' },
                { icon: ShoppingBag, label: 'Số đơn đã giao', value: `${report.totalOrders} đơn`, color: 'text-primary bg-primary/10', sub: 'Hoàn thành' },
                { icon: TrendingUp, label: 'Doanh thu trung bình', value: report.totalOrders > 0 ? formatPrice(Math.round(report.totalRevenue / report.totalOrders)) : '0đ', color: 'text-blue-500 bg-blue-50', sub: 'Mỗi đơn' },
                { icon: Package, label: 'Doanh thu ước tính', value: formatPrice(report.estimatedProfit), color: 'text-orange-500 bg-orange-50', sub: 'Sau chi phí' },
              ].map(({ icon: Icon, label, value, color, sub }) => (
                <div key={label} className="bg-white rounded-2xl border border-surface-dark shadow-soft p-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-base font-bold text-textMain">{value}</p>
                  <p className="text-[10px] text-textMuted mt-0.5">{label}</p>
                  <p className="text-[10px] text-primary font-semibold">{sub}</p>
                </div>
              ))}
            </div>

            {/* Tax estimate box */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/15 rounded-2xl p-4">
              <h3 className="font-bold text-sm text-textMain mb-3 flex items-center gap-2">
                📋 Ước tính thuế kê khai
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-textMuted">Doanh thu (Bán lẻ + Sỉ)</span>
                  <span className="font-bold text-textMain">{formatPrice(report.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">Thuế GTGT 5% (hoa tươi)</span>
                  <span className="font-bold text-orange-600">{formatPrice(Math.round(report.totalRevenue * 0.05))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">Thuế TNCN ước tính 1%</span>
                  <span className="font-bold text-orange-600">{formatPrice(Math.round(report.totalRevenue * 0.01))}</span>
                </div>
                <div className="border-t border-primary/20 pt-2 flex justify-between">
                  <span className="font-bold text-textMain">Tổng thuế ước tính</span>
                  <span className="font-bold text-primary">{formatPrice(Math.round(report.totalRevenue * 0.06))}</span>
                </div>
              </div>
              <p className="text-[10px] text-textMuted/70 mt-3">
                * Đây là ước tính. Vui lòng tham khảo kế toán hoặc Chi cục Thuế địa phương để kê khai chính xác.
              </p>
            </div>

            {/* Orders table */}
            {report.orders?.length > 0 && (
              <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-dark">
                  <h3 className="font-bold text-sm text-textMain">Chi tiết đơn hàng ({report.orders.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface border-b border-surface-dark">
                        <th className="px-4 py-2.5 text-left font-bold text-textMuted">Ngày</th>
                        <th className="px-4 py-2.5 text-left font-bold text-textMuted">Khách</th>
                        <th className="px-4 py-2.5 text-right font-bold text-textMuted">Tổng</th>
                        <th className="px-4 py-2.5 text-center font-bold text-textMuted">Loại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-dark">
                      {report.orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-surface transition">
                          <td className="px-4 py-2.5 text-textMuted whitespace-nowrap">{formatDate(o.created_at)}</td>
                          <td className="px-4 py-2.5 text-textMain font-semibold">{o.delivery_name}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-primary whitespace-nowrap">{formatPrice(o.total_amount)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.order_type === 'wholesale' ? 'bg-primary/10 text-primary' : 'bg-surface-dark text-textMuted'}`}>
                              {o.order_type === 'wholesale' ? 'Sỉ' : 'Lẻ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {report.orders?.length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl mb-3 block">📊</span>
                <p className="font-bold text-textMain">Chưa có đơn nào trong kỳ này</p>
                <p className="text-xs text-textMuted mt-1">Chọn kỳ khác hoặc mở rộng phạm vi ngày</p>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-textMuted">Đang tải báo cáo...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
