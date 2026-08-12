import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, label, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-textMuted uppercase tracking-wide mb-1.5"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex items-center gap-2 bg-surface border rounded-xl px-3 py-2.5 transition-all duration-200',
            'focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20',
            error ? 'border-danger' : 'border-border',
            className
          )}
        >
          {leftIcon && (
            <span className="text-textMuted flex-shrink-0">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className="flex-1 bg-transparent border-none outline-none text-sm text-textMain placeholder:text-textMuted/60 min-w-0"
            {...props}
          />
          {rightIcon && (
            <span className="text-textMuted flex-shrink-0">{rightIcon}</span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-danger font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
