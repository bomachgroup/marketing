import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flag, TaskSquare, TickCircle } from 'iconsax-react'
import { BusyLabel, EmptyState, ErrorState, KCard, SkeletonKpiGrid, SkeletonList, TabBar, Topbar } from '../shared'
import { useToast } from '../../context/ToastContext'
import { parseApiError } from '../../services/api/apiClient'
import { marketingService } from '../../services/api/marketingService'
import NoPermissionPage from '../layout/NoPermissionPage'

const TABS = [
  { id: 'progress', label: 'OKR progress' },
  { id: 'edit', label: 'Edit targets' },
]

const PERIOD_OPTIONS = [
  { value: 'week', label: 'This week' },
  { value: 'today', label: 'Today' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'This quarter' },
]

type UnknownRecord = Record<string, unknown>

type KeyResult = {
  id: string | number
  objectiveId: string | number
  title: string
  targetValue: string
  actualValue: string
  unit: string
  pct: number
  status: string
  canSave: boolean
}

type Objective = {
  id: string | number
  title: string
  description: string
  period: string
  pct: number
  status: string
  keyResults: KeyResult[]
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

function displayValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '0'
  return String(value)
}

function periodText(data: UnknownRecord) {
  const start = text(data.period_start)
  const end = text(data.period_end)
  return [start, end].filter(Boolean).join(' to ')
}

function progressColor(pct: number) {
  if (pct >= 90) return '#0A6B3E'
  if (pct >= 70) return '#B87D00'
  return '#CC0000'
}

function transformObjectives(value: unknown): Objective[] {
  return asArray(value).map((objective, objectiveIndex) => {
    const data = record(objective)
    const objectiveId = typeof data.id === 'string' || typeof data.id === 'number' ? data.id : `objective-${objectiveIndex}`
    const keyResults = asArray(data.key_results || data.krs).map((kr, keyResultIndex) => {
      const krData = record(kr)
      const id = typeof krData.id === 'string' || typeof krData.id === 'number' ? krData.id : `${objectiveId}-${keyResultIndex}`
      return {
        id,
        objectiveId,
        title: text(krData.title || krData.name || krData.label, `Key result ${keyResultIndex + 1}`),
        targetValue: displayValue(krData.target_value ?? krData.target),
        actualValue: displayValue(krData.actual_value ?? krData.actual),
        unit: text(krData.unit),
        pct: normalizePercent(krData.progress_percentage || krData.progress || krData.percent),
        status: text(krData.track_status || krData.status, 'at_risk'),
        canSave: typeof krData.id === 'string' || typeof krData.id === 'number',
      }
    })

    return {
      id: objectiveId,
      title: text(data.title || data.objective || data.obj, `Objective ${objectiveIndex + 1}`),
      description: text(data.description),
      period: periodText(data),
      pct: normalizePercent(data.progress_percentage || data.progress || data.percent),
      status: text(data.track_status || data.status, 'active'),
      keyResults,
    }
  })
}

function metricFromSummary(summary: UnknownRecord | null, keys: string[], fallback: number) {
  for (const key of keys) {
    if (summary && summary[key] !== undefined && summary[key] !== null) return normalizePercent(summary[key], fallback)
  }
  return fallback
}

export function OkrsPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('progress')
  const [period, setPeriod] = useState('week')
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [targetSummary, setTargetSummary] = useState<UnknownRecord | null>(null)
  const [editRows, setEditRows] = useState<KeyResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const loadOkrs = useCallback(async () => {
    setIsLoading(true)
    setApiError('')

    try {
      const [okrRes, targetRes] = await Promise.all([
        marketingService.getRevenueOkrs(),
        marketingService.getRevenueTargetsSummary({ period }),
      ])

      if (okrRes.error || targetRes.error) {
        setApiError(parseApiError(okrRes.error || targetRes.error))
      }

      const mapped = transformObjectives(okrRes.data)
      setObjectives(mapped)
      setEditRows(mapped.flatMap((objective) => objective.keyResults))
      setTargetSummary(targetRes.data ? record(targetRes.data) : null)
    } catch (err) {
      setApiError(parseApiError(err))
      setObjectives([])
      setEditRows([])
      setTargetSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadOkrs()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadOkrs])

  const okrProgress = useMemo(() => {
    const rows = objectives.flatMap((objective) => objective.keyResults)
    const source = rows.length ? rows : objectives
    const total = source.length
    const onTrack = source.filter((item) => item.pct >= 90).length
    const atRisk = source.filter((item) => item.pct >= 70 && item.pct < 90).length
    const offTrack = source.filter((item) => item.pct < 70).length
    const calculatedOverall = total ? Math.round(source.reduce((sum, item) => sum + item.pct, 0) / total) : 0
    const overall = metricFromSummary(targetSummary, ['overall_progress', 'progress_percentage', 'completion_pct'], calculatedOverall)
    return { onTrack, atRisk, offTrack, overall }
  }, [objectives, targetSummary])

  const updateRow = (index: number, field: 'targetValue' | 'actualValue', value: string) => {
    setEditRows((prev) => {
      const next = [...prev]
      const row = { ...next[index], [field]: value }
      const target = num(row.targetValue, 1) || 1
      const actual = num(row.actualValue)
      row.pct = normalizePercent((actual / target) * 100)
      next[index] = row
      return next
    })
  }

  const handleSaveTargets = async () => {
    const savableRows = editRows.filter((row) => row.canSave)
    if (!savableRows.length) {
      showToast('No backend key results are available to update.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const results = await Promise.all(
        savableRows.map((row) =>
          marketingService.updateRevenueKeyResult(row.id, {
            title: row.title,
            target_value: row.targetValue,
            actual_value: row.actualValue,
            unit: row.unit || null,
          }),
        ),
      )

      const failed = results.find((result) => result.error)
      if (failed) {
        showToast(failed.error, 'error')
        return
      }

      showToast('Weekly revenue targets updated', 'success')
      await loadOkrs()
    } catch (err) {
      showToast(err, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="okrs" />
  }

  return (
    <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-4 sm:p-6 md:p-8">
      <Topbar
        title="OKRs & weekly targets"
        period={period}
        onPeriodChange={setPeriod}
        periodOptions={PERIOD_OPTIONS}
        action={
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95"
          >
            <TaskSquare color="currentColor" variant="Outline" size={15} />
            <span className="truncate">Edit targets</span>
          </button>
        }
      />

      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {apiError ? <ErrorState message={apiError} compact /> : null}

      {activeTab === 'progress' && (
        <>
          {isLoading ? (
            <SkeletonKpiGrid />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KCard label="Overall progress" value={`${okrProgress.overall}%`} sub="All key results average" trend="API-backed" trendUp />
              <KCard label="On track objectives" value={okrProgress.onTrack.toString()} sub=">=90% completion" trend="Meeting target" trendUp />
              <KCard label="At risk objectives" value={okrProgress.atRisk.toString()} sub="70-89% completion" trend="Requires push" trendUp={false} />
              <KCard label="Off track objectives" value={okrProgress.offTrack.toString()} sub="<70% completion" trend="Urgent action" trendUp={false} />
            </div>
          )}

          {isLoading ? (
            <SkeletonList rows={4} />
          ) : objectives.length ? (
            <div className="space-y-4">
              {objectives.map((objective) => (
                <section key={objective.id} className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Flag size={18} color="currentColor" variant="Outline" className="shrink-0 text-navy" />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-text">{objective.title}</h3>
                        {objective.description ? <p className="mt-0.5 text-xs text-text-3">{objective.description}</p> : null}
                      </div>
                    </div>
                    <span className="rounded border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-navy">
                      {objective.period || objective.status}
                    </span>
                  </div>

                  {objective.keyResults.length ? (
                    <div className="space-y-3.5">
                      {objective.keyResults.map((kr) => (
                        <div key={kr.id} className="space-y-2 rounded-xl border border-border bg-surface-1 p-3.5">
                          <div className="flex items-center justify-between gap-3 text-xs font-bold text-text">
                            <span className="min-w-0 truncate">{kr.title}</span>
                            <span className="shrink-0 font-extrabold text-navy">{kr.pct}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${kr.pct}%`, backgroundColor: progressColor(kr.pct) }} />
                          </div>
                          <p className="text-[10px] font-medium text-text-3">
                            Actual {kr.actualValue} / Target {kr.targetValue} {kr.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No key results" description="No backend key results were returned for this objective." icon="ti-target" compact />
                  )}
                </section>
              ))}
            </div>
          ) : (
            <EmptyState title="No OKRs" description="No backend OKRs were returned for this period." icon="ti-flag" compact />
          )}
        </>
      )}

      {activeTab === 'edit' && (
        <section className="space-y-5 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="border-b border-border/80 pb-3">
            <h3 className="text-base font-bold text-text">Edit Weekly Revenue & Marketing Targets</h3>
            <p className="text-xs text-text-3">Updates are saved to backend key results before the page refreshes.</p>
          </div>

          {editRows.length ? (
            <div className="space-y-3">
              {editRows.map((row, index) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-1 p-3.5">
                  <span className="min-w-0 flex-1 text-xs font-bold text-text sm:w-48 sm:shrink-0 sm:flex-none">{row.title}</span>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:min-w-[260px]">
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[120px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">Target</span>
                      <input
                        type="text"
                        value={row.targetValue}
                        onChange={(event) => updateRow(index, 'targetValue', event.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-navy/30"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[120px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">Actual</span>
                      <input
                        type="text"
                        value={row.actualValue}
                        onChange={(event) => updateRow(index, 'actualValue', event.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-navy/30"
                      />
                    </div>
                    <div className="flex w-16 shrink-0 flex-col items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">Pacing</span>
                      <span className={`text-xs font-extrabold ${row.pct >= 90 ? 'text-emerald-600' : row.pct >= 70 ? 'text-amber-600' : 'text-red'}`}>
                        {row.pct}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No backend key results are available for editing." />
          )}

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleSaveTargets}
              disabled={isSaving || !editRows.length}
              className="flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : <><TickCircle size={16} color="currentColor" variant="Outline" /> Save Updated Targets</>}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
