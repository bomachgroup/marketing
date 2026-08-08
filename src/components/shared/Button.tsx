import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  icon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-navy text-white hover:bg-navy-dark active:bg-navy-dark disabled:opacity-50',
  secondary:
    'border border-border bg-surface text-text hover:bg-surface-1 active:bg-surface-2 disabled:opacity-50',
  danger:
    'bg-red text-white hover:opacity-90 active:opacity-80 disabled:opacity-50',
  ghost:
    'bg-transparent text-text-2 hover:bg-surface-1 active:bg-surface-2 disabled:opacity-50',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  icon,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl font-semibold shadow-xs transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-navy/20 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}