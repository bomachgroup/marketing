import type { ReactNode } from 'react'
import { AppIcon } from './AppIcon'

type StatePanelType = 'loading' | 'empty' | 'error' | 'success' | 'info' | 'warning'

interface StatePanelProps {
  type: StatePanelType
  title: string
  description?: string
  icon?: string
  action?: ReactNode
  compact?: boolean
  className?: string
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  compact?: boolean
  className?: string
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: string
  compact?: boolean
  className?: string
}

const stateStyles: Record<StatePanelType, { icon: string; frame: string; glyph: string }> = {
  loading: {
    icon: 'loader-2',
    frame: 'border-border bg-surface-1 text-text-3',
    glyph: 'border-border bg-surface text-text-3',
  },
  empty: {
    icon: 'folder-open',
    frame: 'border-dashed border-border bg-surface-1 text-text-3',
    glyph: 'border-border bg-surface text-text-3',
  },
  error: {
    icon: 'alert-circle',
    frame: 'border-rose-200 bg-rose-50 text-rose-900',
    glyph: 'border-rose-200 bg-white text-rose-600',
  },
  success: {
    icon: 'circle-check',
    frame: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    glyph: 'border-emerald-200 bg-white text-emerald-600',
  },
  info: {
    icon: 'info-circle',
    frame: 'border-blue-200 bg-blue-50 text-blue-900',
    glyph: 'border-blue-200 bg-white text-blue-600',
  },
  warning: {
    icon: 'alert-triangle',
    frame: 'border-amber-200 bg-amber-50 text-amber-900',
    glyph: 'border-amber-200 bg-white text-amber-600',
  },
}

export function StatePanel({
  type,
  title,
  description,
  icon,
  action,
  compact = false,
  className = '',
}: StatePanelProps) {
  const styles = stateStyles[type]
  const iconName = icon?.replace(/^ti-/, '') || styles.icon

  return (
    <div
      className={`flex min-w-0 items-start gap-3 rounded-xl border ${styles.frame} ${
        compact ? 'px-3 py-3' : 'px-4 py-5'
      } ${className}`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg border ${styles.glyph} ${
          compact ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-base'
        }`}
      >
        <AppIcon name={iconName} size={compact ? 14 : 18} className={type === 'loading' ? 'animate-spin' : ''} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className={`${compact ? 'text-xs' : 'text-sm'} break-words font-bold leading-snug`}>
          {title}
        </h4>
        {description ? (
          <p className="mt-1 break-words text-xs font-medium leading-relaxed opacity-75">{description}</p>
        ) : null}
        {action ? <div className="mt-3 flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </div>
  )
}

export function LoadingState({ title = 'Please wait', compact = false }: { title?: string; compact?: boolean }) {
  return <StatePanel type="loading" title={title} compact={compact} />
}

export function EmptyState({ title, description, action, icon, compact = false, className = '' }: EmptyStateProps) {
  return (
    <StatePanel
      type="empty"
      title={title}
      description={description}
      action={action}
      icon={icon}
      compact={compact}
      className={className}
    />
  )
}

export function ErrorState({ message, onRetry, compact = false, className = '' }: ErrorStateProps) {
  return (
    <StatePanel
      type="error"
      title="Could not load data"
      description={message}
      compact={compact}
      className={className}
      action={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50"
          >
            Retry
          </button>
        ) : undefined
      }
    />
  )
}

export function SuccessState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}) {
  return <StatePanel type="success" title={title} description={description} action={action} compact={compact} />
}

export function InlineState({
  type,
  message,
  icon,
  className = '',
}: {
  type: StatePanelType
  message: string
  icon?: string
  className?: string
}) {
  const styles = stateStyles[type]
  const iconName = icon?.replace(/^ti-/, '') || styles.icon
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${styles.frame} ${className}`}>
      <AppIcon name={iconName} size={14} className={`shrink-0 ${type === 'loading' ? 'animate-spin' : ''}`} />
      <span className="min-w-0 break-words">{message}</span>
    </div>
  )
}

export function BusyLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />
      <span>{children}</span>
    </>
  )
}
