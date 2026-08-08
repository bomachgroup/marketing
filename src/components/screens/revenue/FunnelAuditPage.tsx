import { useCallback, useEffect, useMemo, useState } from 'react'
import { BusyLabel, EmptyState, ErrorState, SkeletonCardGrid, SkeletonList, Topbar } from '../../shared'
import { parseApiError } from '../../../services/api/apiClient'
import { marketingService } from '../../../services/api/marketingService'
import { AppIcon } from '../../shared/AppIcon'

type UnknownRecord = Record<string, unknown>

type FunnelStage = {
  id: string
  name: string
  count: number
  rate: number
  status: string
  leak: boolean
}

type LeakRow = {
  id: string
  tag: string
  pct: number
  title: string
  desc: string
  fix: string
}

type DivisionRow = {
  id: string
  division: string
  leads: number
  revenue: string
  conversion: string
  leak: string
}

type ActionRow = {
  id: string
  title: string
  meta: string
}

const PERIOD_RANGES: Record<string, number> = {
  today: 1,
  week: 7,
  month: 30,
  quarter: 90,
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function record(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const data = record(value)
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.stages)) return data.stages
  if (Array.isArray(data.leaks)) return data.leaks
  if (Array.isArray(data.alerts)) return data.alerts
  return []
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePercent(value: unknown, fallback = 0) {
  const parsed = num(value, fallback)
  const pct = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed
  return Math.max(0, Math.min(100, Math.round(pct)))
}

function formatMoney(value: unknown) {
  const amount = num(value)
  if (amount >= 1_000_000_000) return `NGN ${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `NGN ${(amount / 1_000_000).toFixed(amount % 1_000_000 ? 1 : 0)}M`
  if (amount >= 1_000) return `NGN ${Math.round(amount / 1_000).toLocaleString()}K`
  return `NGN ${Math.round(amount).toLocaleString()}`
}

function dateFromPeriod(period: string) {
  const days = PERIOD_RANGES[period] || 7
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days + 1)
  return {
    period_start: start.toISOString().slice(0, 10),
    period_end: end.toISOString().slice(0, 10),
  }
}

function transformStages(value: unknown): FunnelStage[] {
  const stages = asArray(value)
  const counts = stages.map((stage) => {
    const data = record(stage)
    return num(data.leads ?? data.count ?? data.reach)
  })
  const largestDropIndex = counts.reduce((largest, count, index) => {
    if (index === 0) return largest
    const previous = counts[index - 1] || 0
    const drop = previous > 0 ? ((previous - count) / previous) * 100 : 0
    const currentLargestDrop = largest > 0 && counts[largest - 1] > 0 ? ((counts[largest - 1] - counts[largest]) / counts[largest - 1]) * 100 : 0
    return drop > currentLargestDrop ? index : largest
  }, 0)

  return stages.map((stage, index) => {
    const data = record(stage)
    const count = counts[index] || 0
    const rate = normalizePercent(data.conversion_rate)
    const leak = index === largestDropIndex && largestDropIndex > 0
    return {
      id: text(data.name || data.slug, `stage-${index}`),
      name: text(data.display_name || data.name, `Stage ${index + 1}`).toUpperCase(),
      count,
      rate,
      status: leak ? 'Largest leak' : text(data.status, 'Monitor'),
      leak,
    }
  })
}

function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function transformLeaks(dropOffData: unknown, auditData: unknown): LeakRow[] {
  const alerts = asArray(dropOffData).length ? asArray(dropOffData) : asArray(record(auditData).largest_leaks || record(auditData).leaks)
  return alerts.slice(0, 3).map((alert, index) => {
    const data = record(alert)
    const suggestions = asArray(data.suggestions).map((item) => text(item)).filter(Boolean)
    const from = text(data.from_stage || data.stage || data.source_stage, 'Funnel stage')
    const to = text(data.to_stage || data.next_stage || data.target_stage)
    const rawTitle = text(data.title || data.name, to ? `${from} to ${to}` : from)
    return {
      id: text(data.id, `leak-${index}`),
      tag: text(data.tag, `Leak ${index + 1}`),
      pct: normalizePercent(data.loss_pct || data.drop_off_pct || data.pct),
      title: capitalizeFirst(rawTitle),
      desc: text(data.description || data.desc, 'Backend identified this as a material funnel drop-off.'),
      fix: suggestions[0] || text(data.fix || data.recommendation || data.next_action, 'Review owner, evidence, cadence, and next action discipline.'),
    }
  })
}

function transformDivisions(auditData: unknown): DivisionRow[] {
  return asArray(record(auditData).divisions || record(auditData).division_breakdown || record(auditData).by_division).map((item, index) => {
    const data = record(item)
    return {
      id: text(data.id, `division-${index}`),
      division: text(data.division_display || data.division || data.name, `Division ${index + 1}`),
      leads: num(data.leads || data.lead_count || data.total_leads),
      revenue: formatMoney(data.revenue || data.value || data.pipeline_value),
      conversion: `${normalizePercent(data.conversion_rate || data.lead_to_win)}%`,
      leak: capitalizeFirst(text(data.biggest_leak || data.leak || data.stage, 'Not specified')),
    }
  })
}

function transformActions(auditData: unknown, activityData: unknown): ActionRow[] {
  const auditActions = asArray(record(auditData).actions || record(auditData).corrective_actions || record(auditData).recommendations)
  const source = auditActions.length ? auditActions : asArray(activityData)
  return source.slice(0, 6).map((item, index) => {
    const data = record(item)
    const leadName = text(data.lead_name || data.full_name || data.name)
    return {
      id: text(data.id, `action-${index}`),
      title: text(data.title || data.action || data.next_action || data.recommendation || data.status, 'Funnel follow-up required'),
      meta: text(data.meta || data.owner_name || data.assigned_role || data.stage || leadName, 'Backend funnel activity'),
    }
  })
}

export function FunnelAuditPage() {
  const [period, setPeriod] = useState('week')
  const [summary, setSummary] = useState<unknown>(null)
  const [auditData, setAuditData] = useState<unknown>(null)
  const [dropOffData, setDropOffData] = useState<unknown>(null)
  const [activityData, setActivityData] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const loadAudit = useCallback(async () => {
    setIsLoading(true)
    setApiError('')

    try {
      const range = dateFromPeriod(period)
      const [summaryRes, breakdownRes, alertsRes, auditRes, activityRes] = await Promise.all([
        marketingService.getFunnelSummary(),
        marketingService.getFunnelConversionBreakdown(),
        marketingService.getFunnelDropOffAlerts({ threshold: 50 }),
        marketingService.getFunnelLeaks(range),
        marketingService.getFunnelLeadActivityLog({ limit: 20 }),
      ])

      const errors = [summaryRes.error, breakdownRes.error, alertsRes.error, auditRes.error, activityRes.error].filter(Boolean)
      if (errors.length) setApiError(parseApiError(errors[0]))

      setSummary(summaryRes.data || breakdownRes.data || null)
      setDropOffData(alertsRes.data || null)
      setAuditData(auditRes.data || null)
      setActivityData(activityRes.data || null)
    } catch (err) {
      setApiError(parseApiError(err))
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAudit()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadAudit])

  const funnelStages = useMemo(() => transformStages(record(summary).stages || summary), [summary])
  const largestLeaks = useMemo(() => transformLeaks(dropOffData, auditData), [dropOffData, auditData])
  const divisionsData = useMemo(() => transformDivisions(auditData), [auditData])
  const actions = useMemo(() => transformActions(auditData, activityData), [auditData, activityData])

  return (
    <div className="flex min-h-0 flex-col">
      <Topbar title="Funnel leak audit" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-text">Funnel Leak Audit</h3>
            <p className="text-xs text-text-3">Find where prospects disappear and assign corrective action</p>
          </div>
          <button
            type="button"
            onClick={() => void loadAudit()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <BusyLabel>Auditing...</BusyLabel> : <><AppIcon name="scan" size={14} /> Run audit</>}
          </button>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={() => void loadAudit()} compact /> : null}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          {isLoading ? (
            <div className="col-span-full">
              <SkeletonCardGrid cards={6} />
            </div>
          ) : funnelStages.length ? (
            funnelStages.map((stage) => (
              <div key={stage.id} className={`space-y-1 rounded-xl border p-3.5 ${stage.leak ? 'border-rose-200 bg-rose-50/70' : 'border-blue-200 bg-blue-50/70'}`}>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-3">{stage.name}</div>
                <div className="text-xl font-extrabold tracking-tight text-text">{stage.count.toLocaleString()}</div>
                <div className="text-[11px] font-medium text-text-3">Conversion: {stage.rate}%</div>
                <div className={`text-[10.5px] font-bold ${stage.leak ? 'text-rose-600' : 'text-emerald-700'}`}>{stage.status}</div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState title="No funnel stages" description="No funnel stages were returned." icon="ti-filter-dollar" compact />
            </div>
          )}
        </div>

        <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-text">Largest revenue leaks</h3>
            <p className="text-xs text-text-3">Prioritised by lost value, not vanity metrics</p>
          </div>

          {isLoading ? (
            <SkeletonCardGrid cards={3} />
          ) : largestLeaks.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {largestLeaks.map((leak) => (
                <div key={leak.id} className="space-y-2 rounded-xl border border-border/80 bg-surface-1 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">{leak.tag}</span>
                    <span className="text-xl font-extrabold tracking-tight text-rose-600">{leak.pct}%</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text">{leak.title}</h4>
                    <p className="mt-0.5 text-[11px] font-medium leading-snug text-text-3">{leak.desc}</p>
                  </div>
                  <div className="border-t border-border/60 pt-2 text-[11px] font-bold leading-snug text-navy">Fix: {leak.fix}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No drop-off alerts" description="No drop-off alerts were returned." icon="ti-alert-triangle" compact />
          )}
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <div className="border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Conversion by division</h3>
            </div>

            {isLoading ? (
              <SkeletonList rows={4} />
            ) : divisionsData.length ? (
              <div className="space-y-2">
                {divisionsData.map((division) => (
                  <div key={division.id} className="grid grid-cols-1 gap-2 rounded-xl border border-border/80 bg-surface-1 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_64px_96px_72px_minmax(0,1fr)]">
                    <span className="truncate font-bold text-text">{division.division}</span>
                    <span>{division.leads.toLocaleString()}</span>
                    <span className="font-bold">{division.revenue}</span>
                    <span>{division.conversion}</span>
                    <span className="truncate text-text-3">{division.leak}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No division breakdown" description="No division breakdown was returned." icon="ti-chart-bar" compact />
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Corrective action register</h3>
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">{actions.length} returned</span>
            </div>

            {isLoading ? (
              <SkeletonList rows={4} />
            ) : actions.length ? (
              <div className="space-y-2">
                {actions.map((action) => (
                  <div key={action.id} className="rounded-xl border border-border/80 bg-surface-1 p-3">
                    <h4 className="truncate text-xs font-bold text-text">{action.title}</h4>
                    <p className="mt-0.5 truncate text-[10.5px] font-medium text-text-3">{action.meta}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No corrective actions" description="No corrective actions or funnel activity rows were returned." icon="ti-list-check" compact />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
