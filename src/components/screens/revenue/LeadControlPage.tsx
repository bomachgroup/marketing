import { useCallback, useEffect, useMemo, useState } from 'react'
import { BusyLabel, EmptyState, ErrorState, Pill, SkeletonCardGrid, SkeletonKpiGrid, SkeletonList, SkeletonTable, Topbar } from '../../shared'
import { useNavigate } from '@tanstack/react-router'
import { useToast } from '../../../context/ToastContext'
import { marketingService } from '../../../services/api/marketingService'
import { parseApiError } from '../../../services/api/apiClient'
import { AppIcon } from '../../shared/AppIcon'
import { pluralize } from '../../../utils/formatters'

type StagePillVariant = 'p-new' | 'p-contact' | 'p-qual' | 'p-prop' | 'p-neg' | 'p-won' | 'p-lost'
type UnknownRecord = Record<string, unknown>
type LeadFilter = 'all' | 'breach' | 'hot' | 'stale' | 'reactivate'

type ControlLead = {
  id: string
  name: string
  source: string
  division: string
  value: string
  stage: string
  assigned: string
  score: number
  priority: string
  age: number
  nextAction: string
  sla: string
  overdue: boolean
  actions: Array<{
    label: string
    action: string
  }>
}

type ControlMetrics = {
  newUncontacted: number
  slaBreaches: number
  hotLeads: number
  staleOpportunities: number
}

type LeadControlKpiCard = {
  key: string
  label: string
  value: number
  foot: string
  icon: string
  bg: string
  color: string
}

type ScoringModelItem = {
  points: number
  name: string
  copy: string
}

type QualificationItem = {
  label: string
  status: string
}

const EMPTY_METRICS: ControlMetrics = {
  newUncontacted: 0,
  slaBreaches: 0,
  hotLeads: 0,
  staleOpportunities: 0,
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
  if (Array.isArray(data.rows)) return data.rows
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.leads)) return data.leads
  if (Array.isArray(data.records)) return data.records
  if (Array.isArray(data.data)) return data.data
  return []
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function moneyLike(value: unknown, fallback = '-') {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'number') return `N${value.toLocaleString()}`
  return String(value)
}

function formatStatus(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function pickNumber(data: UnknownRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return num(data[key], fallback)
  }
  return fallback
}

function pickText(data: UnknownRecord, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = text(data[key])
    if (value) return value
  }
  return fallback
}

function normalizeSla(value: string, overdue: boolean) {
  const lower = value.toLowerCase()
  if (overdue || lower.includes('breach') || lower.includes('overdue')) return 'Breach'
  if (lower.includes('due')) return 'Due now'
  return value || 'Safe'
}

function transformLead(value: unknown): ControlLead {
  const data = record(value)
  const id = String(data.id ?? data.lead_id ?? data.uuid ?? '')
  const stage = pickText(data, ['stage', 'status'], 'new')
  const score = pickNumber(data, ['score', 'lead_score', 'priority_score'])
  const priority = pickText(data, ['priority', 'priority_label'], score >= 75 ? 'Hot' : score >= 50 ? 'Warm' : 'Nurture')
  const overdue = Boolean(data.overdue ?? data.is_sla_breached ?? data.sla_breached) || text(data.sla_status).toLowerCase() === 'breached'
  const sla = pickText(data, ['sla_label']) || normalizeSla(pickText(data, ['sla_status', 'sla'], ''), overdue)
  const leadMeta = text(data.lead_meta)
  const actions = asArray(data.actions)
    .map((action) => {
      const actionData = record(action)
      return {
        label: pickText(actionData, ['label', 'name'], 'Action'),
        action: pickText(actionData, ['action', 'key'], '').toLowerCase(),
      }
    })
    .filter((action) => action.action)

  return {
    id,
    name: pickText(data, ['lead', 'full_name', 'name', 'lead_name'], 'Unnamed lead'),
    source: pickText(data, ['source_display', 'source'], '-'),
    division: pickText(data, ['division_display', 'division', 'div'], '-'),
    value: moneyLike(data.value ?? data.estimated_value ?? data.deal_value_naira, leadMeta ? leadMeta.split(/[\u00b7-]/).at(-1)?.trim() || '-' : '-'),
    stage,
    assigned: pickText(data, ['owner', 'assigned_to_name', 'assigned_user_name', 'assigned'], 'Unassigned'),
    score,
    priority,
    age: pickNumber(data, ['age_days', 'days_old', 'age']),
    nextAction: pickText(data, ['recommended_action', 'next_action', 'nextAction'], 'Define next action'),
    sla,
    overdue: sla === 'Breach',
    actions,
  }
}

function transformMetrics(value: unknown, leads: ControlLead[]): ControlMetrics {
  const source = record(value)
  const metrics = record(source.metrics ?? source.kpis ?? source.summary ?? source.counts)
  return {
    newUncontacted: pickNumber(metrics, ['new_uncontacted', 'new_and_uncontacted', 'new_leads', 'uncontacted'], leads.filter((lead) => lead.stage === 'new').length),
    slaBreaches: pickNumber(metrics, ['sla_breaches', 'breaches', 'slaBreaches'], leads.filter((lead) => lead.sla === 'Breach').length),
    hotLeads: pickNumber(metrics, ['hot_leads', 'hot_opportunities', 'hotLeads'], leads.filter((lead) => lead.priority === 'Hot').length),
    staleOpportunities: pickNumber(metrics, ['stale_opportunities', 'stale_leads', 'stale'], leads.filter((lead) => lead.age >= 12).length),
  }
}

function transformKpiCards(value: unknown, metrics: ControlMetrics): LeadControlKpiCard[] {
  const cards = asArray(record(value).kpi_cards)
    .map((item, index) => {
      const data = record(item)
      return {
        key: pickText(data, ['key'], `card-${index}`),
        label: pickText(data, ['label', 'name'], `KPI ${index + 1}`),
        value: pickNumber(data, ['value', 'count']),
        foot: pickText(data, ['foot', 'helper', 'copy']),
        icon: pickText(data, ['icon'], 'ti-chart-bar'),
        bg: pickText(data, ['bg', 'background'], '#F8F9FB'),
        color: pickText(data, ['color'], '#14162B'),
      }
    })
    .filter((card) => card.label)

  if (cards.length) return cards

  return [
    {
      key: 'new_uncontacted',
      label: 'New & uncontacted',
      value: metrics.newUncontacted,
      foot: 'Require immediate acknowledgement',
      icon: 'ti-user-exclamation',
      bg: '#F8F9FB',
      color: '#14162B',
    },
    {
      key: 'sla_breaches',
      label: 'SLA breaches',
      value: metrics.slaBreaches,
      foot: 'Escalate to manager',
      icon: 'ti-alarm',
      bg: '#F8F9FB',
      color: '#14162B',
    },
    {
      key: 'hot_leads',
      label: 'Hot leads',
      value: metrics.hotLeads,
      foot: 'Score 75+',
      icon: 'ti-flame',
      bg: '#F8F9FB',
      color: '#14162B',
    },
    {
      key: 'stale_opportunities',
      label: 'Stale opportunities',
      value: metrics.staleOpportunities,
      foot: '12+ days without meaningful progress',
      icon: 'ti-hourglass-empty',
      bg: '#F8F9FB',
      color: '#14162B',
    },
  ]
}

function transformScoringModel(value: unknown): ScoringModelItem[] {
  return asArray(record(value).scoring_model).map((item, index) => {
    const data = record(item)
    return {
      points: pickNumber(data, ['points', 'score'], 0),
      name: pickText(data, ['name', 'label'], `Scoring factor ${index + 1}`),
      copy: pickText(data, ['copy', 'description', 'text']),
    }
  })
}

function transformQualificationChecklist(value: unknown): QualificationItem[] {
  return asArray(record(value).qualification_checklist).map((item, index) => {
    const data = record(item)
    return {
      label: pickText(data, ['label', 'name'], `Qualification item ${index + 1}`),
      status: pickText(data, ['status'], 'required'),
    }
  })
}

function extractLeadRows(value: unknown) {
  const data = record(value)
  const nested = record(data.data)
  return asArray(data.rows).length
    ? asArray(data.rows)
    : asArray(data.leads).length
    ? asArray(data.leads)
    : asArray(data.items).length
      ? asArray(data.items)
      : asArray(data.results).length
        ? asArray(data.results)
        : asArray(nested.rows).length
          ? asArray(nested.rows)
          : asArray(nested.leads).length
            ? asArray(nested.leads)
            : asArray(value)
}

export function LeadControlPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [period, setPeriod] = useState('week')
  const [filter, setFilter] = useState<LeadFilter>('all')
  const [search, setSearch] = useState('')
  const [leads, setLeads] = useState<ControlLead[]>([])
  const [kpiCards, setKpiCards] = useState<LeadControlKpiCard[]>([])
  const [scoringModel, setScoringModel] = useState<ScoringModelItem[]>([])
  const [qualificationChecklist, setQualificationChecklist] = useState<QualificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [contactingId, setContactingId] = useState<string | null>(null)
  const [repairingNextActions, setRepairingNextActions] = useState(false)
  const [autoAssigning, setAutoAssigning] = useState(false)

  const stageLabels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal: 'Proposal sent',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
  }

  const stageCols: Record<string, StagePillVariant> = {
    new: 'p-new',
    contacted: 'p-contact',
    qualified: 'p-qual',
    proposal: 'p-prop',
    negotiation: 'p-neg',
    won: 'p-won',
    lost: 'p-lost',
  }

  const loadLeadControl = useCallback(async () => {
    setIsLoading(true)
    setApiError('')

    try {
      const res = await marketingService.getLeadControl({
        filter,
        search: search.trim() || undefined,
        limit: 100,
      })

      if (res.data) {
        const rows = extractLeadRows(res.data).map(transformLead).filter((lead) => lead.id)
        const nextMetrics = transformMetrics(res.data, rows)
        setLeads(rows)
        setKpiCards(transformKpiCards(res.data, nextMetrics))
        setScoringModel(transformScoringModel(res.data))
        setQualificationChecklist(transformQualificationChecklist(res.data))
      } else {
        setLeads([])
        setKpiCards(transformKpiCards(null, EMPTY_METRICS))
        setScoringModel([])
        setQualificationChecklist([])
        setApiError(parseApiError(res.error || 'Could not load lead control data'))
      }
    } catch (err) {
      setLeads([])
      setKpiCards(transformKpiCards(null, EMPTY_METRICS))
      setScoringModel([])
      setQualificationChecklist([])
      setApiError(parseApiError(err instanceof Error ? err.message : 'Could not load lead control data'))
    } finally {
      setIsLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLeadControl()
    }, 200)

    return () => window.clearTimeout(timer)
  }, [loadLeadControl])

  const filteredLeads = useMemo(() => leads, [leads])

  async function contactLeadNow(id: string) {
    const lead = leads.find((item) => item.id === id)
    if (!lead) return

    setContactingId(id)
    try {
      const activityRes = await marketingService.logLeadActivity(id, {
        activity_type: 'phone_call',
        outcome: 'connected',
        note: 'Immediate contact completed',
        next_action: 'Schedule next action',
        to_status: lead.stage === 'new' ? 'contacted' : undefined,
      })

      if (!activityRes.data) {
        showToast(parseApiError(activityRes.error || 'Could not record contact activity'), 'error')
        return
      }

      if (lead.stage === 'new') {
        const statusRes = await marketingService.updateLeadStage(id, 'contacted')
        if (!statusRes.data) {
          showToast(parseApiError(statusRes.error || 'Contact was logged, but stage could not be updated'), 'error')
          return
        }
      }

      showToast('Contact activity logged.', 'success')
      await loadLeadControl()
    } catch (err: unknown) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not contact lead'), 'error')
    } finally {
      setContactingId(null)
    }
  }

  async function autoAssign() {
    setAutoAssigning(true)
    try {
      const res = await marketingService.autoAssignLeads({ limit: 250 })
      if (res.data) {
        showToast('Lead auto-assignment completed.', 'success')
        await loadLeadControl()
      } else {
        showToast(parseApiError(res.error || 'Could not auto-assign leads'), 'error')
      }
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not auto-assign leads'), 'error')
    } finally {
      setAutoAssigning(false)
    }
  }

  async function repairNextActions() {
    setRepairingNextActions(true)
    try {
      const res = await marketingService.repairLeadNextActions({ limit: 500 })
      if (res.data) {
        showToast('Next actions repaired.', 'success')
        await loadLeadControl()
      } else {
        showToast(parseApiError(res.error || 'Could not repair next actions'), 'error')
      }
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not repair next actions'), 'error')
    } finally {
      setRepairingNextActions(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col">
      <Topbar title="Lead control tower" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-text">Lead Control Tower</h3>
            <p className="text-xs text-text-3">SLA enforcement, qualification, lead scoring, next-action discipline, and reactivation</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={autoAssign}
              disabled={autoAssigning}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 active:scale-95 disabled:cursor-wait disabled:opacity-60"
            >
              <AppIcon name="user-check" size={14} /> {autoAssigning ? 'Assigning...' : 'Auto-assign'}
            </button>
            <button
              type="button"
              onClick={repairNextActions}
              disabled={repairingNextActions}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 active:scale-95 disabled:cursor-wait disabled:opacity-60"
            >
              <AppIcon name="checklist" size={14} /> {repairingNextActions ? 'Creating...' : 'Create next actions'}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/new-lead' })}
              className="flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-navy-dark active:scale-95"
            >
              <AppIcon name="plus" size={14} /> Add lead
            </button>
          </div>
        </div>

        {apiError && <ErrorState message={apiError} onRetry={() => void loadLeadControl()} compact />}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full">
              <SkeletonKpiGrid cards={4} />
            </div>
          ) : kpiCards.map((card) => (
            <div key={card.key} className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-3">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md" style={{ backgroundColor: card.bg, color: card.color }}>
                  <AppIcon name={card.icon.replace(/^ti-/, '')} size={12} />
                </span>
                {card.label}
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-text">{card.value.toLocaleString()}</div>
              <div className="mt-1 text-xs font-medium text-text-3">{card.foot}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto pb-1">
            {[
              ['all', 'All leads'],
              ['breach', 'SLA breaches'],
              ['hot', 'Hot leads'],
              ['stale', 'Stale'],
              ['reactivate', 'Reactivation'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key as LeadFilter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === key ? 'bg-navy text-white shadow-xs' : 'border border-border/80 bg-surface-1 text-text-3 hover:bg-surface-2'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full min-w-0 sm:w-64">
            <AppIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, source, division..."
              className="w-full rounded-xl border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="overflow-x-auto">
            {isLoading ? (
              <SkeletonTable columns={8} rows={6} />
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-bold text-text-3">
                    <th className="px-3 py-2.5">Lead</th>
                    <th className="px-3 py-2.5">Score</th>
                    <th className="px-3 py-2.5">Stage</th>
                    <th className="px-3 py-2.5">Age</th>
                    <th className="px-3 py-2.5">Next action</th>
                    <th className="px-3 py-2.5">SLA</th>
                    <th className="px-3 py-2.5">Owner</th>
                    <th className="px-3 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-1">
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-text">{lead.name}</div>
                      <div className="text-[11px] text-text-3">
                        {lead.source} - {lead.division} - {lead.value}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold text-white ${
                            lead.score >= 75 ? 'bg-red' : lead.score >= 50 ? 'bg-amber-600' : 'bg-blue-600'
                          }`}
                        >
                          {lead.score}
                        </span>
                        <span className="text-[10px] font-bold text-text-3">{lead.priority}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill variant={stageCols[lead.stage] || 'p-qual'}>{stageLabels[lead.stage] || lead.stage}</Pill>
                    </td>
                    <td className="px-3 py-2.5">{pluralize(lead.age, 'day')}</td>
                    <td className="px-3 py-2.5">{lead.nextAction}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide ${
                          lead.sla === 'Breach'
                            ? 'border border-red-200 bg-red-100 text-red'
                            : lead.sla === 'Due now'
                              ? 'border border-amber-200 bg-amber-100 text-amber-700'
                              : 'border border-emerald-200 bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {lead.sla}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{lead.assigned}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate({ to: '/leads-detail', search: { id: lead.id } })}
                          className="rounded border border-border px-2.5 py-1 text-[11px] font-semibold text-text transition-all hover:bg-surface-2"
                        >
                          Open
                        </button>
                        {lead.actions.some((action) => action.action === 'contact') && (
                          <button
                            type="button"
                            onClick={() => contactLeadNow(lead.id)}
                            disabled={contactingId === lead.id}
                            className="rounded bg-navy px-2.5 py-1 text-[11px] font-semibold text-white transition-all hover:bg-navy-dark disabled:opacity-50"
                          >
                            {contactingId === lead.id ? <BusyLabel>Contacting...</BusyLabel> : 'Contact'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!isLoading && filteredLeads.length === 0 && (
              <EmptyState title="No lead-control records" description="No lead-control records were returned for these filters." icon="ti-users" compact />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Bomach lead scoring model</h3>
              <p className="text-xs text-text-3">100-point model used to prioritise human attention</p>
            </div>

            {isLoading ? (
              <SkeletonCardGrid cards={4} />
            ) : scoringModel.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {scoringModel.map((item) => (
                  <div key={item.name} className="space-y-1 rounded-xl border border-border/80 bg-surface-1 p-3">
                    <div className="text-xl font-extrabold text-text">{item.points}</div>
                    <div className="text-xs font-bold text-text">{item.name}</div>
                    <p className="text-[10px] leading-tight text-text-3">{item.copy}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No scoring model" description="No scoring model was returned." icon="ti-calculator" compact />
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Qualification standard</h3>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs font-medium leading-relaxed text-navy">
              Marketing lifecycle, lead status and deal stage are separate fields. A lead becomes sales-qualified only when need, budget/ability, decision authority and timeline are recorded.
            </div>

            <div className="space-y-2">
              {qualificationChecklist.length ? (
                qualificationChecklist.map((item) => {
                  const required = item.status === 'required'
                  return (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-1 p-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs ${
                            required ? 'bg-emerald-700 text-white' : 'border border-border text-transparent'
                          }`}
                        >
                          <AppIcon name="check" size={14} />
                        </div>
                        <span className="truncate text-xs font-bold text-text">{item.label}</span>
                      </div>
                      <Pill variant={required ? 'p-active' : 'p-draft'}>{formatStatus(item.status)}</Pill>
                    </div>
                  )
                })
              ) : isLoading ? (
                <SkeletonList rows={4} />
              ) : (
                <EmptyState title="No qualification checklist" description="No qualification checklist was returned." icon="ti-checklist" compact />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
