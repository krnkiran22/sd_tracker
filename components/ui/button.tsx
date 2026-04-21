import * as React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'xs'
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap outline-none',
        variant === 'default'     && 'bg-primary text-primary-foreground hover:bg-primary/85',
        variant === 'outline'     && 'border border-border bg-background hover:bg-muted',
        variant === 'ghost'       && 'hover:bg-muted hover:text-foreground',
        variant === 'destructive' && 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        size === 'default' && 'h-8 px-3',
        size === 'sm'      && 'h-7 px-2.5',
        size === 'xs'      && 'h-6 px-2 text-[10px]',
        className
      )}
      {...props}
    />
  )
}
