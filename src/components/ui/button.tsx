import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:  'bg-primary text-white shadow-md hover:bg-primary-600 active:bg-primary-700',
        secondary:'bg-secondary text-textMain shadow-md hover:bg-secondary/90',
        outline:  'border-2 border-primary text-primary bg-transparent hover:bg-primary/5',
        ghost:    'text-textMuted hover:text-primary hover:bg-primary/5',
        danger:   'bg-danger text-white hover:bg-red-700',
        surface:  'bg-surface-dark border border-border text-textMain hover:bg-border',
        white:    'bg-white border border-border text-textMain shadow-soft hover:bg-surface',
      },
      size: {
        sm:   'h-8 px-3 text-xs rounded-lg',
        md:   'h-11 px-5 text-sm',
        lg:   'h-13 px-6 text-base',
        icon: 'h-10 w-10 rounded-full p-0',
        'icon-sm': 'h-8 w-8 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
