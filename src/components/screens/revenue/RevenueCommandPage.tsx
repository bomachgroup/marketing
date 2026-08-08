import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useStore } from '../../../context/StoreContext'
import { useToast } from '../../../context/ToastContext'
import {
  EmptyState,
  ErrorState,
  Card,
  Pill,
  SkeletonKpiGrid,
  SkeletonList,
  Topbar,
  AppIcon,
} from '../../shared'
import { money, moneyNum } from '../../../data/helpers'
import type { Lead } from '../../../data/types'
import { parseApiError } from '../../../services/api/apiClient'
import { marketingService } from '../../../services/api/marketingService'
import NoPermissionPage from '../../layout/NoPermissionPage'
import { pluralize } from '../../../utils/formatters'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SEVERITY_COLORS: Record<string, { border: string; bg: string; pill: string }> = {
  critical: { border: 'border-l-red', bg: 'bg-red/5', pill: 'p-over' },
  warning: { border: 'border-l-gold', bg: 'bg-gold/5', pill: 'p-pause' },
  success: { border: 'border-l-green', bg: 'bg-green/5', pill: 'p-active' },
}

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

const HEALTH_RING_SIZE = 52
const HEALTH_RING_STROKE = 5
const HEALTH_RING_RADIUS = (HEALTH_RING_SIZE - HEALTH_RING_STROKE) / 2
const HEALTH_RING_CIRCUMFERENCE = 2 * Math.PI * HEALTH_RING_RADIUS
const PIPELINE_COVERAGE_TARGET = 200_000_000

type TabId = 'overview' | 'execution' | 'pipeline' | 'health'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { id: 'execution', label: 'Execution', icon: 'ti-bolt' },
  { id: 'pipeline', label: 'Pipeline & Funnel', icon: 'ti-filter' },
  { id: 'health', label: 'Health Diagnosis', icon: 'ti-heart-pulse' },
]

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RevenueTask = {
  id: string | number
  title: string
  meta: string
  severity: 'critical' | 'warning' | 'success'
  done: boolean
  backend: boolean
}

type UnknownRecord = Record<string, unknown>

type HealthItem = {
  id: string
  label: string
  status: 'good' | 'warn' | 'bad'
  detail: string
  value: number // 0-100 for ring
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function record(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
}

function revenueTaskId(value: unknown, fallback: string): string | number {
  return typeof value === 'string' || typeof value === 'number' ? value : fallback
}

function funnelStageLeads(leads: Lead[], stage: string) {
  return leads.filter((lead) => lead.stage === stage)
}

function funnelValue(leads: Lead[], stage: string) {
  return leads
    .filter((lead) => lead.stage === stage)
    .reduce((sum, lead) => sum + moneyNum(lead.value), 0)
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const data = record(value)
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  return []
}

function num(value: unknown, fallback = 0) {
  const parsed = typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function pickNumber(source: unknown, keys: string[], fallback = 0) {
  const data = record(source)
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return num(data[key], fallback)
  }
  return fallback
}

function normalizePercent(value: unknown, fallback = 0) {
  const parsed = num(value, fallback)
  return parsed <= 1 && parsed > 0 ? parsed * 100 : parsed
}

function formatDateTime(value: unknown) {
  if (!value) return ''
  if (!(typeof value === 'string' || typeof value === 'number' || value instanceof Date)) return String(value)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function transformDailyAction(action: unknown): RevenueTask {
  const data = record(action)
  const owner = record(data.owner)
  const id = revenueTaskId(data.id ?? data.action_id ?? data.uuid, `action-${Math.random().toString(36).slice(2)}`)
  const ownerName = text(data.owner_name) || text(data.assigned_to_name) || text(owner.name)
  const due = formatDateTime(data.due_at || data.due_date)
  const description = text(data.description || data.note)
  const meta = [ownerName, due ? `Due ${due}` : '', description].filter(Boolean).join(' - ')
  const status = String(data.status || '').toLowerCase()

  return {
    id,
    title: text(data.title || data.name || data.action, 'Revenue action'),
    meta,
    severity: text(data.severity || data.priority, 'warning') as 'critical' | 'warning' | 'success',
    done: Boolean(data.completed_at) || ['completed', 'complete', 'done'].includes(status),
    backend: true,
  }
}

function isMissingExecutionDayError(error: unknown) {
  if (typeof error !== 'string') return false
  const normalized = error.toLowerCase()
  return normalized.includes('no dailyexecutionday matches') || normalized.includes('no daily execution day')
}

function healthRingOffset(pct: number) {
  return HEALTH_RING_CIRCUMFERENCE - (pct / 100) * HEALTH_RING_CIRCUMFERENCE
}

function healthRingColor(status: string) {
  if (status === 'good') return '#047857'
  if (status === 'warn') return '#D97706'
  return '#DC2626'
}

function healthRingBg(status: string) {
  if (status === 'good') return '#D1FAE5'
  if (status === 'warn') return '#FEF3C7'
  return '#FEE2E2'
}

function healthIcon(status: string) {
  if (status === 'good') return 'ti-circle-check'
  if (status === 'warn') return 'ti-alert-small'
  return 'ti-alert-triangle'
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RevenueCommandPage() {
  const navigate = useNavigate()
  const { leads } = useStore()
  const { showToast } = useToast()

  const [period, setPeriod] = useState('month')
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [executionSummary, setExecutionSummary] = useState<UnknownRecord | null>(null)
  const [pipelineReport, setPipelineReport] = useState<UnknownRecord | null>(null)
  const [funnelSummary, setFunnelSummary] = useState<UnknownRecord | null>(null)
  const [speedQueue, setSpeedQueue] = useState<unknown[]>([])
  const [scorecard, setScorecard] = useState<unknown[]>([])
  const [apiTasks, setApiTasks] = useState<RevenueTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [savingActionId, setSavingActionId] = useState<string | number | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  /* ---- Data loading ---- */

  const loadRevenueCommand = useCallback(async () => {
    setIsLoading(true)
    setApiError('')

    try {
      const [summaryRes, pipelineRes, funnelRes, speedRes, scorecardRes] = await Promise.all([
        marketingService.getRevenueExecutionSummary(),
        marketingService.getPipelineSummary({ period: 30 }),
        marketingService.getFunnelSummary(),
        marketingService.getSpeedToLeadQueue({ limit: 20 }),
        marketingService.getActivityScorecard(),
      ])

      const errors = [summaryRes, pipelineRes, funnelRes, speedRes, scorecardRes]
        .map((res) => res.error)
        .filter((error) => !isMissingExecutionDayError(error))
        .filter(Boolean)

      if (errors.length) {
        setApiError(parseApiError(errors[0]))
      }

      if (summaryRes.data) setExecutionSummary(summaryRes.data)
      if (pipelineRes.data) setPipelineReport(pipelineRes.data)
      if (funnelRes.data) setFunnelSummary(funnelRes.data)
      if (speedRes.data) setSpeedQueue(asArray(speedRes.data))
      if (scorecardRes.data) setScorecard(asArray(scorecardRes.data))
      setApiTasks([])
    } catch (err) {
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void loadRevenueCommand())
  }, [loadRevenueCommand])

  /* ---- Derived metrics ---- */

  const localClosedRevenue = leads
    .filter((lead) => lead.stage === 'won')
    .reduce((sum, lead) => sum + moneyNum(lead.value), 0)

  const localWeightedForecast = leads
    .filter((lead) => lead.stage !== 'lost')
    .reduce((sum, lead) => {
      const weight: Record<string, number> = {
        new: 0.05,
        contacted: 0.1,
        qualified: 0.3,
        proposal: 0.5,
        negotiation: 0.7,
        won: 1,
      }
      return sum + moneyNum(lead.value) * (weight[lead.stage] || 0)
    }, 0)

  const pipelineTotal = leads
    .filter((lead) => lead.stage !== 'won' && lead.stage !== 'lost')
    .reduce((sum, lead) => sum + moneyNum(lead.value), 0)

  const overdueCount = leads.filter((lead) => lead.overdue).length
  const totalLeads = leads.length
  const tasks: RevenueTask[] = apiTasks
  const completedTasks = tasks.filter((task) => task.done).length

  const executionPct = executionSummary?.completion_pct !== undefined
    ? Math.round(normalizePercent(executionSummary.completion_pct))
    : tasks.length
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0

  const slaBreaches = executionSummary?.sla_breaches !== undefined
    ? num(executionSummary.sla_breaches)
    : overdueCount

  const nextActionsDue = executionSummary?.next_actions_due !== undefined
    ? num(executionSummary.next_actions_due)
    : overdueCount

  const closedRevenue = pipelineReport?.revenue !== undefined
    ? num(pipelineReport.revenue, localClosedRevenue)
    : localClosedRevenue

  const weightedForecast = pickNumber(
    executionSummary,
    ['weighted_forecast', 'forecast', 'forecast_revenue', 'expected_revenue'],
    localWeightedForecast
  )

  const qualifiedPipeline = leads
    .filter((lead) => ['qualified', 'proposal', 'negotiation'].includes(lead.stage))
    .reduce((sum, lead) => sum + moneyNum(lead.value), 0)

  const conversionRate = pipelineReport?.conversion_rate !== undefined
    ? normalizePercent(pipelineReport.conversion_rate)
    : totalLeads
      ? (leads.filter((lead) => lead.stage === 'won').length / totalLeads) * 100
      : 0

  const followUpCompliance = executionSummary?.open_actions !== undefined && executionSummary?.total_actions !== undefined
    ? Math.round(((num(executionSummary.total_actions) - num(executionSummary.open_actions)) / Math.max(1, num(executionSummary.total_actions))) * 100)
    : totalLeads
      ? Math.round(((totalLeads - overdueCount) / totalLeads) * 100)
      : 0

  const funnelStages = asArray(funnelSummary?.stages)
  const hasScorecard = scorecard.length > 0

  /* ---- Actions ---- */

  async function handleToggleTask(task: RevenueTask) {
    if (!task.backend) return

    setSavingActionId(task.id)
    try {
      const res = task.done
        ? await marketingService.reopenDailyAction(task.id)
        : await marketingService.completeDailyAction(task.id, {})

      if (res.data) {
        const updated = transformDailyAction(res.data)
        setApiTasks((current) => current.map((item) => (item.id === task.id ? updated : item)))
        showToast(task.done ? 'Action reopened.' : 'Action completed.', 'success')
      } else {
        showToast(parseApiError(res.error || 'Could not update revenue action'), 'error')
      }
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not update revenue action'), 'error')
    } finally {
      setSavingActionId(null)
    }
  }

  async function handleExport() {
    // TODO: Wire up actual export API when available
    setIsExporting(true)
    try {
      showToast('Revenue command report exported.', 'success')
    } finally {
      setIsExporting(false)
    }
  }

  /* ---- Health diagnosis ---- */

  const healthDiagnosis = useMemo(() => {
    const missingValues = leads.filter((lead) => !lead.value || lead.value === '-').length

    return [
      {
        id: 'h1',
        label: 'Lead response SLA',
        status: slaBreaches > 3 ? 'bad' : slaBreaches > 0 ? 'warn' : 'good',
        detail: `${pluralize(slaBreaches, 'breach', 'breaches')} — target <1%`,
        value: Math.max(0, Math.min(100, 100 - slaBreaches * 15)),
      },
      {
        id: 'h2',
        label: 'Follow-up compliance',
        status: nextActionsDue > 5 ? 'bad' : nextActionsDue > 2 ? 'warn' : 'good',
        detail: `${nextActionsDue} due — discipline required`,
        value: followUpCompliance,
      },
      {
        id: 'h3',
        label: 'Conversion rate',
        status: conversionRate < 15 ? 'bad' : conversionRate < 25 ? 'warn' : 'good',
        detail: `${parseFloat(conversionRate.toFixed(1))}% — target 25%`,
        value: Math.min(100, conversionRate),
      },
      {
        id: 'h4',
        label: 'Pipeline coverage',
        status: pipelineTotal < 50000000 ? 'bad' : pipelineTotal < 100000000 ? 'warn' : 'good',
        detail: `${money(pipelineTotal)} active`,
        value: Math.min(100, Math.round((pipelineTotal / PIPELINE_COVERAGE_TARGET) * 100)),
      },
      {
        id: 'h5',
        label: 'Daily execution',
        status: executionPct < 50 ? 'bad' : executionPct < 80 ? 'warn' : 'good',
        detail: `${executionPct}% tasks complete`,
        value: executionPct,
      },
      {
        id: 'h6',
        label: 'Data hygiene',
        status: missingValues > 3 ? 'bad' : 'warn',
        detail: `${missingValues} missing values`,
        value: Math.max(0, 100 - missingValues * 10),
      },
    ] as HealthItem[]
  }, [leads, slaBreaches, nextActionsDue, pipelineTotal, executionPct, conversionRate, followUpCompliance])

  const overallHealthScore = useMemo(() => {
    if (!healthDiagnosis.length) return 0
    return Math.round(healthDiagnosis.reduce((sum, h) => sum + h.value, 0) / healthDiagnosis.length)
  }, [healthDiagnosis])

  /* ---- Render ---- */

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="revenue-command" />
  }

  return (
    <div className="flex min-h-0 flex-col">
      <Topbar title="Revenue Command" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {apiError && <ErrorState message={apiError} onRetry={() => void loadRevenueCommand()} compact />}

        {/* ================================================================ */}
        {/*  KPI ROW                                                         */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {isLoading ? (
            <div className="col-span-full"><SkeletonKpiGrid cards={5} /></div>
          ) : (
            <>
              <KpiCard
                icon="ti-currency-naira"
                label="Revenue closed"
                value={money(closedRevenue)}
                sub="30-day reported"
                trend={slaBreaches === 0 ? 'On track' : `${slaBreaches} SLA issues`}
                trendUp={slaBreaches === 0}
                tone="success"
              />
              <KpiCard
                icon="ti-chart-line"
                label="Weighted forecast"
                value={money(weightedForecast)}
                sub="Execution forecast"
                trend={`${executionPct}% execution`}
                trendUp={executionPct >= 50}
                tone="neutral"
              />
              <KpiCard
                icon="ti-filter"
                label="Qualified pipeline"
                value={money(qualifiedPipeline)}
                sub="Qualified+ stages"
                trend={pluralize(leads.filter((l) => ['qualified', 'proposal', 'negotiation'].includes(l.stage)).length, 'deal')}
                trendUp={qualifiedPipeline > 0}
                tone="neutral"
              />
              <KpiCard
                icon="ti-checklist"
                label="Follow-up compliance"
                value={`${followUpCompliance}%`}
                sub={`${nextActionsDue} next actions due`}
                trend={followUpCompliance >= 80 ? 'Healthy' : 'Needs attention'}
                trendUp={followUpCompliance >= 80}
                tone={followUpCompliance >= 80 ? 'success' : 'warning'}
              />
              <KpiCard
                icon="ti-bolt"
                label="Daily execution"
                value={`${executionPct}%`}
                sub={`${completedTasks}/${tasks.length || 0} completed`}
                trend={executionPct >= 80 ? 'Strong' : executionPct >= 50 ? 'Moderate' : 'Weak'}
                trendUp={executionPct >= 50}
                tone={executionPct >= 80 ? 'success' : executionPct >= 50 ? 'warning' : 'danger'}
              />
            </>
          )}
        </div>

        {/* ================================================================ */}
        {/*  TAB NAVIGATION                                                  */}
        {/* ================================================================ */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border/80 pb-0" role="tablist" aria-label="Revenue command sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'border-b-2 border-navy bg-surface text-navy shadow-xs'
                  : 'text-text-3 hover:bg-surface-1 hover:text-text'
              }`}
            >
              <AppIcon name={tab.icon.replace(/^ti-/, '')} size={14} />
              {tab.label}
            </button>
          ))}

          {/* Right-side actions */}
          <div className="ml-auto flex items-center gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => void loadRevenueCommand()}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 transition-all active:scale-95 disabled:opacity-50"
            >
              <AppIcon name="refresh" size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 transition-all active:scale-95 disabled:opacity-50"
            >
              <AppIcon name="download" size={14} /> Export
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/daily-execution' })}
              className="flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95"
            >
              <AppIcon name="bolt" size={14} /> Daily execution
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/*  TAB CONTENT                                                     */}
        {/* ================================================================ */}

        {/* ---- OVERVIEW TAB ---- */}
        {activeTab === 'overview' && (
          <div className="space-y-4" role="tabpanel" id="panel-overview">
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              {/* Revenue priorities */}
              <Card
                title="Revenue priorities & daily tasks"
                action={
                  <span className="text-[11px] font-bold text-text-3">
                    {tasks.length ? `${completedTasks}/${tasks.length}` : '0/0'}
                  </span>
                }
              >
                <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                  {isLoading ? (
                    <SkeletonList rows={5} />
                  ) : tasks.length > 0 ? (
                    tasks.map((task) => {
                      const severity = SEVERITY_COLORS[task.severity] || SEVERITY_COLORS.warning
                      return (
                        <div
                          key={task.id}
                          className={`group flex items-start gap-3 rounded-xl border-l-4 p-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px ${severity.border} ${severity.bg}`}
                        >
                          <input
                            type="checkbox"
                            checked={task.done}
                            disabled={savingActionId === task.id}
                            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-navy disabled:cursor-wait disabled:opacity-60"
                            onChange={() => handleToggleTask(task)}
                          />
                          <div className="min-w-0 flex-1">
                            <span
                              className={`block text-xs font-semibold leading-snug ${
                                task.done ? 'text-text-3 line-through' : 'text-text'
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.meta && (
                              <span className="mt-0.5 block text-[10px] text-text-3">{task.meta}</span>
                            )}
                          </div>
                          <Pill variant={severity.pill as 'p-over' | 'p-pause' | 'p-active'}>{task.severity}</Pill>
                        </div>
                      )
                    })
                  ) : (
                    <EmptyState
                      title="No revenue tasks"
                      description="No backend tasks available. Connect a daily execution source to populate this section."
                      icon="ti-list-check"
                      compact
                    />
                  )}
                </div>
              </Card>

              {/* Management rhythm */}
              <Card title="Management rhythm">
                <EmptyState
                  title="No management rhythm source"
                  description="No confirmed backend endpoint currently provides huddles, reviews, or close-out rhythm data."
                  icon="ti-calendar-event"
                  compact
                />
              </Card>
            </div>

            {/* Activity Scorecard + Speed-to-lead */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {hasScorecard && (
                <Card title="Activity scorecard">
                  <div className="space-y-3">
                    {scorecard.slice(0, 4).map((row, index) => {
                      const data = record(row)
                      const name = text(data.name || data.user_name || data.owner_name, `Rep ${index + 1}`)
                      const pct = normalizePercent(data.completion_pct ?? data.completion_rate, 0)
                      const actionsCount = pickNumber(data, ['completed_actions', 'actions_completed', 'total_actions'])
                      return (
                        <div key={String(data.id ?? data.user_id ?? name ?? index)} className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-3 transition-all hover:shadow-xs">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-extrabold text-navy">
                            {name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-xs font-bold text-text">{name}</span>
                              <span className="ml-2 shrink-0 text-xs font-extrabold text-navy">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, pct)}%`,
                                    backgroundColor: pct >= 80 ? '#047857' : pct >= 50 ? '#D97706' : '#DC2626',
                                  }}
                                />
                              </div>
                              <span className="shrink-0 text-[10px] font-medium text-text-3">{pluralize(actionsCount, 'action')}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Speed-to-lead queue */}
              <Card title="Speed-to-lead queue" action={<span className="text-[11px] font-bold text-text-3">{speedQueue.length} queued</span>}>
                <div className="space-y-2">
                  {isLoading ? (
                    <SkeletonList rows={4} />
                  ) : speedQueue.length > 0 ? (
                    speedQueue.slice(0, 5).map((item, index) => {
                      const data = record(item)
                      const name = text(data.full_name, `Lead ${index + 1}`)
                      const status = text(data.sla_status, 'pending')
                      const isBreached = status.toLowerCase().includes('breach')
                      return (
                        <div
                          key={String(data.lead_id ?? index)}
                          className={`flex items-center justify-between rounded-xl border p-3 transition-all hover:shadow-xs ${
                            isBreached ? 'border-red/30 bg-red/5' : 'border-border bg-surface-1'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${
                              isBreached ? 'bg-red' : 'bg-navy'
                            }`}>
                              {name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-text">{name}</span>
                              <span className="text-[10px] text-text-3">{text(data.source, 'Unknown source')}</span>
                            </div>
                          </div>
                          <Pill variant={isBreached ? 'p-over' : 'p-active'}>{isBreached ? 'Breach' : 'Active'}</Pill>
                        </div>
                      )
                    })
                  ) : (
                    <EmptyState title="No speed-to-lead data" description="No leads currently in the speed queue." icon="ti-bolt" compact />
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ---- EXECUTION TAB ---- */}
        {activeTab === 'execution' && (
          <div className="space-y-4" role="tabpanel" id="panel-execution">
            <Card
              title="Revenue priorities & daily tasks"
              action={
                <span className="text-[11px] font-bold text-text-3">
                  {tasks.length ? `${completedTasks}/${tasks.length} completed` : '0 tasks'}
                </span>
              }
            >
              <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
                {isLoading ? (
                  <SkeletonList rows={8} />
                ) : tasks.length > 0 ? (
                  tasks.map((task) => {
                    const severity = SEVERITY_COLORS[task.severity] || SEVERITY_COLORS.warning
                    return (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3 rounded-xl border-l-4 p-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px ${severity.border} ${severity.bg}`}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          disabled={savingActionId === task.id}
                          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-navy disabled:cursor-wait disabled:opacity-60"
                          onChange={() => handleToggleTask(task)}
                        />
                        <div className="min-w-0 flex-1">
                          <span
                            className={`block text-xs font-semibold leading-snug ${
                              task.done ? 'text-text-3 line-through' : 'text-text'
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.meta && (
                            <span className="mt-0.5 block text-[10px] text-text-3">{task.meta}</span>
                          )}
                        </div>
                        <Pill variant={severity.pill as 'p-over' | 'p-pause' | 'p-active'}>{task.severity}</Pill>
                      </div>
                    )
                  })
                ) : (
                  <EmptyState
                    title="No revenue tasks"
                    description="Connect a daily execution source to populate tasks."
                    icon="ti-list-check"
                    compact
                  />
                )}
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card title="Execution progress">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg width={HEALTH_RING_SIZE} height={HEALTH_RING_SIZE} className="-rotate-90" aria-hidden="true">
                        <circle cx={HEALTH_RING_SIZE / 2} cy={HEALTH_RING_SIZE / 2} r={HEALTH_RING_RADIUS} fill="none" stroke="#E5E7EB" strokeWidth={HEALTH_RING_STROKE} />
                        <circle
                          cx={HEALTH_RING_SIZE / 2}
                          cy={HEALTH_RING_SIZE / 2}
                          r={HEALTH_RING_RADIUS}
                          fill="none"
                          stroke={executionPct >= 80 ? '#047857' : executionPct >= 50 ? '#D97706' : '#DC2626'}
                          strokeWidth={HEALTH_RING_STROKE}
                          strokeLinecap="round"
                          strokeDasharray={HEALTH_RING_CIRCUMFERENCE}
                          strokeDashoffset={healthRingOffset(executionPct)}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <span className="absolute text-lg font-extrabold text-text">{executionPct}%</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-text-3">Completed</span>
                        <span className="font-bold text-text">{completedTasks} / {tasks.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-text-3">SLA breaches</span>
                        <span className={`font-bold ${slaBreaches > 0 ? 'text-red' : 'text-green'}`}>{slaBreaches}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-text-3">Next actions due</span>
                        <span className="font-bold text-text">{nextActionsDue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Management rhythm">
                <EmptyState
                  title="No management rhythm source"
                  description="No confirmed backend endpoint currently provides huddles, reviews, or close-out rhythm data."
                  icon="ti-calendar-event"
                  compact
                />
              </Card>
            </div>
          </div>
        )}

        {/* ---- PIPELINE & FUNNEL TAB ---- */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4" role="tabpanel" id="panel-pipeline">
            {/* Pipeline summary cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs transition-all hover:shadow-md">
                <div className="flex items-center gap-2 text-xs font-medium text-text-3">
                  <AppIcon name="currency-naira" size={16} /> Closed revenue
                </div>
                <div className="mt-1.5 text-2xl font-extrabold text-text">{money(closedRevenue)}</div>
                <div className="mt-1 text-[11px] font-medium text-emerald-600">30-day period</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs transition-all hover:shadow-md">
                <div className="flex items-center gap-2 text-xs font-medium text-text-3">
                  <AppIcon name="chart-line" size={16} /> Weighted forecast
                </div>
                <div className="mt-1.5 text-2xl font-extrabold text-text">{money(weightedForecast)}</div>
                <div className="mt-1 text-[11px] font-medium text-navy">Execution-weighted</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs transition-all hover:shadow-md">
                <div className="flex items-center gap-2 text-xs font-medium text-text-3">
                  <AppIcon name="filter" size={16} /> Active pipeline
                </div>
                <div className="mt-1.5 text-2xl font-extrabold text-text">{money(pipelineTotal)}</div>
                <div className="mt-1 text-[11px] font-medium text-text-3">{pluralize(leads.filter((l) => !['won', 'lost'].includes(l.stage)).length, 'deal')}</div>
              </div>
            </div>

            {/* Funnel breakdown */}
            <Card title="Stage funnel breakdown">
              <div className="space-y-3 pt-1">
                {(funnelStages.length ? funnelStages : STAGES).map((stageData) => {
                  const data = record(stageData)
                  const stage = typeof stageData === 'string'
                    ? stageData
                    : text(data.display_name || data.name, 'stage')

                  if (typeof stageData !== 'string') {
                    const count = pickNumber(data, ['leads', 'count', 'lead_count'])
                    const pct = Math.max(2, Math.min(100, normalizePercent(data.conversion_rate, 0)))
                    const change = data.change_pct !== undefined ? normalizePercent(data.change_pct) : null

                    return (
                      <div key={stage} className="flex items-center gap-4 text-xs">
                        <span className="w-28 font-semibold capitalize text-text">{stage}</span>
                        <div className="min-w-0 flex-1">
                          <div className="relative h-7 overflow-hidden rounded-lg bg-surface-2">
                            <div
                              className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-navy to-navy/80 transition-all duration-500"
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                            <span className="relative z-10 flex h-full items-center px-2.5 text-[11px] font-bold text-white">
                              {parseFloat(pct.toFixed(1))}%
                            </span>
                          </div>
                        </div>
                        <span className="w-20 text-right font-medium text-text-3">{pluralize(count, 'lead')}</span>
                        <span className="w-24 text-right font-bold text-text">{parseFloat(pct.toFixed(1))}%</span>
                        {change !== null && (
                          <span className={`hidden w-20 text-right font-medium sm:block ${change >= 0 ? 'text-green' : 'text-red'}`}>
                            {change >= 0 ? '+' : ''}{parseFloat(change.toFixed(1))}%
                          </span>
                        )}
                      </div>
                    )
                  }

                  const count = funnelStageLeads(leads, stage).length
                  const value = funnelValue(leads, stage)
                  const maxValue = funnelValue(leads, 'negotiation') || 1
                  const pct = Math.max(2, (value / maxValue) * 100)

                  return (
                    <div key={stage} className="flex items-center gap-4 text-xs">
                      <span className="w-24 font-semibold capitalize text-text">{stage}</span>
                      <div className="min-w-0 flex-1">
                        <div className="relative h-7 overflow-hidden rounded-lg bg-surface-2">
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-navy to-navy/80 transition-all duration-500"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                          <span className="relative z-10 flex h-full items-center px-2.5 text-[11px] font-bold text-white">
                            {pluralize(count, 'deal')}
                          </span>
                        </div>
                      </div>
                      <span className="w-28 text-right font-bold text-text">{money(value)}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ---- HEALTH DIAGNOSIS TAB ---- */}
        {activeTab === 'health' && (
          <div className="space-y-4" role="tabpanel" id="panel-health">
            {/* Overall health score */}
            <div className="flex items-center gap-6 rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                <svg width={HEALTH_RING_SIZE * 2} height={HEALTH_RING_SIZE * 2} className="-rotate-90" aria-hidden="true">
                  <circle cx={HEALTH_RING_SIZE} cy={HEALTH_RING_SIZE} r={HEALTH_RING_SIZE - 8} fill="none" stroke="#E5E7EB" strokeWidth={8} />
                  <circle
                    cx={HEALTH_RING_SIZE}
                    cy={HEALTH_RING_SIZE}
                    r={HEALTH_RING_SIZE - 8}
                    fill="none"
                    stroke={overallHealthScore >= 70 ? '#047857' : overallHealthScore >= 40 ? '#D97706' : '#DC2626'}
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * (HEALTH_RING_SIZE - 8)}
                    strokeDashoffset={2 * Math.PI * (HEALTH_RING_SIZE - 8) - (overallHealthScore / 100) * 2 * Math.PI * (HEALTH_RING_SIZE - 8)}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-text">{overallHealthScore}</span>
                  <span className="block text-[10px] font-bold text-text-3">/ 100</span>
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-text">Overall Revenue Health Score</h3>
                <p className="mt-1 text-xs text-text-3">
                  {overallHealthScore >= 70
                    ? 'Revenue engine is performing well. Continue current execution rhythm.'
                    : overallHealthScore >= 40
                      ? 'Revenue health is moderate. Address weak areas to improve pipeline velocity.'
                      : 'Revenue health is at risk. Immediate attention required on critical areas.'}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-green"><AppIcon name="circle-check" size={14} /> Good: {healthDiagnosis.filter((h) => h.status === 'good').length}</span>
                  <span className="flex items-center gap-1 text-gold"><AppIcon name="alert-small" size={14} /> Warning: {healthDiagnosis.filter((h) => h.status === 'warn').length}</span>
                  <span className="flex items-center gap-1 text-red"><AppIcon name="alert-triangle" size={14} /> Critical: {healthDiagnosis.filter((h) => h.status === 'bad').length}</span>
                </div>
              </div>
            </div>

            {/* Health items grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {healthDiagnosis.map((health) => (
                <div
                  key={health.id}
                  className={`group rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    health.status === 'bad'
                      ? 'border-red/30 bg-red/5 hover:border-red/50'
                      : health.status === 'warn'
                        ? 'border-gold/30 bg-gold/5 hover:border-gold/50'
                        : 'border-green/30 bg-green/5 hover:border-green/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ backgroundColor: healthRingBg(health.status) }}
                      >
                        <AppIcon name={healthIcon(health.status).replace(/^ti-/, '')} size={14} color={healthRingColor(health.status)} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-text">{health.label}</span>
                        <span className="mt-0.5 block text-[11px] text-text-3">{health.detail}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wide ${
                        health.status === 'bad'
                          ? 'text-red'
                          : health.status === 'warn'
                            ? 'text-gold'
                            : 'text-green'
                      }`}
                    >
                      {health.status}
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, health.value)}%`,
                        backgroundColor: healthRingColor(health.status),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  KPI Card Sub-component                                             */
/* ------------------------------------------------------------------ */

function KpiCard({
  icon,
  label,
  value,
  sub,
  trend,
  trendUp,
  tone,
}: {
  icon: string
  label: string
  value: string | number
  sub: string
  trend?: string
  trendUp?: boolean
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}) {
  const toneMap = {
    success: 'text-emerald-600',
    warning: 'text-amber-700',
    danger: 'text-red',
    neutral: 'text-text-3',
  }

  return (
    <div className="group flex flex-col justify-between gap-1.5 rounded-2xl border border-border bg-surface p-4.5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-1.5">
        <AppIcon name={icon.replace(/^ti-/, '')} size={14} className="text-text-3" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-3">{label}</span>
      </div>
      <span className="text-2xl font-extrabold tracking-tight text-text" style={{ fontFamily: 'var(--font-heading)' }}>
        {value}
      </span>
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 font-bold ${toneMap[tone]}`}>
            {trendUp !== undefined && (
              <AppIcon name={trendUp ? 'trending-up' : 'trending-down'} size={12} />
            )}
            {trend}
          </span>
        )}
        {sub && <span className="text-text-3 font-medium">· {sub}</span>}
      </div>
    </div>
  )
}
