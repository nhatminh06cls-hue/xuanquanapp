'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, BarChart3, PlusCircle, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const vendorNavItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/products',     icon: ShoppingBag,     label: 'Sản phẩm' },
  { href: '/products/new', icon: PlusCircle,      label: 'Thêm mới', isNew: true },
  { href: '/orders',       icon: ClipboardList,   label: 'Đơn hàng', hasBadge: true },
  { href: '/reports',      icon: BarChart3,        label: 'Báo cáo' },
]

export function VendorBottomNav({ pendingOrderCount = 0 }: { pendingOrderCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border shadow-up safe-bottom z-40">
      <div className="flex justify-around items-stretch px-1 pt-2 pb-2">
        {vendorNavItems.map(({ href, icon: Icon, label, hasBadge, isNew }) => {
          const isActive  = !isNew && (pathname === href || pathname.startsWith(href + '/'))
            && !(href === '/products' && pathname.startsWith('/products/new'))
          const showBadge = hasBadge && pendingOrderCount > 0

          return (
            <Link key={href} href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-all duration-200 relative',
                isActive && !isNew ? 'text-primary bg-primary/8' : 'text-textMuted hover:text-primary',
                isNew ? 'text-primary' : ''
              )}>
              {isActive && !isNew && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
              {isNew ? (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md -mt-4 mb-0.5">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className={cn('text-[10px]', isActive ? 'font-bold' : 'font-semibold')}>{label}</span>
              {showBadge && (
                <span className="absolute top-1 right-3 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {pendingOrderCount > 9 ? '9+' : pendingOrderCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

