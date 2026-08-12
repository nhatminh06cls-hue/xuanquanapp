'use client'

import { ChevronLeft, Share2, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface TopBarProps {
  title?: string
  transparent?: boolean         // Dùng trên ảnh hero (trong suốt)
  showBack?: boolean
  showShare?: boolean
  showFavorite?: boolean
  isFavorited?: boolean
  onFavoriteToggle?: () => void
  rightSlot?: React.ReactNode   // Slot tùy chỉnh bên phải
  className?: string
}

/**
 * Header bar cho các trang có nút Back
 * Hỗ trợ chế độ transparent (đặt trên ảnh bìa)
 */
export function TopBar({
  title,
  transparent = false,
  showBack = true,
  showShare = false,
  showFavorite = false,
  isFavorited = false,
  onFavoriteToggle,
  rightSlot,
  className,
}: TopBarProps) {
  const router = useRouter()

  return (
    <div
      className={cn(
        'absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 safe-top pt-2',
        !transparent && 'bg-white border-b border-border shadow-sm',
        className
      )}
    >
      {/* Back button */}
      {showBack && (
        <button
          onClick={() => router.back()}
          aria-label="Quay lại"
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-all',
            transparent
              ? 'bg-black/25 backdrop-blur-sm text-white hover:bg-black/40'
              : 'text-textMain hover:bg-surface-dark'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Title */}
      {title && (
        <h1 className={cn(
          'flex-1 text-center font-bold text-base',
          transparent ? 'text-white' : 'text-textMain',
          !showBack && 'ml-4'
        )}>
          {title}
        </h1>
      )}

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {showShare && (
          <button
            aria-label="Chia sẻ"
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              transparent
                ? 'bg-black/25 backdrop-blur-sm text-white hover:bg-black/40'
                : 'text-textMain hover:bg-surface-dark'
            )}
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
        {showFavorite && (
          <button
            aria-label={isFavorited ? 'Bỏ yêu thích' : 'Yêu thích'}
            onClick={onFavoriteToggle}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              transparent
                ? 'bg-black/25 backdrop-blur-sm text-white hover:bg-black/40'
                : 'text-textMain hover:bg-surface-dark'
            )}
          >
            <Heart className={cn('w-4 h-4', isFavorited && 'fill-red-500 text-red-500')} />
          </button>
        )}
        {rightSlot}
      </div>
    </div>
  )
}
