import { notFound } from 'next/navigation'
import { MapPin, Phone, Star, Package, Clock, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import { getGardenById, getGardenProducts } from '@/lib/actions/products'
import { BackButton } from './BackButton'
import { GardenProductGrid } from './GardenProductGrid'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const garden = await getGardenById(id)
  if (!garden) return { title: 'Không tìm thấy vườn' }
  return {
    title: `${garden.name} | Làng Hoa Xuân Quan`,
    description: garden.description ?? `Khám phá sản phẩm từ ${garden.name}`,
  }
}

export default async function GardenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [garden, products] = await Promise.all([
    getGardenById(id),
    getGardenProducts(id),
  ])

  if (!garden) notFound()

  const g = garden as any

  return (
    <div className="min-h-screen bg-surface pb-10">
      {/* Hero / Cover */}
      <div className="relative h-52 bg-gradient-to-br from-primary/30 to-secondary/20">
        {g.cover_url ? (
          <img src={g.cover_url} alt={g.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🌸</div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Back button */}
        <BackButton />

        {/* Open badge */}
        {g.is_open !== undefined && (
          <div className={`absolute top-14 right-4 px-3 py-1 rounded-full text-[11px] font-bold ${
            g.is_open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {g.is_open ? '● Đang mở cửa' : '● Đã đóng cửa'}
          </div>
        )}
      </div>

      {/* Garden Info Card */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-5 pt-5 pb-4 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-primary/10 flex-shrink-0">
            {g.avatar_url ? (
              <img src={g.avatar_url} alt={g.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-serif font-bold text-textMain leading-tight">{g.name}</h1>
            {g.rating > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                <span className="text-sm font-bold text-secondary">{Number(g.rating).toFixed(1)}</span>
                <span className="text-xs text-textMuted">({g.review_count ?? 0} đánh giá)</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {g.description && (
          <p className="text-xs text-textMuted leading-relaxed mb-4">{g.description}</p>
        )}

        {/* Info rows */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-xs text-textMuted">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{g.address}{g.ward ? `, ${g.ward}` : ''}</span>
          </div>
          {g.phone && (
            <div className="flex items-center gap-2 text-xs text-textMuted">
              <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <a href={`tel:${g.phone}`} className="font-semibold text-primary">{g.phone}</a>
            </div>
          )}
          {g.open_hours && (
            <div className="flex items-center gap-2 text-xs text-textMuted">
              <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>{g.open_hours}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {g.phone && (
            <a
              href={`tel:${g.phone}`}
              className="flex-1 h-11 flex items-center justify-center gap-1.5 bg-white border-2 border-primary text-primary text-sm font-bold rounded-2xl shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95"
            >
              <Phone className="w-4 h-4" /> Gọi điện
            </a>
          )}
          {g.lat && g.lng ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 flex items-center justify-center gap-1.5 bg-primary text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4" /> Chỉ đường
            </a>
          ) : (
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(g.name + ' ' + g.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 flex items-center justify-center gap-1.5 bg-primary text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4" /> Chỉ đường
            </a>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 px-5 mt-3">
        <div className="flex-1 bg-white rounded-xl p-3 text-center border border-border">
          <p className="text-xl font-bold text-primary">{products.length}</p>
          <p className="text-[10px] text-textMuted font-semibold mt-0.5">Sản phẩm</p>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center border border-border">
          <p className="text-xl font-bold text-secondary">{Number(g.rating ?? 0).toFixed(1)}★</p>
          <p className="text-[10px] text-textMuted font-semibold mt-0.5">Đánh giá</p>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center border border-border">
          <p className="text-xl font-bold text-textMain">{g.is_open ? '🟢' : '🔴'}</p>
          <p className="text-[10px] text-textMuted font-semibold mt-0.5">{g.is_open ? 'Mở cửa' : 'Đóng cửa'}</p>
        </div>
      </div>

      {/* Products */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-textMain flex items-center gap-1.5">
            <Package className="w-4 h-4 text-primary" />
            Sản phẩm của vườn
          </h2>
          <span className="text-xs text-textMuted">{products.length} sản phẩm</span>
        </div>

        {products.length > 0 ? (
          <GardenProductGrid products={products} gardenName={g.name} />
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="text-4xl mb-3">🌱</span>
            <p className="font-bold text-textMain">Chưa có sản phẩm</p>
            <p className="text-xs text-textMuted mt-1">Vườn này chưa đăng sản phẩm nào</p>
          </div>
        )}
      </div>
    </div>
  )
}
