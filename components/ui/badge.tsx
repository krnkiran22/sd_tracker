import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        variant === 'default' && 'bg-secondary text-secondary-foreground',
        variant === 'success' && 'bg-[var(--success-muted)] text-[var(--success-foreground)]',
        variant === 'warning' && 'bg-[var(--warning-muted)] text-[var(--warning-foreground)]',
        variant === 'error'   && 'bg-[var(--error-muted)] text-[var(--error-foreground)]',
        variant === 'outline' && 'border border-border text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}
