import { useState, useRef, useEffect } from 'react'
import { AppIcon } from './AppIcon'

export interface SelectOption {
  value: string
  label: string
  icon?: string
}

interface SelectProps {
  options: SelectOption[] | string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  prefixIcon?: string
  fullWidth?: boolean
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  size = 'md',
  disabled = false,
  prefixIcon,
  fullWidth = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const formattedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  const selectedOpt = formattedOptions.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  const heightClass = size === 'sm' ? 'h-8 text-[11px] px-2.5' : 'h-9 text-xs px-3'

  return (
    <div ref={containerRef} className={`relative min-w-0 ${fullWidth ? 'block w-full' : 'inline-block'} text-left ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-surface ${heightClass} font-semibold text-text shadow-xs hover:border-navy/40 focus:border-navy focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex min-w-0 items-center gap-2 truncate">
          {prefixIcon && <AppIcon name={prefixIcon} size={size === 'sm' ? 13 : 15} className="text-text-3 shrink-0" />}
          {selectedOpt?.icon && <AppIcon name={selectedOpt.icon} size={size === 'sm' ? 13 : 15} className="shrink-0 text-navy" />}
          <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        </div>
        <AppIcon
          name="chevron-down"
          size={14}
          className={`shrink-0 text-text-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-navy' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-[9999] min-w-full w-max max-w-[min(240px,calc(100vw-1.5rem))] max-h-60 overflow-y-auto rounded-2xl border border-border/80 bg-surface p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {formattedOptions.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`flex w-full items-center justify-start gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-navy/10 text-navy font-bold'
                    : 'text-text hover:bg-surface-1 hover:text-navy'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  {opt.icon && <AppIcon name={opt.icon} size={14} className={isSelected ? 'text-navy' : 'text-text-3'} />}
                  <span className="truncate">{opt.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
