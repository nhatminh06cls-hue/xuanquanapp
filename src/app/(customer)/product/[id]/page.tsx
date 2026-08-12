import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { getProductById } from '@/lib/actions/products'
import { getProductReviews, checkCanReview } from '@/lib/actions/reviews'
import { TopBar } from '@/components/shared/TopBar'
import { Badge } from '@/components/ui/card'
import { AddToCartButton } from './AddToCartButton'
import { ReviewSection } from '@/components/customer/ReviewSection'
import { DealPriceButton } from '@/components/customer/DealPriceButton'
import type { Product, Garden, Category, Review } from '@/lib/types/database.types'

type ProductDetail = Product & {
  garden: Garden | null
  category: Category | null
  reviews: (Review & { customer: { id: string; full_name: string | null; avatar_url: string | null } | null })[]
}

// ── Metadata động ───────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const raw = await getProductById(id)
  if (!raw) return { title: 'Không tìm thấy sản phẩm' }
  const product = raw as unknown as ProductDetail
  return {
    title: product.name,
    description: product.description ?? `Mua ${product.name} từ ${product.garden?.name}`,
  }
}

function formatPrice(p: number) {
  return p.toLocaleString('vi-VN') + 'đ'
}

// ── Image Gallery ──────────────────────────────────────────
function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const mainImg = images[0] ?? null
  return (
    <div className="relative h-80 bg-surface-dark w-full">
      {mainImg ? (
        <img src={mainImg} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-6xl">🌸</div>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-4 right-4 bg-black/55 text-white px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm">
          1 / {images.length}
        </div>
      )}
    </div>
  )
}


// ── Page ───────────────────────────────────────────────────
export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const raw = await getProductById(id)
  if (!raw) notFound()
  const product = raw as unknown as ProductDetail

  const garden = product.garden
  const hasDiscount = product.original_price && product.original_price > product.retail_price
  const isOutOfStock = product.stock_quantity === 0

  // Fetch reviews + quyền đánh giá song song
  const [reviews, reviewAccess] = await Promise.all([
    getProductReviews(id),
    checkCanReview(id),
  ])

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      {/* Floating back/share buttons */}
      <TopBar transparent showBack showShare showFavorite />

      {/* Product images */}
      <ImageGallery images={product.images} name={product.name} />

      {/* Product info card */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 min-h-96 px-5 pt-5 pb-44">
        {/* Category + Title */}
        <div className="mb-4">
          {product.category && (
            <Badge variant="primary" className="mb-2">{product.category.name}</Badge>
          )}
          <h1 className="text-2xl font-serif font-bold text-textMain leading-snug">{product.name}</h1>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-surface-dark">
          <span className="text-2xl font-bold text-primary">{formatPrice(product.retail_price)}</span>
          {hasDiscount && (
            <span className="text-sm text-textMuted line-through">{formatPrice(product.original_price!)}</span>
          )}
          <div className="ml-auto flex items-center gap-1 text-xs font-semibold bg-secondary/10 text-secondary px-2.5 py-1 rounded-lg">
            <Star className="w-3 h-3 fill-secondary" />
            {product.rating.toFixed(1)} ({product.review_count})
          </div>
        </div>

        {/* Wholesale info */}
        {product.allow_wholesale && product.wholesale_price && product.wholesale_min_qty && (
          <div className="mb-5 bg-primary/5 border border-primary/15 rounded-xl p-3">
            <p className="text-xs font-bold text-primary mb-0.5">🏷️ Giá sỉ đặc biệt</p>
            <p className="text-sm text-textMain">
              <span className="font-bold text-primary">{formatPrice(product.wholesale_price)}</span>
              <span className="text-textMuted text-xs"> / {product.unit} khi đặt từ {product.wholesale_min_qty} {product.unit}</span>
            </p>
          </div>
        )}

        {/* Garden card */}
        {garden && (
          <div className="flex items-center justify-between p-3 bg-surface rounded-2xl border border-border mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-primary/10 flex-shrink-0">
                {garden.avatar_url ? (
                  <img src={garden.avatar_url} alt={garden.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🌿</div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-textMain">{garden.name}</h3>
                <p className="text-[10px] text-textMuted flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" /> {garden.address}
                </p>
              </div>
            </div>
            <Link href={`/garden/${garden!.id}`}
              className="text-[10px] font-bold text-primary border border-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition">
              Xem vườn
            </Link>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <>
            <h3 className="font-bold text-textMain mb-2 text-sm">Mô tả sản phẩm</h3>
            <p className="text-xs text-textMuted leading-relaxed mb-5">{product.description}</p>
          </>
        )}

        {/* Stock info */}
        <div className="flex items-center gap-2 mb-5">
          <Badge variant={isOutOfStock ? 'danger' : product.stock_quantity <= product.low_stock_threshold ? 'warning' : 'success'}>
            {isOutOfStock ? 'Hết hàng' : `Còn ${product.stock_quantity} ${product.unit}`}
          </Badge>
          <span className="text-xs text-textMuted">Đã bán: {product.sold_count}</span>
        </div>

        {/* Reviews */}
        <ReviewSection
          productId={id}
          initialReviews={reviews}
          canReview={reviewAccess.canReview}
          orderId={reviewAccess.orderId}
          existingReview={reviewAccess.existingReview}
          avgRating={product.rating ?? 0}
          reviewCount={product.review_count ?? 0}
        />
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white px-4 py-3 border-t border-border/50 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.08)] z-30">
        <div className="flex gap-2">
          {garden?.lat && garden?.lng && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${garden.lat},${garden.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="w-12 h-12 flex flex-col items-center justify-center bg-surface border border-border rounded-xl text-textMain hover:bg-surface-dark transition">
              <MapPin className="w-4 h-4 text-primary mb-0.5" />
              <span className="text-[8px] font-bold">Map</span>
            </a>
          )}
          {garden?.phone && (
            <a href={`tel:${garden.phone}`}
              className="w-12 h-12 flex flex-col items-center justify-center bg-surface border border-border rounded-xl text-textMain hover:bg-surface-dark transition">
              <Phone className="w-4 h-4 text-primary mb-0.5" />
              <span className="text-[8px] font-bold">Gọi</span>
            </a>
          )}
          {/* Nếu sản phẩm có bán sỉ: hiện cả 2 nút Deal + Thêm giỏ */}
          {product.allow_wholesale && (
            <DealPriceButton product={{
              id:               product.id,
              name:             product.name,
              garden_id:        product.garden_id,
              wholesale_price:  product.wholesale_price,
              wholesale_min_qty: product.wholesale_min_qty,
              retail_price:     product.retail_price,
              unit:             product.unit,
            }} />
          )}
          <AddToCartButton product={product as any} disabled={isOutOfStock} />
        </div>
      </div>
    </div>
  )
}
