'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, MapPin, Wand2, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/',        icon: Home,        label: 'Trang chủ' },
  { href: '/shop',    icon: ShoppingBag, label: 'Mua sắm' },
  { href: '/ai-chat', icon: Wand2,       label: 'AI Chat',   isCenter: true },
  { href: '/map',     icon: MapPin,      label: 'Bản đồ' },
  { href: '/account', icon: User,        label: 'Tài khoản' },
]

export function CustomerBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass border-t border-border/60 shadow-up safe-bottom z-40">
      <div className="flex justify-between items-center px-6 pt-3 pb-2">
        {navItems.map(({ href, icon: Icon, label, isCenter }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(href + '/')

          if (isCenter) {
            return (
              <Link key={href} href={href} className="relative -top-5 flex flex-col items-center">
                <div className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-surface transition-all duration-200',
                  isActive
                    ? 'bg-primary-600 border-primary-200 scale-110'
                    : 'bg-gradient-to-tr from-primary to-primary-400'
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={cn(
                  'absolute -bottom-4 text-[10px] font-bold w-max',
                  isActive ? 'text-primary' : 'text-textMuted'
                )}>
                  {label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 transition-colors duration-200 relative',
                isActive ? 'text-primary' : 'text-textMuted'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
              <span className={cn('text-[10px] font-semibold', isActive && 'font-bold text-primary')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
