import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '../../../context/ToastContext'
import { BusyLabel, KCard, Card, EmptyState, ErrorState, Pill, SkeletonKpiGrid, SkeletonList, Table, Modal, Button, Select, Topbar } from '../../shared'
import { parseApiError } from '../../../services/api/apiClient'
import { marketingService } from '../../../services/api/marketingService'
import { teamService } from '../../../services/api/teamService'
import { pluralize, pluralizeNoun, sanitizePluralText } from '../../../utils/formatters'

type UnknownRecord = Record<string, unknown>
type TableRow = Record<string, string | number>

type DailyAction = {
  id: string | number
  title: string
  description: string
  ownerId: number | null
  ownerName: string
  severity: string
  status: string
  dueAtRaw: string
  dueAt: string
  completedAt: string
  completionNote: string
  sortOrder: number
  done: boolean
}

type ActionEditForm = {
  title: string
  description: string
  severity: string
  due_at: string
  sort_order: string
}

type TemplateForm = {
  title: string
  description: string
  defaultOwnerId: string
  branchId: string
  severity: string
  isActive: boolean
  sortOrder: string
}

type EmployeeOption = {
  value: string
  label: string
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
  return []
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

function normalizePercent(value: unknown, fallback = 0) {
  const parsed = num(value, fallback)
  return parsed <= 1 && parsed > 0 ? parsed * 100 : parsed
}

function actionId(value: unknown, fallback: string): string | number {
  return typeof value === 'string' || typeof value === 'number' ? value : fallback
}

function formatDateTime(value: unknown) {
  if (!value) return '-'
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

function titleCase(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function todayDateValue() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function toDateTimeLocalValue(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function toApiDateTime(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function transformAction(value: unknown): DailyAction {
  const data = record(value)
  const status = text(data.status).toLowerCase()
  const completedAt = text(data.completed_at)
  const dueAtRaw = text(data.due_at)

  return {
    id: actionId(data.id ?? data.action_id, `action-${Math.random().toString(36).slice(2)}`),
    title: text(data.title, 'Daily execution action'),
    description: text(data.description),
    ownerId: data.owner_id === null || data.owner_id === undefined ? null : num(data.owner_id),
    ownerName: text(data.owner_name, 'Unassigned'),
    severity: text(data.severity, 'warning').toLowerCase(),
    status: status || 'open',
    dueAtRaw,
    dueAt: formatDateTime(dueAtRaw),
    completedAt: completedAt ? formatDateTime(completedAt) : '',
    completionNote: text(data.completion_note),
    sortOrder: num(data.sort_order),
    done: Boolean(data.completed_at) || ['completed', 'complete', 'done'].includes(status),
  }
}

function transformSpeedRow(value: unknown): TableRow {
  const data = record(value)
  const score = num(data.score)
  return {
    id: actionId(data.lead_id, `lead-${Math.random().toString(36).slice(2)}`),
    lead: text(data.full_name, 'Unnamed lead'),
    source: text(data.source, '-'),
    due: formatDateTime(data.first_response_due_at),
    status: titleCase(text(data.sla_status, 'Unknown')),
    owner: text(data.assigned_to_name, 'Unassigned'),
    action: text(data.recommended_action, '-'),
    score: score ? `${score}` : '-',
  }
}

function transformScoreRow(value: unknown): TableRow {
  const data = record(value)
  return {
    id: text(data.role, `role-${Math.random().toString(36).slice(2)}`),
    role: text(data.role, 'Role'),
    standard: text(data.daily_standard, '-'),
    actual: sanitizePluralText(text(data.actual, '-')),
    score: `${num(data.score)}%`,
    focus: text(data.manager_focus, '-'),
  }
}

function severityVariant(severity: string) {
  if (severity === 'critical') return 'p-over'
  if (severity === 'warning') return 'p-pause'
  return 'p-active'
}

function severityClass(severity: string) {
  if (severity === 'critical') return 'border-l-red bg-red/5'
  if (severity === 'warning') return 'border-l-gold bg-gold/5'
  return 'border-l-green bg-green/5'
}

function isMissingExecutionDayError(error: unknown) {
  if (typeof error !== 'string') return false
  const normalized = error.toLowerCase()
  return normalized.includes('no dailyexecutionday matches') || normalized.includes('no daily execution day')
}

function summarySuggestsExecutionDay(summary: UnknownRecord | null) {
  if (!summary) return false
  const explicitId = summary.id ?? summary.day_id ?? summary.daily_execution_day_id
  if (explicitId !== undefined && explicitId !== null && explicitId !== '') return true
  return ['total_actions', 'open_actions', 'completed_actions', 'next_actions_due'].some((key) => num(summary[key]) > 0)
}

export function DailyExecutionPage() {
  const { showToast } = useToast()
  const [summary, setSummary] = useState<UnknownRecord | null>(null)
  const [day, setDay] = useState<UnknownRecord | null>(null)
  const [actions, setActions] = useState<DailyAction[]>([])
  const [speedRows, setSpeedRows] = useState<TableRow[]>([])
  const [scoreRows, setScoreRows] = useState<TableRow[]>([])
  const [selectedDate, setSelectedDate] = useState(todayDateValue)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpeningDay, setIsOpeningDay] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [savingActionId, setSavingActionId] = useState<string | number | null>(null)
  const [apiError, setApiError] = useState('')
  const [canOpenToday, setCanOpenToday] = useState(false)
  const [missingDay, setMissingDay] = useState(false)
  const [editingAction, setEditingAction] = useState<DailyAction | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([])
  const [editForm, setEditForm] = useState<ActionEditForm>({
    title: '',
    description: '',
    severity: 'warning',
    due_at: '',
    sort_order: '0',
  })
  const [templateForm, setTemplateForm] = useState<TemplateForm>({
    title: '',
    description: '',
    defaultOwnerId: '',
    branchId: '',
    severity: 'warning',
    isActive: true,
    sortOrder: '0',
  })

  const loadDailyExecution = useCallback(async () => {
    setIsLoading(true)
    setApiError('')
    setCanOpenToday(false)
    setMissingDay(false)

    try {
      const isToday = selectedDate === todayDateValue()
      const [summaryRes, speedRes, scoreRes] = await Promise.all([
        marketingService.getRevenueExecutionSummary({ date: selectedDate }),
        marketingService.getSpeedToLeadQueue({ limit: 20 }),
        marketingService.getActivityScorecard({ date: selectedDate }),
      ])

      const nextSummary = summaryRes.data ? record(summaryRes.data) : null
      const shouldLoadDay = summarySuggestsExecutionDay(nextSummary)
      const dayRes = shouldLoadDay
        ? isToday
          ? await marketingService.getDailyExecutionRecords()
          : await marketingService.getDailyExecutionDay(selectedDate)
        : null
      const dayMissing = !shouldLoadDay || dayRes?.status === 404 || isMissingExecutionDayError(dayRes?.error)
      const errors = [summaryRes, ...(dayMissing || !dayRes ? [] : [dayRes]), speedRes, scoreRes]
        .map((res) => res.error)
        .filter((error) => !isMissingExecutionDayError(error))
        .filter(Boolean)

      if (errors.length) {
        setApiError(parseApiError(errors[0]))
      }

      if (nextSummary) setSummary(nextSummary)

      if (dayRes?.data) {
        const dayData = record(dayRes.data)
        setDay(dayData)
        setActions(asArray(dayData.actions).map(transformAction).sort((a, b) => a.sortOrder - b.sortOrder))
      } else {
        setDay(null)
        setActions([])
        setMissingDay(dayMissing)
        setCanOpenToday(isToday && (dayMissing || Boolean(dayRes?.error)))
      }

      if (speedRes.data) setSpeedRows(asArray(speedRes.data).map(transformSpeedRow))
      if (scoreRes.data) setScoreRows(asArray(scoreRes.data).map(transformScoreRow))
    } catch (err) {
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDailyExecution()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDailyExecution])

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

  const completedActions = summary?.completed_actions !== undefined
    ? num(summary.completed_actions)
    : actions.filter((action) => action.done).length
  const totalActions = summary?.total_actions !== undefined
    ? num(summary.total_actions)
    : actions.length
  const executionPct = summary?.completion_pct !== undefined
    ? Math.round(normalizePercent(summary.completion_pct))
    : totalActions
      ? Math.round((completedActions / totalActions) * 100)
      : 0
  const openActions = summary?.open_actions !== undefined
    ? num(summary.open_actions)
    : Math.max(0, totalActions - completedActions)
  const slaBreaches = num(summary?.sla_breaches)
  const hotOpportunities = num(summary?.hot_opportunities)
  const nextActionsDue = num(summary?.next_actions_due)
  const dayLabel = text(day?.date, text(summary?.date, selectedDate))

  const actionRows = useMemo(() => actions, [actions])

  function openEditAction(action: DailyAction) {
    setEditingAction(action)
    setEditForm({
      title: action.title,
      description: action.description,
      severity: action.severity,
      due_at: toDateTimeLocalValue(action.dueAtRaw),
      sort_order: String(action.sortOrder),
    })
  }

  function closeEditAction() {
    if (isSavingEdit) return
    setEditingAction(null)
    setEditForm({
      title: '',
      description: '',
      severity: 'warning',
      due_at: '',
      sort_order: '0',
    })
  }

  function closeTemplateModal() {
    if (isSavingTemplate) return
    setShowTemplateModal(false)
    setTemplateForm({
      title: '',
      description: '',
      defaultOwnerId: '',
      branchId: '',
      severity: 'warning',
      isActive: true,
      sortOrder: '0',
    })
  }

  async function handleOpenToday() {
    setIsOpeningDay(true)
    try {
      const res = await marketingService.openDailyExecutionDay()
      if (res.data) {
        showToast('Daily execution day opened.', 'success')
        await loadDailyExecution()
      } else {
        showToast(parseApiError(res.error || 'Could not open daily execution day'), 'error')
      }
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not open daily execution day'), 'error')
    } finally {
      setIsOpeningDay(false)
    }
  }

  async function handleCreateTemplate() {
    if (!templateForm.title.trim()) {
      showToast('Action title is required', 'error')
      return
    }

    setIsSavingTemplate(true)
    try {
      const branchId = templateForm.branchId ? num(templateForm.branchId) : null
      const res = await marketingService.createDailyActionTemplate({
        title: templateForm.title.trim(),
        description: templateForm.description.trim() || null,
        default_owner_id: templateForm.defaultOwnerId ? num(templateForm.defaultOwnerId) : null,
        branch_id: branchId,
        severity: templateForm.severity,
        is_active: templateForm.isActive,
        sort_order: num(templateForm.sortOrder),
      })

      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not create daily action'), 'error')
        return
      }

      showToast('Daily action created.', 'success')
      setShowTemplateModal(false)
      setTemplateForm({
        title: '',
        description: '',
        defaultOwnerId: '',
        branchId: '',
        severity: 'warning',
        isActive: true,
        sortOrder: '0',
      })
      if (selectedDate === todayDateValue()) {
        await marketingService.openDailyExecutionDay({
          branch_id: branchId,
          force_rebuild: true,
        })
      }
      await loadDailyExecution()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not create daily action'), 'error')
    } finally {
      setIsSavingTemplate(false)
    }
  }

  async function handleToggleAction(action: DailyAction) {
    setSavingActionId(action.id)
    try {
      const res = action.done
        ? await marketingService.reopenDailyAction(action.id)
        : await marketingService.completeDailyAction(action.id, {})

      if (res.data) {
        const updated = transformAction(res.data)
        setActions((current) => current.map((item) => (item.id === action.id ? updated : item)))
        showToast(action.done ? 'Action reopened.' : 'Action completed.', 'success')
        await loadDailyExecution()
      } else {
        showToast(parseApiError(res.error || 'Could not update daily action'), 'error')
      }
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not update daily action'), 'error')
    } finally {
      setSavingActionId(null)
    }
  }

  async function handleSaveActionEdit() {
    if (!editingAction) return
    if (!editForm.title.trim()) {
      showToast('Action title is required', 'error')
      return
    }

    setIsSavingEdit(true)
    try {
      const res = await marketingService.updateDailyAction(editingAction.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        severity: editForm.severity,
        due_at: toApiDateTime(editForm.due_at),
        sort_order: num(editForm.sort_order, editingAction.sortOrder),
      })

      if (res.data) {
        const updated = transformAction(res.data)
        setActions((current) => current.map((item) => (item.id === editingAction.id ? updated : item)))
        showToast('Action updated.', 'success')
        closeEditAction()
        await loadDailyExecution()
      } else {
        showToast(parseApiError(res.error || 'Could not update daily action'), 'error')
      }
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not update daily action'), 'error')
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
      <Topbar
        title={`Daily execution - ${dayLabel}`}
        hidePeriod
        action={
          <div className="flex min-w-0 flex-1 flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value || todayDateValue())}
              className="h-8 min-w-0 rounded-xl border border-border bg-surface px-3 text-xs font-medium text-text outline-none focus:border-navy"
              aria-label="Daily execution date"
            />
            {canOpenToday && (
              <button
                type="button"
                disabled={isOpeningDay}
                onClick={handleOpenToday}
                className="inline-flex min-w-0 items-center justify-center rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text disabled:cursor-wait disabled:opacity-60"
              >
                {isOpeningDay ? <BusyLabel>Opening...</BusyLabel> : 'Open today'}
              </button>
            )}
          </div>
        }
      />

      {apiError && <ErrorState message={apiError} onRetry={() => void loadDailyExecution()} compact />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full">
            <SkeletonKpiGrid cards={4} />
          </div>
        ) : (
          <>
            <KCard label="SLA breaches" value={slaBreaches.toString()} sub="Target: 0" />
            <KCard label="Hot opportunities" value={hotOpportunities.toString()} sub="Speed-to-lead queue" />
            <KCard label="Next actions due" value={nextActionsDue.toString()} sub={pluralize(openActions, 'open action')} />
            <KCard
              label="Execution complete"
              value={`${executionPct}%`}
              sub={`${completedActions}/${totalActions} ${pluralizeNoun(totalActions, 'action')}`}
            />
          </>
        )}
      </div>

      <Card
        title="Non-negotiable actions"
        className="max-h-[440px] overflow-y-auto"
        action={
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-navy px-3 py-1.5 text-xs font-semibold text-white"
          >
            <i className="ti ti-plus text-sm" aria-hidden />
            <span>Create action</span>
          </button>
        }
      >
        <div className="space-y-2">
          {isLoading ? (
            <SkeletonList rows={6} />
          ) : actionRows.map((action) => (
            <div
              key={action.id}
              className={`flex items-start gap-3 rounded-lg border-l-4 p-3 ${severityClass(action.severity)}`}
            >
              <input
                type="checkbox"
                checked={action.done}
                disabled={savingActionId === action.id}
                className="mt-0.5 h-4 w-4 rounded border-border accent-navy disabled:cursor-wait disabled:opacity-60"
                onChange={() => handleToggleAction(action)}
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-medium ${
                    action.done ? 'text-text-3 line-through' : 'text-text'
                  }`}
                >
                  {action.title}
                </span>
                <span className="block text-xs text-text-3">{action.ownerName}</span>
                {action.description && <span className="mt-1 block text-xs text-text-3">{action.description}</span>}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-3">
                  <span>Due: {action.dueAt}</span>
                  {action.completedAt && <span>Completed: {action.completedAt}</span>}
                  {action.completionNote && <span>Note: {action.completionNote}</span>}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Pill variant={severityVariant(action.severity)}>{action.severity}</Pill>
                <button
                  type="button"
                  onClick={() => openEditAction(action)}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-text-2 hover:bg-surface-1"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
          {!isLoading && actionRows.length === 0 && (
            <EmptyState
              title={missingDay ? 'No daily execution day' : 'No open actions'}
              description={missingDay ? `No daily execution day exists for ${selectedDate}.` : 'No daily execution actions are open for this date.'}
              icon="ti-calendar-x"
              compact
            />
          )}
        </div>
      </Card>

      <Card
        title="Speed-to-lead SLA"
        action={<span className="text-xs font-medium text-navy">{speedRows.length} queued</span>}
      >
        <Table
          columns={[
            { key: 'lead', label: 'Lead' },
            { key: 'source', label: 'Source' },
            { key: 'due', label: 'Due' },
            { key: 'status', label: 'SLA status' },
            { key: 'owner', label: 'Owner' },
            { key: 'score', label: 'Score' },
            { key: 'action', label: 'Action' },
          ]}
          rows={speedRows}
          loading={isLoading}
          emptyTitle="No speed-to-lead rows"
          emptyDescription="No speed-to-lead rows were returned for this date."
          emptyIcon="ti-bolt"
        />
      </Card>

      <Card title="Activity scorecard by role">
        <Table
          columns={[
            { key: 'role', label: 'Role' },
            { key: 'standard', label: 'Daily standard' },
            { key: 'actual', label: 'Actual' },
            { key: 'score', label: 'Score' },
            { key: 'focus', label: 'Manager focus' },
          ]}
          rows={scoreRows}
          loading={isLoading}
          emptyTitle="No activity scorecard rows"
          emptyDescription="No activity scorecard rows were returned for this date."
          emptyIcon="ti-chart-bar"
        />
      </Card>

      <Modal
        open={showTemplateModal}
        onClose={closeTemplateModal}
        title="Create daily action"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeTemplateModal} disabled={isSavingTemplate}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateTemplate} disabled={isSavingTemplate}>
              {isSavingTemplate ? <BusyLabel>Saving...</BusyLabel> : 'Create action'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs font-semibold text-text">
            Title
            <input
              value={templateForm.title}
              onChange={(event) => setTemplateForm((current) => ({ ...current, title: event.target.value }))}
              disabled={isSavingTemplate}
              className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy disabled:cursor-wait disabled:opacity-60"
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold text-text">
            Description
            <textarea
              value={templateForm.description}
              onChange={(event) => setTemplateForm((current) => ({ ...current, description: event.target.value }))}
              disabled={isSavingTemplate}
              rows={3}
              className="resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal text-text outline-none focus:border-navy disabled:cursor-wait disabled:opacity-60"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-text">
              Default owner
              <Select
                options={[{ value: '', label: 'Unassigned' }, ...employeeOptions]}
                value={templateForm.defaultOwnerId}
                onChange={(val) => setTemplateForm((current) => ({ ...current, defaultOwnerId: val }))}
                className="w-full"
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold text-text">
              Branch ID
              <input
                type="number"
                value={templateForm.branchId}
                onChange={(event) => setTemplateForm((current) => ({ ...current, branchId: event.target.value }))}
                disabled={isSavingTemplate}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy disabled:cursor-wait disabled:opacity-60"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-xs font-semibold text-text">
              Severity
              <Select
                options={[
                  { value: 'critical', label: 'Critical' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'success', label: 'Success' },
                ]}
                value={templateForm.severity}
                onChange={(val) => setTemplateForm((current) => ({ ...current, severity: val }))}
                className="w-full"
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold text-text">
              Sort order
              <input
                type="number"
                value={templateForm.sortOrder}
                onChange={(event) => setTemplateForm((current) => ({ ...current, sortOrder: event.target.value }))}
                disabled={isSavingTemplate}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy disabled:cursor-wait disabled:opacity-60"
              />
            </label>

            <label className="flex items-center gap-2 self-end rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-text">
              <input
                type="checkbox"
                checked={templateForm.isActive}
                onChange={(event) => setTemplateForm((current) => ({ ...current, isActive: event.target.checked }))}
                disabled={isSavingTemplate}
                className="h-4 w-4 rounded border-border accent-navy disabled:cursor-wait disabled:opacity-60"
              />
              Active
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(editingAction)}
        onClose={closeEditAction}
        title="Edit daily action"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeEditAction} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveActionEdit} disabled={isSavingEdit}>
              {isSavingEdit ? <BusyLabel>Saving...</BusyLabel> : 'Save action'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs font-semibold text-text">
            Title
            <input
              value={editForm.title}
              onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
              className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy"
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold text-text">
            Description
            <textarea
              value={editForm.description}
              onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className="resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal text-text outline-none focus:border-navy"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-xs font-semibold text-text">
              Severity
              <Select
                options={[
                  { value: 'critical', label: 'Critical' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'success', label: 'Success' },
                ]}
                value={editForm.severity}
                onChange={(val) => setEditForm((current) => ({ ...current, severity: val }))}
                className="w-full"
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold text-text sm:col-span-2">
              Due date
              <input
                type="datetime-local"
                value={editForm.due_at}
                onChange={(event) => setEditForm((current) => ({ ...current, due_at: event.target.value }))}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy"
              />
            </label>
          </div>

          <label className="grid gap-1 text-xs font-semibold text-text sm:w-32">
            Sort order
            <input
              type="number"
              value={editForm.sort_order}
              onChange={(event) => setEditForm((current) => ({ ...current, sort_order: event.target.value }))}
              className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-normal text-text outline-none focus:border-navy"
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
