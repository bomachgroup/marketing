import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { EmptyState, InlineState, Pill, SkeletonKpiGrid, SkeletonList, Topbar } from '../../shared'
import { AppIcon } from '../../shared/AppIcon'
import { parseApiError } from '../../../services/api/apiClient'
import { marketingService } from '../../../services/api/marketingService'
import { workdeskService, type PerformanceCardResponse } from '../../../services/api/workdeskService'
import { useAuth } from '../../../context/AuthContext'
import { capitalizeName } from '../../../data/helpers'
import { pluralize } from '../../../utils/formatters'

type UnknownRecord = Record<string, unknown>

type LeadRow = {
  id: string | number
  name: string
  initials: string
  division: string
  source: string
  status: string
  statusLabel: string
  isOverdue: boolean
}

type TeamRow = {
  id: string
  name: string
  pct: number
  status: string
}

type OkrRow = {
  id: string | number
  title: string
  period: string
  keyResults: Array<{
    id: string | number
    title: string
    pct: number
    color: string
  }>
}

type AlertRow = {
  id: string
  title: string
  meta: string
  tone: 'critical' | 'warning' | 'success' | 'info'
  icon: string
}

const PERIOD_DAYS: Record<string, number> = {
  today: 1,
  week: 7,
  month: 30,
  quarter: 90,
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

const STATUS_VARIANTS: Record<string, 'p-new' | 'p-contact' | 'p-qual' | 'p-prop' | 'p-neg' | 'p-won' | 'p-lost'> = {
  new: 'p-new',
  contacted: 'p-contact',
  qualified: 'p-qual',
  proposal: 'p-prop',
  negotiation: 'p-neg',
  won: 'p-won',
  lost: 'p-lost',
}

const ALERT_STYLES: Record<AlertRow['tone'], { bg: string; color: string }> = {
  critical: { bg: '#FEE2E2', color: '#CC0000' },
  warning: { bg: '#FEF3C7', color: '#B87D00' },
  success: { bg: '#D1FAE5', color: '#047857' },
  info: { bg: '#DBEAFE', color: '#1F3D7A' },
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
  if (Array.isArray(data.objectives)) return data.objectives
  if (Array.isArray(data.okrs)) return data.okrs
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

function formatMetric(value: unknown, suffix = '') {
  const parsed = num(value)
  return `${Math.round(parsed).toLocaleString()}${suffix}`
}

function formatMoney(value: unknown) {
  const amount = num(value)
  if (amount >= 1_000_000_000) return `NGN ${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `NGN ${(amount / 1_000_000).toFixed(amount % 1_000_000 ? 1 : 0)}M`
  if (amount >= 1_000) return `NGN ${Math.round(amount / 1_000).toLocaleString()}K`
  return `NGN ${Math.round(amount).toLocaleString()}`
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function dateMeta(value: unknown) {
  if (!(typeof value === 'string' || typeof value === 'number' || value instanceof Date)) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function transformLead(value: unknown): LeadRow {
  const data = record(value)
  const rawName = text(data.full_name || data.name, 'Unnamed lead')
  const name = capitalizeName(rawName, 'Unnamed lead')
  const status = text(data.status || data.stage, 'new').toLowerCase()

  return {
    id: typeof data.id === 'string' || typeof data.id === 'number' ? data.id : text(data.uuid, name),
    name,
    initials: initials(name),
    division: text(data.division_display || data.division || data.branch_name, 'No division'),
    source: text(data.source_display || data.source || data.campaign_name, 'No source'),
    status,
    statusLabel: text(data.status_display, STATUS_LABELS[status] || status),
    isOverdue: Boolean(data.is_sla_breached || data.overdue || String(data.sla_status || '').toLowerCase().includes('breach')),
  }
}

function transformTeamRows(perfCard: PerformanceCardResponse | null, scorecardRows: unknown[], defaultUserName = 'Team member'): TeamRow[] {
  const apiRows = scorecardRows.map((row, index) => {
    const data = record(row)
    const rawRole = text(
      data.full_name || data.name || data.user_name || data.employee_name || data.role_name || data.role || data.owner_name || data.job_title || data.title,
      `Team member ${index + 1}`
    )
    const role = capitalizeName(rawRole, `Team member ${index + 1}`)
    const pct = normalizePercent(data.score || data.overall_score || data.progress_percentage || data.pct)
    const focus = text(data.manager_focus || data.status || data.track_status)

    return {
      id: String(data.id || role),
      name: role,
      pct,
      status: focus || (pct >= 80 ? 'On target' : pct >= 70 ? 'Close' : 'Below target'),
    }
  })

  if (apiRows.length) return apiRows
  if (!perfCard) return []

  const rawName = text(perfCard.full_name, defaultUserName)
  const name = capitalizeName(rawName, 'Authenticated User')

  return [
    {
      id: 'me',
      name,
      pct: normalizePercent(perfCard.overall_score),
      status: text(perfCard.rank_text, 'Rank #1'),
    },
  ]
}

function progressColor(pct: number) {
  if (pct >= 85) return '#047857'
  if (pct >= 65) return '#D97706'
  return '#DC2626'
}

function transformOkrs(value: unknown): OkrRow[] {
  return asArray(value).map((okr, index) => {
    const data = record(okr)
    const keyResults = asArray(data.key_results || data.krs).map((kr, krIndex) => {
      const krData = record(kr)
      const pct = normalizePercent(krData.progress_percentage || krData.progress || krData.percent)
      return {
        id: typeof krData.id === 'string' || typeof krData.id === 'number' ? krData.id : `${index}-${krIndex}`,
        title: text(krData.title || krData.name || krData.label, `Key result ${krIndex + 1}`),
        pct,
        color: progressColor(pct),
      }
    })

    return {
      id: typeof data.id === 'string' || typeof data.id === 'number' ? data.id : `okr-${index}`,
      title: text(data.title || data.objective || data.obj, `Objective ${index + 1}`),
      period: [text(data.period_start), text(data.period_end)].filter(Boolean).join(' to '),
      keyResults,
    }
  })
}

function transformApprovalAlerts(value: unknown): AlertRow[] {
  return asArray(value)
    .filter((item) => {
      const status = text(record(item).status).toLowerCase()
      return !status || ['pending', 'in_review', 'requested'].includes(status)
    })
    .slice(0, 4)
    .map((item, index) => {
      const data = record(item)
      return {
        id: String(data.id || data.approval_request_id || `approval-${index}`),
        title: text(data.title || data.description || data.action_type_display, 'Approval request needs review'),
        meta: text(data.status_display || data.pending_step_name || dateMeta(data.created_at), 'Pending approval'),
        tone: 'info',
        icon: 'ti-users',
      }
    })
}

function derivedAlerts(leadSummary: UnknownRecord | null, targets: UnknownRecord | null) {
  const alerts: AlertRow[] = []
  const breaches = num(leadSummary?.sla_breaches)
  const stale = num(leadSummary?.stale_leads)
  const upcoming = num(leadSummary?.upcoming_followups)
  const completion = normalizePercent(targets?.completion_pct || targets?.progress_percentage || targets?.target_completion)

  if (breaches > 0) {
    alerts.push({
      id: 'sla-breaches',
      title: `${breaches.toLocaleString()} lead${breaches === 1 ? '' : 's'} breaching SLA`,
      meta: 'Lead summary',
      tone: 'critical',
      icon: 'ti-alert-triangle',
    })
  }
  if (stale > 0) {
    alerts.push({
      id: 'stale-leads',
      title: `${stale.toLocaleString()} stale lead${stale === 1 ? '' : 's'} need attention`,
      meta: 'Lead summary',
      tone: 'warning',
      icon: 'ti-hourglass',
    })
  }
  if (upcoming > 0) {
    alerts.push({
      id: 'followups',
      title: `${upcoming.toLocaleString()} upcoming follow-up${upcoming === 1 ? '' : 's'}`,
      meta: 'Lead summary',
      tone: 'info',
      icon: 'ti-bell',
    })
  }
  if (completion > 0 && completion < 70) {
    alerts.push({
      id: 'targets',
      title: `Targets are ${completion}% complete`,
      meta: 'Revenue target summary',
      tone: 'warning',
      icon: 'ti-target-arrow',
    })
  }

  return alerts
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('week')
  const [leadSummary, setLeadSummary] = useState<UnknownRecord | null>(null)
  const [pipelineReport, setPipelineReport] = useState<UnknownRecord | null>(null)
  const [targetsSummary, setTargetsSummary] = useState<UnknownRecord | null>(null)
  const [perfCard, setPerfCard] = useState<PerformanceCardResponse | null>(null)
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [scorecardRows, setScorecardRows] = useState<unknown[]>([])
  const [okrs, setOkrs] = useState<OkrRow[]>([])
  const [approvalAlerts, setApprovalAlerts] = useState<AlertRow[]>([])
  const [contentItems, setContentItems] = useState<unknown[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setIsLoading(true)
      setApiError('')

      try {
        const days = PERIOD_DAYS[period] || 7
        const [
          leadSummaryRes,
          leadRes,
          pipelineRes,
          targetRes,
          perfRes,
          scorecardRes,
          okrRes,
          approvalsRes,
          contentRes,
        ] = await Promise.all([
          marketingService.getLeadSummary(),
          marketingService.getLeads({ limit: 6 }),
          marketingService.getPipelineSummary({ period: days }),
          marketingService.getRevenueTargetsSummary({ period }),
          workdeskService.getPerformanceCard(),
          marketingService.getActivityScorecard(),
          marketingService.getRevenueOkrs(),
          marketingService.getApprovals(),
          marketingService.getContentBriefs(),
        ])

        if (cancelled) return

        const errors = [
          leadSummaryRes.error,
          leadRes.error,
          pipelineRes.error,
          targetRes.error,
          perfRes.error,
          scorecardRes.error,
          okrRes.error,
          approvalsRes.error,
          contentRes.error,
        ].filter(Boolean)

        if (errors.length) setApiError(parseApiError(errors[0]))

        setLeadSummary(leadSummaryRes.data ? record(leadSummaryRes.data) : null)
        setPipelineReport(pipelineRes.data ? record(pipelineRes.data) : null)
        setTargetsSummary(targetRes.data ? record(targetRes.data) : null)
        setPerfCard(perfRes.data || null)
        setLeads(asArray(leadRes.data).map(transformLead))
        setScorecardRows(asArray(scorecardRes.data))
        setOkrs(transformOkrs(okrRes.data))
        setApprovalAlerts(transformApprovalAlerts(approvalsRes.data))
        setContentItems(asArray(contentRes.data))
      } catch (err) {
        if (!cancelled) setApiError(parseApiError(err))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [period])

  const { user, employeeDetails } = useAuth()
  const defaultUserName = text(employeeDetails?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email, 'Authenticated user')

  const teamRows = useMemo(() => transformTeamRows(perfCard, scorecardRows, defaultUserName), [perfCard, scorecardRows, defaultUserName])
  const alerts = useMemo(
    () => [...derivedAlerts(leadSummary, targetsSummary), ...approvalAlerts].slice(0, 4),
    [approvalAlerts, leadSummary, targetsSummary],
  )

  const leadsGenerated = formatMetric(leadSummary?.total || asArray(leads).length)
  const conversionRate = `${normalizePercent(pipelineReport?.conversion_rate)}%`
  const pipelineValue = formatMoney(pipelineReport?.revenue)
  const activeDealsCount = num(leadSummary?.active, leads.filter((lead) => !['won', 'lost'].includes(lead.status)).length)
  const newUncontactedCount = num(leadSummary?.new_uncontacted)
  const closedCount = num(pipelineReport?.total_closed)
  const publishedContent = contentItems.filter((item) => {
    const status = text(record(item).status).toLowerCase()
    return ['published', 'posted', 'live'].includes(status)
  }).length

  return (
    <div className="flex min-h-0 flex-col">
      <Topbar title="Command centre" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {apiError ? <InlineState type="warning" message={apiError} /> : null}

        {isLoading ? (
          <SkeletonKpiGrid />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon="ti-users" label="Leads generated" value={leadsGenerated} meta={`${pluralize(newUncontactedCount, 'new uncontacted lead')}`} tone="success" />
            <KpiCard icon="ti-chart-pie" label="Conversion rate" value={conversionRate} meta={`${pluralize(closedCount, 'deal')} closed in period`} tone="success" />
            <KpiCard icon="ti-currency-naira" label="Pipeline value" value={pipelineValue} meta={pluralize(activeDealsCount, 'active deal')} tone="neutral" />
            <KpiCard icon="ti-photo" label="Content published" value={String(publishedContent)} meta={`${pluralize(contentItems.length, 'content record')}`} tone="warning" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Live pipeline - latest leads</h3>
              <button type="button" onClick={() => navigate({ to: '/pipeline' })} className="text-xs font-semibold text-navy hover:underline">
                View full {'->'}
              </button>
            </div>

            {isLoading ? (
              <SkeletonList rows={5} avatar />
            ) : leads.length ? (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => navigate({ to: '/leads-detail', search: { id: String(lead.id) } })}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left transition-colors hover:bg-surface-1 ${
                      lead.isOverdue ? 'border border-red-200 bg-red-50/40' : ''
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xs font-extrabold text-blue-700 shadow-xs">
                        {lead.initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-bold text-text">{lead.name}</h4>
                        <p className="mt-0.5 truncate text-[10.5px] font-medium text-text-3">
                          {lead.division} - {lead.isOverdue ? 'SLA breach' : lead.source}
                        </p>
                      </div>
                    </div>

                    <Pill variant={STATUS_VARIANTS[lead.status] || 'p-draft'}>{lead.statusLabel}</Pill>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No leads available"
                description="No backend leads are available for the selected period."
                compact
              />
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Team performance</h3>
              <button type="button" onClick={() => navigate({ to: '/analytics' })} className="text-xs font-semibold text-navy hover:underline">
                Details {'->'}
              </button>
            </div>

            {isLoading ? (
              <SkeletonList rows={5} />
            ) : teamRows.length ? (
              <div className="space-y-3 pt-1">
                {teamRows.map((row) => (
                  <div key={row.id} className="grid grid-cols-1 items-center gap-2 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(90px,1fr)_44px_auto] sm:gap-3">
                    <span className="truncate font-semibold text-text">{row.name}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: progressColor(row.pct) }} />
                    </div>
                    <span className="font-medium text-text-3 sm:text-right">{row.pct}%</span>
                    <div className="sm:text-right">
                      <Pill variant={row.pct >= 80 ? 'p-active' : row.pct >= 70 ? 'p-pause' : 'p-over'}>{row.status}</Pill>
                    </div>
                  </div>
                ))}

                {perfCard && (
                  <div className="mt-3.5 grid grid-cols-3 gap-2.5 border-t border-border/80 pt-3.5 text-center">
                    <div className="rounded-xl border border-border/60 bg-surface-1 p-2.5">
                      <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider">Tasks Completed</div>
                      <div className="text-xs font-bold text-text mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                        {perfCard.work_report?.completed_tasks ?? 0} / {perfCard.work_report?.total_tasks ?? 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-surface-1 p-2.5">
                      <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider">Punctuality</div>
                      <div className="text-xs font-bold text-text mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                        {normalizePercent(perfCard.punctuality_report?.punctuality_rate)}%
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-surface-1 p-2.5">
                      <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider">Daily Report</div>
                      <div className="text-xs font-bold text-emerald-700 capitalize mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                        {text(perfCard.work_report?.report_status, 'Pending')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No team performance"
                description="No team performance rows were returned by the backend."
                compact
              />
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">OKR progress</h3>
              <button type="button" onClick={() => navigate({ to: '/okrs' })} className="text-xs font-semibold text-navy hover:underline">
                All OKRs {'->'}
              </button>
            </div>

            {isLoading ? (
              <SkeletonList rows={4} />
            ) : okrs.length ? (
              <div className="space-y-3">
                {okrs.slice(0, 3).map((okr) => (
                  <div key={okr.id} className="space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-text">{okr.title}</h4>
                      {okr.period ? <p className="mt-0.5 text-[10px] font-medium text-text-3">{okr.period}</p> : null}
                    </div>
                    {okr.keyResults.length ? (
                      <div className="space-y-1.5">
                        {okr.keyResults.slice(0, 2).map((kr) => (
                          <div key={kr.id} className="grid grid-cols-1 items-center gap-2 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(80px,1fr)_44px] sm:gap-3">
                            <span className="truncate font-medium text-text-2">{kr.title}</span>
                            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                              <div className="h-full rounded-full" style={{ width: `${kr.pct}%`, backgroundColor: kr.color }} />
                            </div>
                            <span className="font-bold sm:text-right" style={{ color: kr.color }}>
                              {kr.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState title="No key results" description="No key results returned for this objective." compact />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No OKRs" description="No OKRs were returned by the backend." compact />
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Alerts requiring action</h3>
            </div>

            {isLoading ? (
              <SkeletonList rows={4} />
            ) : alerts.length ? (
              <div className="space-y-2">
                {alerts.map((alert) => {
                  const style = ALERT_STYLES[alert.tone]
                  return (
                    <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-border/80 p-3" style={{ backgroundColor: style.bg }}>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ color: style.color }}>
                        <AppIcon name={alert.icon.replace(/^ti-/, '')} size={14} />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold leading-snug text-text">{alert.title}</p>
                        <span className="text-[10px] font-semibold text-text-3">{alert.meta}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                title="No alerts"
                description="No backend alerts or derived lead/target issues are available."
                icon="ti-shield-check"
                compact
              />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  meta,
  tone,
}: {
  icon: string
  label: string
  value: string
  meta: string
  tone: 'success' | 'warning' | 'neutral'
}) {
  const toneClass = tone === 'success' ? 'text-emerald-600' : tone === 'warning' ? 'text-amber-700' : 'text-text-3'

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-3">
        <AppIcon name={icon.replace(/^ti-/, '')} size={12} /> {label}
      </div>
      <div className="text-2xl font-extrabold tracking-tight text-text">{value}</div>
      <div className={`mt-1 text-xs font-bold ${toneClass}`}>{meta}</div>
    </div>
  )
}
