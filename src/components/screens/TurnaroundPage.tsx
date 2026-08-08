import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { BusyLabel, Button, EmptyState, ErrorState, KCard, Modal, Select, SkeletonKanban, SkeletonKpiGrid, Table, Topbar } from '../shared'
import { Flag, ShieldSecurity, ExportSquare } from 'iconsax-react'
import { parseApiError } from '../../services/api/apiClient'
import { marketingService } from '../../services/api/marketingService'
import { teamService } from '../../services/api/teamService'
import NoPermissionPage from '../layout/NoPermissionPage'

type UnknownRecord = Record<string, unknown>

type TurnaroundTask = {
  id: string | number
  title: string
  owner: string
  week: string
  phase: string
  done: boolean
  backend: boolean
  sortOrder: number
}

type PhaseColumn = {
  id: string
  label: string
  color: string
  range: string
  completionPct?: number
  tasks: TurnaroundTask[]
}

type KpiCard = {
  label: string
  value: string
  sub: string
  trend?: string
  trendUp?: boolean
}

type TableRow = Record<string, string | number>

type EvidenceItem = {
  src: string
  title: string
  copy: string
  url: string
}

type EmployeeOption = {
  value: string
  label: string
}

type PlanForm = {
  id: string | number | null
  name: string
  startDate: string
  endDate: string
  branchId: string
  primaryOwnerId: string
}

const PHASE_META: Record<string, { label: string; color: string; range: string }> = {
  stabilise: { label: 'Stabilise Phase', color: 'bg-rose-500', range: 'Weeks 1-2' },
  stabilize: { label: 'Stabilise Phase', color: 'bg-rose-500', range: 'Weeks 1-2' },
  standardise: { label: 'Standardise Phase', color: 'bg-amber-500', range: 'Weeks 3-6' },
  standardize: { label: 'Standardise Phase', color: 'bg-amber-500', range: 'Weeks 3-6' },
  scale: { label: 'Scale & Expand Phase', color: 'bg-emerald-600', range: 'Weeks 7-13' },
}

const PC_COLS = [
  { key: 'role', label: 'Role Designation' },
  { key: 'accountability', label: 'Primary Core Accountability' },
  { key: 'measure', label: 'Quantitative Success Metric' },
]

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
  return []
}

function todayDateValue() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function employeeId(value: UnknownRecord) {
  const id = value.id ?? value.employee_id ?? value.user_id
  return typeof id === 'string' || typeof id === 'number' ? String(id) : ''
}

function employeeName(value: UnknownRecord) {
  const directName = text(value.full_name) || text(value.name) || text(value.employee_name)
  if (directName && !directName.includes('@')) return directName
  const joinedName = [value.first_name, value.middle_name, value.last_name, value.surname]
    .map((part) => text(part))
    .filter(Boolean)
    .join(' ')
  return joinedName || directName || 'Employee'
}

function toEmployeeOptions(value: unknown): EmployeeOption[] {
  return asArray(value)
    .map((item) => record(item))
    .map((item) => ({ value: employeeId(item), label: employeeName(item) }))
    .filter((item) => item.value)
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePhase(value: unknown) {
  const raw = text(value, 'standardise').toLowerCase()
  if (raw === 'stabilize') return 'stabilise'
  if (raw === 'standardize') return 'standardise'
  return raw
}

function fallbackPhaseMeta(phase: string) {
  return PHASE_META[phase] || {
    label: phase.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    color: 'bg-navy',
    range: '',
  }
}

function taskId(value: unknown, fallback: string): string | number {
  return typeof value === 'string' || typeof value === 'number' ? value : fallback
}

function transformAction(value: unknown, fallbackPhase = 'standardise'): TurnaroundTask {
  const data = record(value)
  const status = text(data.status).toLowerCase()
  const phase = normalizePhase(data.phase || fallbackPhase)

  return {
    id: taskId(data.id, `action-${Math.random().toString(36).slice(2)}`),
    title: text(data.title, 'Turnaround action'),
    owner: text(data.owner_name) || text(data.owner_text, 'Unassigned'),
    week: text(data.week_label, `Weeks ${num(data.week_start, 1)}-${num(data.week_end, 13)}`),
    phase,
    done: Boolean(data.completed_at) || ['completed', 'complete', 'done'].includes(status),
    backend: Boolean(data.id),
    sortOrder: num(data.sort_order),
  }
}

function transformRoadmap(value: unknown): PhaseColumn {
  const data = record(value)
  const phase = normalizePhase(data.phase)
  const meta = fallbackPhaseMeta(phase)
  const tasks = asArray(data.actions)
    .map((action) => transformAction(action, phase))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    id: phase,
    label: text(data.title, meta.label),
    color: meta.color,
    range: text(data.period, meta.range),
    completionPct: num(data.completion_pct),
    tasks,
  }
}

function transformKpis(value: unknown): KpiCard | null {
  const data = record(value)
  const label = text(data.label)
  if (!label) return null
  return {
    label,
    value: text(data.value, '-'),
    sub: text(data.foot),
  }
}

function transformPerformanceContract(value: unknown): TableRow {
  const data = record(value)
  return {
    role: text(data.role, '-'),
    accountability: text(data.outcome_metrics, '-'),
    measure: text(data.minimum_operating_standard, '-'),
  }
}

function transformGovernanceRule(value: unknown, index: number) {
  const data = record(value)
  return {
    sequence: num(data.sequence, index + 1),
    rule: text(data.rule, '-'),
  }
}

function transformEvidence(value: unknown): EvidenceItem {
  const data = record(value)
  return {
    src: text(data.source, '-'),
    title: text(data.title, '-'),
    copy: text(data.description, '-'),
    url: text(data.url, '#'),
  }
}

function firstPlanId(value: unknown) {
  const first = asArray(value)[0]
  const data = record(first)
  const id = data.id ?? data.plan_id
  return typeof id === 'string' || typeof id === 'number' ? id : null
}

export function TurnaroundPage() {
  const { showToast } = useToast()
  const [period, setPeriod] = useState('This week')
  const [planDetail, setPlanDetail] = useState<UnknownRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [savingActionId, setSavingActionId] = useState<string | number | null>(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isChangingPlanStatus, setIsChangingPlanStatus] = useState(false)
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([])
  const [planForm, setPlanForm] = useState<PlanForm>({
    id: null,
    name: '',
    startDate: todayDateValue(),
    endDate: '',
    branchId: '',
    primaryOwnerId: '',
  })

  const loadTurnaroundPlan = useCallback(async (showSuccess = false) => {
    setIsLoading(true)
    setApiError('')

    try {
      const listRes = await marketingService.getTurnaroundPlans({ status: 'active' })
      const planId = listRes.data ? firstPlanId(listRes.data) : null

      if (planId) {
        const detailRes = await marketingService.getTurnaroundPlan(planId)
        if (detailRes.data) {
          setPlanDetail(record(detailRes.data))
          if (showSuccess) showToast('Roadmap progress refreshed.', 'success')
        } else {
          setPlanDetail(null)
          setApiError(parseApiError(detailRes.error || 'Could not load turnaround plan detail'))
        }
      } else if (listRes.data) {
        setPlanDetail(null)
        if (showSuccess) showToast('Roadmap progress refreshed.', 'success')
      } else {
        setPlanDetail(null)
        setApiError(parseApiError(listRes.error || 'Could not load turnaround plans'))
      }
    } catch (err) {
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTurnaroundPlan()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadTurnaroundPlan])

  useEffect(() => {
    let cancelled = false

    async function loadEmployees() {
      try {
        const res = await teamService.listEmployees({ is_active: true, limit: 200 })
        if (!cancelled && res.data) setEmployeeOptions(toEmployeeOptions(res.data))
      } catch {
        if (!cancelled) setEmployeeOptions([])
      }
    }

    void loadEmployees()
    return () => {
      cancelled = true
    }
  }, [])

  const plan = record(planDetail?.plan)
  const hasBackendPlan = Boolean(planDetail?.plan)
  const phases = useMemo(() => {
    const roadmap = asArray(planDetail?.roadmap)
    if (roadmap.length) return roadmap.map(transformRoadmap)
    return []
  }, [planDetail])

  const allTasks = phases.flatMap((phase) => phase.tasks)
  const completedCount = hasBackendPlan ? num(plan.completed_actions) : allTasks.filter((task) => task.done).length
  const totalCount = hasBackendPlan ? num(plan.total_actions, allTasks.length) : allTasks.length
  const planCompletionPct = hasBackendPlan
    ? num(plan.completion_pct)
    : totalCount
      ? Math.round((completedCount / totalCount) * 100)
      : 0
  const currentPhase = normalizePhase(plan.current_phase)
  const currentPhaseMeta = fallbackPhaseMeta(currentPhase)
  const primaryOwner = text(plan.primary_owner_name, 'Marketing Manager')
  const planName = text(plan.name, '13-Week Revenue Turnaround & Scale Roadmap')
  const planId = plan.id ?? plan.plan_id
  const hasPlanId = typeof planId === 'string' || typeof planId === 'number'

  const kpis = useMemo(() => {
    const backendKpis = asArray(planDetail?.kpis).map(transformKpis).filter((kpi): kpi is KpiCard => Boolean(kpi))
    if (backendKpis.length) return backendKpis.slice(0, 4)
    if (!hasBackendPlan) return []
    return [
      { label: 'Plan completion', value: `${completedCount}/${totalCount}`, sub: `${planCompletionPct}% Tasks Completed` },
      { label: 'Current execution phase', value: currentPhaseMeta.label.replace(' Phase', ''), sub: currentPhaseMeta.range || 'Active Roadmap' },
      { label: 'Accountable owner', value: primaryOwner, sub: 'Primary Owner' },
      { label: 'Plan status', value: text(plan.status, '-'), sub: `${text(plan.start_date, '-')} to ${text(plan.end_date, '-')}` },
    ]
  }, [
    planDetail,
    completedCount,
    totalCount,
    planCompletionPct,
    currentPhaseMeta,
    primaryOwner,
    hasBackendPlan,
    plan.status,
    plan.start_date,
    plan.end_date,
  ])

  const performanceRows = useMemo(() => {
    const rows = asArray(planDetail?.performance_contracts)
    if (rows.length) return rows.map(transformPerformanceContract)
    return []
  }, [planDetail])

  const governanceRules = useMemo(() => {
    const rows = asArray(planDetail?.governance_rules)
    if (rows.length) return rows.map(transformGovernanceRule)
    return []
  }, [planDetail])

  const evidenceRows = useMemo(() => {
    const rows = asArray(planDetail?.evidence)
    if (rows.length) return rows.map(transformEvidence)
    return []
  }, [planDetail])

  async function toggleTask(task: TurnaroundTask) {
    if (!task.backend) {
      return
    }

    setSavingActionId(task.id)
    try {
      const res = task.done
        ? await marketingService.reopenTurnaroundAction(task.id)
        : await marketingService.completeTurnaroundAction(task.id, {})

      if (res.data) {
        showToast(task.done ? 'Turnaround action reopened.' : 'Turnaround action completed.', 'success')
        await loadTurnaroundPlan()
      } else {
        showToast(parseApiError(res.error || 'Could not update turnaround action'), 'error')
      }
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not update turnaround action'), 'error')
    } finally {
      setSavingActionId(null)
    }
  }

  function openNewPlanModal() {
    setPlanForm({
      id: null,
      name: '',
      startDate: todayDateValue(),
      endDate: '',
      branchId: '',
      primaryOwnerId: '',
    })
    setShowPlanModal(true)
  }

  function openEditPlanModal() {
    setPlanForm({
      id: hasPlanId ? planId : null,
      name: planName,
      startDate: text(plan.start_date, todayDateValue()),
      endDate: text(plan.end_date),
      branchId: plan.branch_id === undefined || plan.branch_id === null ? '' : String(plan.branch_id),
      primaryOwnerId: plan.primary_owner_id === undefined || plan.primary_owner_id === null ? '' : String(plan.primary_owner_id),
    })
    setShowPlanModal(true)
  }

  function closePlanModal() {
    if (!isSavingPlan) setShowPlanModal(false)
  }

  async function handleSavePlan() {
    if (!planForm.name.trim() || !planForm.startDate) {
      showToast('Plan name and start date are required', 'error')
      return
    }

    setIsSavingPlan(true)
    try {
      const payload = {
        name: planForm.name.trim(),
        start_date: planForm.startDate,
        end_date: planForm.endDate || null,
        branch_id: planForm.branchId ? num(planForm.branchId) : null,
        primary_owner_id: planForm.primaryOwnerId ? num(planForm.primaryOwnerId) : null,
      }
      const res = planForm.id
        ? await marketingService.updateTurnaroundPlan(planForm.id, payload)
        : await marketingService.createTurnaroundPlan(payload)

      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not save turnaround plan'), 'error')
        return
      }

      showToast(planForm.id ? 'Turnaround plan updated.' : 'Turnaround plan created.', 'success')
      setShowPlanModal(false)
      await loadTurnaroundPlan()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not save turnaround plan'), 'error')
    } finally {
      setIsSavingPlan(false)
    }
  }

  async function handlePlanStatus(action: 'activate' | 'close') {
    if (!hasPlanId) return
    setIsChangingPlanStatus(true)
    try {
      const res = action === 'activate'
        ? await marketingService.activateTurnaroundPlan(planId)
        : await marketingService.closeTurnaroundPlan(planId)
      if (res.data) {
        showToast(action === 'activate' ? 'Turnaround plan activated.' : 'Turnaround plan closed.', 'success')
        await loadTurnaroundPlan()
      } else {
        showToast(parseApiError(res.error || 'Could not update turnaround plan'), 'error')
      }
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not update turnaround plan'), 'error')
    } finally {
      setIsChangingPlanStatus(false)
    }
  }

  async function handleExportPlan() {
    if (!hasPlanId) return
    const res = await marketingService.exportTurnaroundPlan(planId)
    if (res.error) {
      showToast(parseApiError(res.error), 'error')
    } else {
      showToast('Turnaround plan exported.', 'success')
    }
  }

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="turnaround" />
  }

  return (
    <div className="flex min-h-0 flex-col gap-5 p-4 sm:p-6 md:p-8">
      <Topbar
        title={planName}
        period={period}
        onPeriodChange={setPeriod}
        periodOptions={['This week', 'Today', 'This month']}
      />

      {apiError && <ErrorState message={apiError} onRetry={() => loadTurnaroundPlan(true)} compact />}
      {!isLoading && !apiError && !hasBackendPlan && (
        <EmptyState
          title="No active turnaround plan"
          description="No active turnaround plan was found."
          icon="ti-road"
          action={
            <button
              type="button"
              onClick={openNewPlanModal}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
            >
              <i className="ti ti-plus text-sm" aria-hidden />
              <span>New plan</span>
            </button>
          }
        />
      )}

      {!isLoading && hasBackendPlan && (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="min-w-0 break-words text-sm font-bold text-text">{planName}</h2>
                <span className="rounded border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-extrabold text-navy">
                  {text(plan.status, 'Draft')}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-text-3">
                <span>Owner: {primaryOwner}</span>
                <span>Phase: {currentPhaseMeta.label}</span>
                <span>{text(plan.start_date, '-')} to {text(plan.end_date, '-')}</span>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openNewPlanModal}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
              >
                <i className="ti ti-plus text-sm" aria-hidden />
                <span>New plan</span>
              </button>
              <button
                type="button"
                disabled={!hasPlanId}
                onClick={openEditPlanModal}
                className="inline-flex min-w-0 items-center justify-center rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                Edit plan
              </button>
              <button
                type="button"
                disabled={!hasPlanId || isChangingPlanStatus}
                onClick={() => handlePlanStatus(text(plan.status).toLowerCase() === 'active' ? 'close' : 'activate')}
                className="inline-flex min-w-0 items-center justify-center rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text disabled:cursor-wait disabled:opacity-50"
              >
                {isChangingPlanStatus ? <BusyLabel>Saving...</BusyLabel> : text(plan.status).toLowerCase() === 'active' ? 'Close plan' : 'Activate plan'}
              </button>
              <button
                type="button"
                disabled={!hasPlanId}
                onClick={handleExportPlan}
                className="inline-flex min-w-0 items-center justify-center rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => loadTurnaroundPlan(true)}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs disabled:cursor-wait disabled:opacity-60"
              >
                <Flag color="currentColor" variant="Outline" size={15} />
                {isLoading ? <BusyLabel>Auditing...</BusyLabel> : <span>Audit</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonKpiGrid cards={4} />
      ) : kpis.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <KCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              sub={kpi.sub}
              trend={kpi.trend}
              trendUp={kpi.trendUp}
            />
          ))}
        </div>
      )}

      {isLoading ? (
        <SkeletonKanban stages={3} cardsPerStage={4} />
      ) : phases.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {phases.map((phase) => {
          const done = phase.tasks.filter((task) => task.done).length
          const pct = phase.completionPct ?? Math.round((done / (phase.tasks.length || 1)) * 100)
          return (
            <div key={phase.id} className="flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-text">{phase.label}</h3>
                    <span className="text-xs font-semibold text-text-3">{phase.range}</span>
                  </div>
                  <span className="rounded border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-navy">
                    {pct}% Done
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full transition-all duration-300 ${phase.color}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="space-y-2 pt-1">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-surface-1 p-3 transition-all hover:bg-surface-2/60"
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                        disabled={savingActionId === task.id}
                        onChange={() => toggleTask(task)}
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-navy disabled:cursor-wait disabled:opacity-60"
                      />
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-bold ${task.done ? 'text-text-3 line-through' : 'text-text'}`}>
                          {task.title}
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-text-3">
                          <span>Owner: {task.owner}</span>
                          <span>-</span>
                          <span>{task.week}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!isLoading && phase.tasks.length === 0 && (
                    <EmptyState title="No phase actions" description="No actions were returned for this phase." icon="ti-list-check" compact />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        </div>
      ) : (
        !isLoading && (
          <EmptyState title="No roadmap phases" description="No roadmap phases are available." icon="ti-layout-kanban" />
        )
      )}

      <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="text-sm font-bold text-text">Performance Contract & Role Mandate</h3>
          <span className="rounded border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-navy">
            Role Alignment
          </span>
        </div>

        <Table
          columns={PC_COLS}
          rows={performanceRows}
          loading={isLoading}
          emptyTitle="No performance rows"
          emptyDescription="No performance contract rows were returned."
          emptyIcon="ti-file-analytics"
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="text-sm font-bold text-text">Turnaround Governance Rules & SLA Escalations</h3>
          <ShieldSecurity size={18} color="currentColor" variant="Outline" className="text-navy" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {governanceRules.map((rule) => (
            <div key={rule.sequence} className="space-y-1 rounded-xl border border-border bg-surface-1 p-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-navy">Rule {rule.sequence}</span>
              <p className="text-xs font-medium leading-relaxed text-text-2">{rule.rule}</p>
            </div>
          ))}
          {governanceRules.length === 0 && (
            <EmptyState title="No governance rules" description="No governance rules are available." icon="ti-shield-check" compact />
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <h3 className="text-sm font-bold text-text">External Research Foundations & Strategic Benchmarks</h3>
        </div>

        <div className="space-y-3">
          {evidenceRows.map((evidence) => (
            <div key={`${evidence.src}-${evidence.title}`} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-1 p-4 transition-all hover:bg-surface-2">
              <div className="max-w-3xl space-y-1">
                <span className="rounded border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-navy">{evidence.src}</span>
                <h4 className="mt-1 text-sm font-bold text-text">{evidence.title}</h4>
                <p className="text-xs font-medium leading-relaxed text-text-3">{evidence.copy}</p>
              </div>
              <a
                href={evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text transition-all hover:bg-surface-2"
              >
                View Source <ExportSquare size={14} color="currentColor" variant="Outline" />
              </a>
            </div>
          ))}
          {evidenceRows.length === 0 && (
            <EmptyState title="No evidence items" description="No evidence items are available." icon="ti-file-search" compact />
          )}
        </div>
      </div>

      <Modal
        open={showPlanModal}
        onClose={closePlanModal}
        title={planForm.id ? 'Edit turnaround plan' : 'Create turnaround plan'}
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closePlanModal} disabled={isSavingPlan}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSavePlan} disabled={isSavingPlan}>
              {isSavingPlan ? <BusyLabel>Saving...</BusyLabel> : planForm.id ? 'Save plan' : 'Create plan'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs font-semibold text-text">
            Plan name
            <input
              value={planForm.name}
              onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))}
              disabled={isSavingPlan}
              className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy disabled:cursor-wait disabled:opacity-60"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-text">
              Start date
              <input
                type="date"
                value={planForm.startDate}
                onChange={(event) => setPlanForm((current) => ({ ...current, startDate: event.target.value }))}
                disabled={isSavingPlan}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy disabled:cursor-wait disabled:opacity-60"
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold text-text">
              End date
              <input
                type="date"
                value={planForm.endDate}
                onChange={(event) => setPlanForm((current) => ({ ...current, endDate: event.target.value }))}
                disabled={isSavingPlan}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy disabled:cursor-wait disabled:opacity-60"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-text">
              Primary owner
              <Select
                options={[{ value: '', label: 'Unassigned' }, ...employeeOptions]}
                value={planForm.primaryOwnerId}
                onChange={(val) => setPlanForm((current) => ({ ...current, primaryOwnerId: val }))}
                className="w-full"
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold text-text">
              Branch ID
              <input
                type="number"
                value={planForm.branchId}
                onChange={(event) => setPlanForm((current) => ({ ...current, branchId: event.target.value }))}
                disabled={isSavingPlan}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy disabled:cursor-wait disabled:opacity-60"
              />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
