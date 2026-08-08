import { useLayoutEffect, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShell } from '../../context/ShellContext'
import { useAuth } from '../../context/AuthContext'
import { AppIcon } from './AppIcon'
import { Select, type SelectOption } from './Select'

interface TopbarProps {
  title: string
  period?: string
  onPeriodChange?: (period: string) => void
  periodOptions?: SelectOption[] | string[]
  hidePeriod?: boolean
  action?: ReactNode
}

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today', icon: 'clock' },
  { value: 'week', label: 'This week', icon: 'calendar' },
  { value: 'month', label: 'This month', icon: 'calendar-1' },
  { value: 'quarter', label: 'This quarter', icon: 'chart-square' },
]

function DefaultTopbarActions() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canOpenCampaigns = hasPermission('campaigns', 'view')
  const canCreateLead = hasPermission('new-lead', 'view')

  return (
    <>
      {canOpenCampaigns ? (
        <button
          type="button"
          onClick={() => navigate({ to: '/campaigns' })}
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red bg-red px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#A80000] active:scale-95 min-[420px]:flex-none sm:px-3"
        >
          <AppIcon name="notification-bing" size={15} />
          <span className="truncate">Campaign</span>
        </button>
      ) : null}

      {canCreateLead ? (
        <button
          type="button"
          onClick={() => navigate({ to: '/new-lead' })}
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-navy bg-navy px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95 min-[420px]:flex-none sm:px-3"
        >
          <AppIcon name="plus" size={15} />
          <span className="truncate">New lead</span>
        </button>
      ) : null}
    </>
  )
}

export function Topbar({
  title,
  period = 'week',
  onPeriodChange,
  periodOptions = PERIOD_OPTIONS,
  hidePeriod = false,
  action,
}: TopbarProps) {
  const { setTopbarConfig } = useShell()

  useLayoutEffect(() => {
    setTopbarConfig({ title, period, onPeriodChange, periodOptions, hidePeriod, action })
    return () => setTopbarConfig(null)
  }, [action, hidePeriod, onPeriodChange, period, periodOptions, setTopbarConfig, title])

  return null
}

export function ShellTopbar({ fallbackTitle }: { fallbackTitle: string }) {
  const { setMobileOpen, topbarConfig } = useShell()
  const title = topbarConfig?.title || fallbackTitle
  const period = topbarConfig?.period || 'week'
  const periodOptions = topbarConfig?.periodOptions || PERIOD_OPTIONS
  const showPeriod = !topbarConfig?.hidePeriod
  const action = topbarConfig?.action ?? <DefaultTopbarActions />

  return (
    <div className="relative z-40 flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface/95 px-3 py-2.5 shadow-xs backdrop-blur-md sm:gap-2.5 sm:px-4 sm:py-3">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-3 hover:bg-surface-1 transition-all active:scale-95 md:hidden"
        aria-label="Open navigation"
      >
        <AppIcon name="hamberger-menu" size={18} />
      </button>

      <div
        className="min-w-0 flex-1 basis-[calc(100%-2.5rem)] truncate text-[15px] font-bold text-text sm:basis-auto"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {title}
      </div>

      {showPeriod ? (
        <div className="order-3 flex w-full min-w-0 items-center gap-1.5 text-xs text-text-3 sm:order-none sm:w-auto">
          <span className="hidden sm:inline font-medium text-text-3">Period:</span>
          <Select
            options={periodOptions}
            value={period}
            size="sm"
            onChange={(val) => topbarConfig?.onPeriodChange?.(val)}
            fullWidth
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 min-[420px]:flex-none">
        {action}
      </div>
    </div>
  )
}
