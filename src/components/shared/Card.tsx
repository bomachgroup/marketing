import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}

export default function Card({ title, children, action, className = '' }: CardProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-border bg-surface shadow-xs transition-shadow duration-200 hover:shadow-sm ${className}`}
    >
      {title && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border/80 px-4 py-3 sm:px-5 sm:py-3.5">
          <h3 className="min-w-0 break-words text-sm font-bold text-text" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h3>
          {action && <div className="min-w-0 shrink-0">{action}</div>}
        </div>
      )}
      <div className="min-w-0 p-4 sm:p-5">{children}</div>
    </div>
  )
}
