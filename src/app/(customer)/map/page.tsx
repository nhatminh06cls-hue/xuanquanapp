import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Phone, Star } from 'lucide-react'
import Link from 'next/link'
import { LeafletMap } from '@/components/shared/LeafletMap'

export const metadata: Metadata = {
  title: 'Bản đồ Làng Hoa | Xuân Quan',
  description: 'Khám phá các nhà vườn tại làng hoa Xuân Quan, Văn Giang, Hưng Yên.',
}

export default async function MapPage() {
  const supabase = await createClient()
  const { data: gardens } = await supabase
    .from('gardens')
    .select('*')
    .eq('is_open', true)
    .order('rating', { ascending: false })

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 border-b border-border">
        <h1 className="text-lg font-bold text-textMain">Bản đồ nhà vườn</h1>
        <p className="text-xs text-textMuted mt-0.5">Làng hoa Xuân Quan · Văn Giang · Hưng Yên</p>
      </div>

      {/* Interactive Leaflet Map */}
      <div className="relative">
        <LeafletMap gardens={gardens ?? []} />
        {/* Chỉ đường đến cổng làng */}
        <a
          href="https://maps.app.goo.gl/wSQALMvX67CmrbXN9"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 z-[1000]"
        >
          🧭 Chỉ đường đến cổng
        </a>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-white border-b border-border flex items-center gap-4 text-xs text-textMuted">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px]">📍</span>
          <span>Cổng làng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px]">🌸</span>
          <span>Nhà vườn</span>
        </div>
        <span className="ml-auto text-[10px]">Nhấn pin để xem chi tiết</span>
      </div>

      {/* Garden list */}
      <div className="px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-textMuted uppercase tracking-wide">
          {gardens?.length ?? 0} nhà vườn đang mở cửa
        </p>

        {(gardens ?? []).map((garden: any) => (
          <div key={garden.id} className="bg-white rounded-2xl border border-surface-dark shadow-soft overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
              <span className="text-4xl">🌸</span>
              <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Đang mở
              </div>
              {/* GPS indicator */}
              {garden.lat && garden.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${garden.lat},${garden.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-white/90 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-0.5"
                >
                  📍 Dẫn đường
                </a>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-textMain">{garden.name}</h3>
                {garden.rating > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-yellow-700">{garden.rating}</span>
                    <span className="text-[10px] text-yellow-600">({garden.review_count})</span>
                  </div>
                )}
              </div>

              {garden.description && (
                <p className="text-xs text-textMuted line-clamp-2 mb-3">{garden.description}</p>
              )}

              <div className="space-y-1.5 text-xs text-textMuted mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{garden.address}</span>
                </div>
                {garden.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <a href={`tel:${garden.phone}`} className="font-semibold text-primary hover:underline">
                      {garden.phone}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <a
                  href={`tel:${garden.phone}`}
                  className="flex-1 border border-primary text-primary text-xs font-bold py-2 rounded-xl text-center hover:bg-primary/5 transition"
                >
                  📞 Gọi điện
                </a>
                <Link
                  href={`/search?gardenId=${garden.id}&gardenName=${encodeURIComponent(garden.name)}`}
                  className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-xl text-center hover:bg-primary/90 transition"
                >
                  🌸 Xem sản phẩm
                </Link>
              </div>
            </div>
          </div>
        ))}

        {!gardens?.length && (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">🗺️</span>
            <p className="font-bold text-textMain">Chưa có nhà vườn nào</p>
          </div>
        )}
      </div>
    </div>
  )
}
