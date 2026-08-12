import Link from 'next/link'
import { MapPin, Star, Users } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/card'
import type { Garden } from '@/lib/types/database.types'

interface GardenCardProps {
  garden: Garden
  distanceKm?: number
  variant?: 'list' | 'map-sheet'  // list: trang tìm kiếm | map-sheet: bottom sheet trên bản đồ
  className?: string
}

/**
 * Card hiển thị thông tin nhà vườn
 * Variant 'list': layout ngang (ảnh trái, info phải)
 * Variant 'map-sheet': layout dọc đẹp hơn cho bottom sheet bản đồ
 */
export function GardenCard({ garden, distanceKm, variant = 'list', className }: GardenCardProps) {
  if (variant === 'map-sheet') {
    return (
      <Link href={`/garden/${garden.id}`} className={cn('flex gap-3', className)}>
        <div className="w-16 h-16 rounded-xl bg-surface-dark overflow-hidden flex-shrink-0">
          {garden.avatar_url ? (
            <img src={garden.avatar_url} alt={garden.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-textMain truncate">{garden.name}</h3>
          <p className="text-[10px] text-textMuted mt-0.5 line-clamp-1">{garden.description}</p>
          <div className="flex items-center gap-2 text-[10px] mt-1.5 flex-wrap">
            <span className="text-yellow-500 flex items-center gap-0.5 font-semibold">
              <Star className="w-3 h-3 fill-yellow-500" /> {garden.rating.toFixed(1)}
            </span>
            <span className="text-border">|</span>
            {distanceKm !== undefined && (
              <span className="text-primary font-semibold flex items-center gap-0.5">
                <MapPin className="w-3 h-3" /> {distanceKm.toFixed(1)} km
              </span>
            )}
            <span className="text-border">|</span>
            <span className={cn('font-semibold', garden.is_open ? 'text-success' : 'text-danger')}>
              {garden.is_open ? 'Đang mở' : 'Đã đóng'}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Default: list variant
  return (
    <Link href={`/garden/${garden.id}`} className={cn('flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0', className)}>
      <div className="w-20 h-20 rounded-xl bg-surface-dark overflow-hidden flex-shrink-0">
        {garden.avatar_url ? (
          <img src={garden.avatar_url} alt={garden.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🌿</div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div>
          <h4 className="text-sm font-bold text-textMain">{garden.name}</h4>
          <p className="text-[10px] text-textMuted mt-1 line-clamp-1">{garden.description}</p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-[10px] text-textMuted">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-textMain">{garden.rating.toFixed(1)}</span>
            <span>({garden.review_count})</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={garden.is_open ? 'success' : 'danger'}>
              {garden.is_open ? 'Đang mở' : 'Đóng cửa'}
            </Badge>
            {distanceKm !== undefined && (
              <span className="text-[10px] bg-surface-dark px-2 py-1 rounded-lg text-textMain flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-primary" />
                {distanceKm.toFixed(1)} km
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/**
 * Skeleton cho GardenCard
 */
export function GardenCardSkeleton() {
  return (
    <div className="flex gap-3 pb-4 border-b border-border">
      <div className="w-20 h-20 skeleton rounded-xl flex-shrink-0" />
      <div className="flex-1 py-1">
        <div className="h-3.5 skeleton rounded mb-2 w-2/3" />
        <div className="h-2.5 skeleton rounded mb-3 w-full" />
        <div className="flex justify-between">
          <div className="h-3 skeleton rounded w-12" />
          <div className="h-5 skeleton rounded-full w-16" />
        </div>
      </div>
    </div>
  )
}
