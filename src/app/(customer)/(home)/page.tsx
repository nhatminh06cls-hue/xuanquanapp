import Link from 'next/link'
import { ShoppingBag, MapPin, ChevronRight, Leaf, Star, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { getAllGardens, getFeaturedProducts } from '@/lib/actions/products'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Làng Hoa Xuân Quan — Hoa Tươi Văn Giang, Hưng Yên',
  description: 'Khám phá làng hoa Xuân Quan — vùng hoa lớn nhất miền Bắc với hơn 300 năm lịch sử. Mỗi nhà vườn một câu chuyện.',
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <div className="relative h-[400px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: "url('/hero-village.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-primary/95" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-white/80" />
          <span className="text-white/80 text-[11px] font-bold tracking-[0.2em] uppercase">Làng Hoa Xuân Quan</span>
        </div>

      </div>

      {/* Hero text */}
      <div className="relative z-10 px-6 mt-8">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.15em] mb-2">
          📍 Văn Giang · Hưng Yên
        </p>
        <h1 className="text-[38px] font-serif font-bold text-white leading-[1.15] mb-3">
          Mỗi bông hoa<br />
          <span className="text-secondary">một câu chuyện</span>
        </h1>
        <p className="text-white/75 text-sm leading-relaxed max-w-[270px]">
          Hơn 300 năm người Xuân Quan gắn bó với hoa. Mỗi nhà vườn là một di sản sống.
        </p>
      </div>

      {/* Stats */}
      <div className="absolute bottom-5 left-4 right-4 z-10">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 flex items-center justify-around">
          {[
            { num: '300+', label: 'Năm lịch sử' },
            { num: '200+', label: 'Nhà vườn' },
            { num: '50+',  label: 'Loại hoa' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-white font-bold text-lg leading-none">{s.num}</p>
              <p className="text-white/60 text-[9px] font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VILLAGE INTRO
// ─────────────────────────────────────────────────────────────
function VillageIntro() {
  return (
    <div className="px-5 py-6 bg-white border-b border-border/50">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-1 h-12 bg-primary rounded-full flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-base font-serif font-bold text-textMain mb-1">Về Làng Hoa Xuân Quan</h2>
          <p className="text-xs text-textMuted leading-relaxed">
            Xuân Quan thuộc huyện Văn Giang, tỉnh Hưng Yên — cách Hà Nội 30km về phía Đông. 
            Làng nổi tiếng với nghề trồng hoa truyền thống hơn 3 thế kỷ, cung cấp phần lớn 
            hoa tươi cho thị trường Hà Nội và các tỉnh lân cận.
          </p>
        </div>
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: '🌹', title: 'Hoa hồng Ecuador', desc: 'Đặc sản số 1 của làng' },
          { icon: '🌷', title: 'Tulip Hà Lan', desc: 'Nhập khẩu chính hãng' },
          { icon: '🪷', title: 'Lan hồ điệp', desc: 'Quý phái, bền lâu' },
          { icon: '🌻', title: 'Hoa theo mùa', desc: 'Tươi thu hoạch mỗi ngày' },
        ].map((f, i) => (
          <div key={i} className="bg-surface rounded-xl p-3 border border-border/50 flex items-start gap-2">
            <span className="text-lg flex-shrink-0">{f.icon}</span>
            <div>
              <p className="text-[11px] font-bold text-textMain">{f.title}</p>
              <p className="text-[10px] text-textMuted mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Link href="/shop"
        className="mt-4 w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-2xl transition shadow-sm"
        style={{ backgroundColor: '#2D5A27', color: '#ffffff' }}>
        <ShoppingBag className="w-4 h-4" /> Mua hoa từ làng
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GARDEN STORIES — trọng tâm của trang chủ
// ─────────────────────────────────────────────────────────────
async function GardenStories() {
  const gardens = (await getAllGardens()) as any[]
  if (!gardens.length) return null

  // Fallback defaults nếu vườn chưa nhập story
  const defaultTagline = 'Trồng hoa bằng cả tâm huyết'
  const defaultStory   = 'Mỗi bông hoa rời vườn đều mang theo sự chăm chút tỉ mỉ từng ngày. Chúng tôi tự hào là một phần của làng hoa Xuân Quan — nơi hoa là nghề, là đời, là ký ức.'
  const defaultSpecialty = 'Nhà vườn Xuân Quan'

  return (
    <div className="py-5">
      <div className="flex items-center justify-between px-5 mb-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-textMain">Câu chuyện nhà vườn</h2>
          <p className="text-xs text-textMuted mt-0.5">Thương hiệu được xây từ đất và mồ hôi</p>
        </div>
        <Link href="/map" className="text-xs font-bold text-primary flex items-center gap-0.5">
          Tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-4 px-5">
        {gardens.slice(0, 5).map((g: any, idx: number) => {
          // Dùng data thật, fallback về default
          const tagline   = g.tagline   || defaultTagline
          const story     = g.story     || defaultStory
          const specialty = g.specialty || defaultSpecialty

          return (
            <Link
              key={g.id}
              href={`/garden/${g.id}`}
              className="block rounded-2xl overflow-hidden border border-border shadow-soft hover:shadow-card transition-shadow group"
            >
              {/* Cover */}
              <div className="relative h-36 bg-gradient-to-br from-primary/20 to-secondary/20">
                {g.cover_url ? (
                  <img src={g.cover_url} alt={g.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl opacity-30">🌸</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wide">{specialty}</p>
                    <h3 className="text-white font-bold text-base font-serif leading-tight">{g.name}</h3>
                  </div>
                  {g.rating > 0 && (
                    <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <Star className="w-3 h-3 fill-secondary text-secondary" />
                      <span className="text-white text-xs font-bold">{Number(g.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {g.is_open && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    ● Mở cửa
                  </div>
                )}
              </div>

              {/* Story */}
              <div className="bg-white p-4">
                <p className="text-xs font-bold text-primary mb-1.5 italic">"{tagline}"</p>
                <p className="text-[11px] text-textMuted leading-relaxed mb-3 line-clamp-2">{story}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-textMuted">
                    <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="line-clamp-1 max-w-[180px]">{g.address}</span>
                  </div>
                  <span className="text-[11px] font-bold text-primary flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                    Xem vườn <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="px-5 mt-4">
        <Link href="/map"
          className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-2xl transition"
          style={{ border: '2px solid #2D5A27', color: '#2D5A27' }}>
          <MapPin className="w-4 h-4" /> Xem tất cả nhà vườn trên bản đồ
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FEATURED — hoa bán chạy (gọn)
// ─────────────────────────────────────────────────────────────
async function QuickShop() {
  const products = (await getFeaturedProducts(4)) as any[]
  if (!products.length) return null

  return (
    <div className="px-5 py-5 border-t border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-serif font-bold text-textMain">Hoa bán chạy</h2>
          <p className="text-xs text-textMuted mt-0.5">Được khách hàng yêu thích nhất</p>
        </div>
        <Link href="/shop" className="text-xs font-bold text-primary flex items-center gap-0.5">
          Tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontal scroll — không dùng grid để trang chủ không quá nặng */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
        {products.map((p: any) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="flex-shrink-0 w-36 bg-white border border-border rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-shadow"
          >
            <div className="h-28 bg-surface-dark overflow-hidden">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🌸</div>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[11px] font-bold text-textMain line-clamp-1 mb-1">{p.name}</p>
              <p className="text-xs font-bold text-primary">
                {p.retail_price.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </Link>
        ))}

        {/* View all card */}
        <Link
          href="/shop"
          className="flex-shrink-0 w-36 bg-primary/5 border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-2 py-6 hover:bg-primary/10 transition"
        >
          <ShoppingBag className="w-6 h-6 text-primary/60" />
          <p className="text-[11px] font-bold text-primary text-center leading-tight">Xem tất cả<br/>sản phẩm</p>
        </Link>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="animate-fade-in bg-surface min-h-screen pb-28">
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Giới thiệu làng */}
      <VillageIntro />

      {/* 3. Câu chuyện nhà vườn — TRỌNG TÂM */}
      <Suspense fallback={
        <div className="px-5 py-5 space-y-3">
          <div className="h-5 skeleton rounded w-48 mb-4" />
          {[1,2,3].map(i => <div key={i} className="h-52 skeleton rounded-2xl" />)}
        </div>
      }>
        <GardenStories />
      </Suspense>

      {/* 4. Hoa bán chạy — gọn, hướng đến /shop */}
      <Suspense fallback={null}>
        <QuickShop />
      </Suspense>
    </div>
  )
}
