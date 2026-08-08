import { AppIcon } from './AppIcon'

interface KCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: string
  trendUp?: boolean
}

export default function KCard({ label, value, sub, trend, trendUp }: KCardProps) {
  return (
    <div className="flex flex-col justify-between gap-1.5 rounded-2xl border border-border bg-surface p-4.5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-3">{label}</span>
      <span className="text-2xl font-bold tracking-tight text-text" style={{ fontFamily: 'var(--font-heading)' }}>
        {value}
      </span>
      {(sub || trend) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                trendUp === undefined
                  ? 'text-text-3'
                  : trendUp
                    ? 'text-emerald-600'
                    : 'text-rose-600'
              }`}
            >
              {trendUp !== undefined && (
                <AppIcon name={trendUp ? 'trending-up' : 'trending-down'} size={12} />
              )}
              {trend}
            </span>
          )}
          {sub && <span className="text-text-3 font-medium">{sub}</span>}
        </div>
      )}
    </div>
  )
}
