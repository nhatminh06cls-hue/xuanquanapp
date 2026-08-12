import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

// ── CARD ──────────────────────────────────────────────────
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-2xl border border-border shadow-soft',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pb-0', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-0 flex items-center', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardContent, CardFooter }

// ── BADGE ─────────────────────────────────────────────────
const badgeVariants = cva(
  'inline-flex items-center gap-1 font-bold rounded-md transition-colors text-[10px] px-2 py-0.5',
  {
    variants: {
      variant: {
        primary:   'bg-primary/10 text-primary',
        secondary: 'bg-secondary/15 text-secondary',
        success:   'bg-success/10 text-success',
        danger:    'bg-danger/10 text-danger',
        warning:   'bg-yellow-100 text-yellow-700',
        info:      'bg-info/10 text-info',
        muted:     'bg-surface-dark text-textMuted',
        white:     'bg-white text-textMain border border-border shadow-sm',
      },
    },
    defaultVariants: { variant: 'primary' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

// ── DIVIDER ───────────────────────────────────────────────
function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3 my-4', className)}>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    )
  }
  return <hr className={cn('border-border my-4', className)} />
}

export { Divider }

// ── AVATAR ────────────────────────────────────────────────
interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const avatarSizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' }

function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  return (
    <div className={cn('rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 border border-border', avatarSizes[size], className)}>
      {src ? (
        <img src={src} alt={name ?? 'avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-primary">{initials}</span>
      )}
    </div>
  )
}

export { Avatar }
