import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Phone, Star, Clock } from 'lucide-react'
import Link from 'next/link'

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

      {/* Embedded map */}
      <div className="w-full relative overflow-hidden">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3726.4!2d105.9175531!3d20.9689691!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135af00718a3dbd%3A0xe35814b5eed85e42!2sXu%C3%A2n+quan!5e0!3m2!1svi!2svn!4v1723510000000"
          width="100%"
          height="260"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Bản đồ Cổng Làng Hoa Xuân Quan"
        />
        {/* Nút chỉ đường */}
        <a
          href="https://maps.app.goo.gl/wSQALMvX67CmrbXN9"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5"
        >
          🧭 Chỉ đường
        </a>
      </div>

      {/* Garden list */}
      <div className="px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-textMuted uppercase tracking-wide">
          {gardens?.length ?? 0} nhà vườn đang mở cửa
        </p>

        {(gardens ?? []).map((garden: any) => (
          <div key={garden.id} className="bg-white rounded-2xl border border-surface-dark shadow-soft overflow-hidden">
            {/* Garden banner */}
            <div className="h-28 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
              <span className="text-5xl">🌸</span>
              {garden.is_open && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Đang mở
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-textMain">{garden.name}</h3>
                {garden.rating && (
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
                <a href={`tel:${garden.phone}`}
                  className="flex-1 border border-primary text-primary text-xs font-bold py-2 rounded-xl text-center hover:bg-primary/5 transition">
                  📞 Gọi điện
                </a>
                <Link href={`/search?gardenId=${garden.id}&gardenName=${encodeURIComponent(garden.name)}`}
                  className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-xl text-center hover:bg-primary/90 transition">
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
