import { useCallback, useEffect, useState } from 'react'
import { EmptyState, ErrorState, SkeletonChart, SkeletonKpiGrid, SkeletonTable, Topbar } from '../../shared'
import { marketingService } from '../../../services/api/marketingService'
import { parseApiError } from '../../../services/api/apiClient'
import { transformMarketingAnalytics, type AnalyticsBar, type AnalyticsCard, type AnalyticsTargetRow } from '../../../services/transformers/marketingTransformers'

type AnalyticsState = ReturnType<typeof transformMarketingAnalytics>

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'lead', label: 'Lead analytics' },
  { id: 'content', label: 'Content analytics' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'team', label: 'Team scorecard' },
]

function periodRange(period: string) {
  const end = new Date()
  const start = new Date(end)
  if (period === 'month') start.setDate(end.getDate() - 29)
  else if (period === 'quarter') start.setDate(end.getDate() - 89)
  else start.setDate(end.getDate() - 6)
  return { period_start: start.toISOString().slice(0, 10), period_end: end.toISOString().slice(0, 10) }
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState('week')
  const [activeTab, setActiveTab] = useState('overview')
  const [analytics, setAnalytics] = useState<AnalyticsState>(() => transformMarketingAnalytics({}))
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    setApiError('')
    try {
      const res = await marketingService.getMarketingAnalytics(periodRange(period))
      if (res.data) {
        setAnalytics(transformMarketingAnalytics(res.data))
      } else if (res.error) {
        setAnalytics(transformMarketingAnalytics({}))
        setApiError(parseApiError(res.error))
      }
    } catch (err) {
      setAnalytics(transformMarketingAnalytics({}))
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAnalytics()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadAnalytics])

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Analytics & reports" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-xs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'border border-border bg-surface shadow-xs text-text'
                    : 'text-text-3 hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {apiError ? <ErrorState message={apiError} onRetry={loadAnalytics} compact /> : null}

          {isLoading ? (
            <SkeletonKpiGrid />
          ) : analytics.cards.length === 0 ? (
            <EmptyState
              title="No analytics KPI cards"
              description="No backend analytics KPI cards were returned."
              icon="ti-chart-bar"
              compact
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {analytics.cards.map((card) => <KpiCard key={card.key} card={card} />)}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <BarChart title="Leads by source" rows={analytics.charts.leadsBySource} loading={isLoading} />
            <BarChart title="Leads by division" rows={analytics.charts.leadsByDivision} loading={isLoading} />
            <BarChart title="Weekly content output" rows={analytics.charts.contentOutput} loading={isLoading} />
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Target vs. actual</h3>
              <span className="text-[11px] font-medium text-text-3">{tabs.find((tab) => tab.id === activeTab)?.label}</span>
            </div>

            <TargetTable rows={analytics.targetRows} loading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ card }: { card: AnalyticsCard }) {
  return (
    <div className="space-y-1 rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <div className="text-xs font-medium text-text-3">{card.label}</div>
      <div className="text-2xl font-extrabold tracking-tight text-text">{card.value}</div>
      {card.delta && <div className="text-xs font-bold text-emerald-600">{card.delta}</div>}
      {card.foot && <div className="text-xs font-medium text-text-3">{card.foot}</div>}
    </div>
  )
}

function BarChart({ title, rows, loading }: { title: string; rows: AnalyticsBar[]; loading: boolean }) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  if (loading) return <SkeletonChart bars={rows.length || 6} />

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <h4 className="text-xs font-bold text-text">{title}</h4>
      {rows.length === 0 ? (
        <EmptyState title="No chart data" description="No data was returned for this chart." compact />
      ) : (
        <>
          <div className="flex h-24 items-end justify-between gap-1.5 border-b border-border/60 px-2 pt-4">
            {rows.map((row) => (
              <div key={row.label} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                <div className="w-full rounded-t" style={{ height: `${Math.max(8, (row.value / max) * 100)}%`, backgroundColor: row.color }} />
              </div>
            ))}
          </div>
          <div className="grid gap-1 text-[10px] font-bold text-text-3" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
            {rows.map((row) => <span key={row.label} className="truncate text-center">{row.label}</span>)}
          </div>
        </>
      )}
    </div>
  )
}

function TargetTable({ rows, loading }: { rows: AnalyticsTargetRow[]; loading: boolean }) {
  if (loading) return <SkeletonTable rows={5} columns={5} />

  if (rows.length === 0) {
    return (
      <EmptyState title="No target rows" description="No target rows were returned." compact />
    )
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full table-fixed border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border font-bold text-text-3">
            <th className="px-3 py-2.5">Metric</th>
            <th className="px-3 py-2.5 text-right">Target</th>
            <th className="px-3 py-2.5 text-right">Actual</th>
            <th className="hidden px-3 py-2.5 text-right sm:table-cell">%</th>
            <th className="hidden w-40 px-3 py-2.5 md:table-cell">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 font-medium">
          {rows.map((row) => (
            <tr key={row.metric} className="hover:bg-surface-1">
              <td className="break-words px-3 py-2.5 font-bold text-text">{row.metric}</td>
              <td className="px-3 py-2.5 text-right text-text-3">{row.target}</td>
              <td className={`px-3 py-2.5 text-right font-bold ${row.valueColor}`}>{row.actual}</td>
              <td className={`hidden px-3 py-2.5 text-right font-bold sm:table-cell ${row.valueColor}`}>{row.pct}</td>
              <td className="hidden px-3 py-2.5 md:table-cell">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: row.pct }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
