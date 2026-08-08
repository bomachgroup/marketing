import { useEffect, useState, type ReactNode } from 'react'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonKpiGrid, SkeletonList, SkeletonTableBodyRows, Topbar, Select } from '../shared'
import { useToast } from '../../context/ToastContext'
import { parseApiError } from '../../services/api/apiClient'
import { marketingService } from '../../services/api/marketingService'
import { teamService } from '../../services/api/teamService'
import { transformCoachingPrograms, type CoachingProgram } from '../../services/transformers/marketingTransformers'
import { transformEmployeeOptions, type EmployeeOption } from '../../services/transformers/teamTransformers'
import { AppIcon } from '../../components/shared/AppIcon'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function CoachingPage() {
  const [period, setPeriod] = useState('week')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [programs, setPrograms] = useState<CoachingProgram[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const { showToast } = useToast()

  const [form, setForm] = useState({
    employeeId: '',
    topic: '',
    date: todayKey(),
    time: '10:00',
  })

  async function loadCoaching() {
    setIsLoading(true)
    setApiError('')
    try {
      const [programRes, employeeRes] = await Promise.all([
        marketingService.getTrainingPrograms({ limit: 100 }),
        teamService.listEmployees({ is_active: true, limit: 100 }),
      ])

      if (programRes.data) setPrograms(transformCoachingPrograms(programRes.data))
      else {
        setPrograms([])
        setApiError(parseApiError(programRes.error || 'No backend coaching programs returned.'))
      }

      if (employeeRes.data) setEmployees(transformEmployeeOptions(employeeRes.data))
      else if (employeeRes.error) setApiError((prev) => [prev, parseApiError(employeeRes.error)].filter(Boolean).join(' '))
    } catch (err) {
      setPrograms([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadCoaching())
  }, [])

  async function handleScheduleSession() {
    if (!form.topic.trim()) {
      showToast('Please enter coaching topic', 'error')
      return
    }

    const employee = employees.find((item) => String(item.id) === form.employeeId)
    setIsSaving(true)
    try {
      const res = await marketingService.createTrainingProgram({
        program_name: form.topic.trim(),
        provider: 'Internal',
        description: `${form.topic.trim()}${form.time ? ` at ${form.time}` : ''}`,
        start_date: form.date,
        end_date: form.date,
        cost: 1,
        target_audience: employee ? employee.label : 'Sales team',
        status: 'pending',
      })

      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not schedule coaching program'), 'error')
        return
      }

      showToast('Coaching program created.', 'success')
      setShowScheduleModal(false)
      setForm({ employeeId: '', topic: '', date: todayKey(), time: '10:00' })
      await loadCoaching()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatus(program: CoachingProgram, status: string) {
    setIsSaving(true)
    try {
      const res = await marketingService.updateTrainingProgramStatus(program.id, status)
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not update coaching status'), 'error')
        return
      }
      showToast(`Coaching program marked ${status}.`, 'success')
      await loadCoaching()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const completed = programs.filter((program) => /complete|done/i.test(program.status)).length
  const inProgress = programs.filter((program) => /progress|active|ongoing/i.test(program.status)).length
  const pending = programs.filter((program) => /pending|draft|scheduled/i.test(program.status)).length
  const coverage = programs.length ? Math.round((completed / programs.length) * 100) : 0

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Sales coaching & enablement" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text">Sales Coaching & Enablement</h2>
            <p className="mt-0.5 text-xs text-text-3">Training programs, coaching coverage and completion tracking</p>
          </div>

          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95"
          >
            <AppIcon name="notebook" size={14} /> Schedule session
          </button>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadCoaching} compact /> : null}

        {isLoading ? (
          <SkeletonKpiGrid cards={4} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Program coverage" value={`${coverage}%`} foot={`${completed} of ${programs.length} complete`} icon="ti-users" tone="blue" />
            <Metric label="Active programs" value={inProgress} foot="Training in progress" icon="ti-headphones" tone="amber" />
            <Metric label="Pending programs" value={pending} foot="Awaiting completion" icon="ti-key" tone="rose" />
            <Metric label="Backend programs" value={programs.length} foot="Training records returned" icon="ti-certificate" tone="emerald" />
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="border-b border-border/80 pb-2">
            <h3 className="text-sm font-bold text-text">Coaching program matrix</h3>
            <p className="text-[11px] text-text-3">Rows are loaded from Training Programs.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border font-bold text-text-3">
                  <th className="px-3 py-2">Program</th>
                  <th className="px-3 py-2">Audience</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <SkeletonTableBodyRows rows={5} columns={6} />
                ) : programs.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-3"><EmptyState title="No coaching programs" description="No backend coaching programs were returned." icon="ti-school" compact /></td></tr>
                ) : (
                  programs.map((program) => (
                    <tr key={program.id} className="hover:bg-surface-1">
                      <td className="px-3 py-2.5 font-bold text-text">{program.name}</td>
                      <td className="px-3 py-2.5 text-text-3">{program.targetAudience}</td>
                      <td className="px-3 py-2.5 text-text-3">{program.provider}</td>
                      <td className="px-3 py-2.5 text-text-3">{program.dateMeta}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`rounded border px-2 py-0.5 text-[10.5px] font-extrabold ${statusClass(program.status)}`}>
                          {program.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-text">{program.score}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ProgramList title="This week's coaching sessions" programs={programs} disabled={isSaving} loading={isLoading} actionLabel="Complete" onAction={(program) => handleStatus(program, 'completed')} />
          <ProgramList title="Required role-play drills" programs={programs} disabled={isSaving} loading={isLoading} actionLabel="Start" onAction={(program) => handleStatus(program, 'in_progress')} />
        </div>
      </div>

      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule Sales Coaching Session">
        <div className="space-y-4">
          <Field label="Sales Representative">
            <Select
              options={[
                { value: '', label: 'Sales team' },
                ...employees.map((emp) => ({ value: String(emp.id), label: emp.label })),
              ]}
              value={form.employeeId}
              onChange={(val) => setForm({ ...form, employeeId: val })}
              className="w-full"
            />
          </Field>
          <Field label="Coaching Focus / Topic">
            <input type="text" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Closing high-value diaspora real estate leads" className={fieldClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={fieldClass} />
            </Field>
            <Field label="Time">
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={fieldClass} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-2">
            <button type="button" onClick={() => setShowScheduleModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1">
              Cancel
            </button>
            <button type="button" onClick={handleScheduleSession} disabled={isSaving} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Scheduling...</BusyLabel> : 'Schedule Session'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Metric({ label, value, foot, icon, tone }: { label: string; value: string | number; foot: string; icon: string; tone: string }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  }
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3.5 shadow-xs">
      <div className="min-w-0 space-y-1">
        <div className="truncate text-[11px] font-medium text-text-3">{label}</div>
        <div className="truncate text-xl font-extrabold tracking-tight text-text">{value}</div>
        <div className="truncate text-[10px] font-medium text-text-3">{foot}</div>
      </div>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tones[tone] || tones.blue}`}>
        <AppIcon name={icon.replace(/^ti-/, '')} size={14} />
      </div>
    </div>
  )
}

function ProgramList({ title, programs, disabled, loading, actionLabel, onAction }: { title: string; programs: CoachingProgram[]; disabled: boolean; loading: boolean; actionLabel: string; onAction: (program: CoachingProgram) => void }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <h3 className="border-b border-border/80 pb-2 text-sm font-bold text-text">{title}</h3>
      <div className="space-y-2">
        {loading && programs.length === 0 ? (
          <SkeletonList rows={4} />
        ) : programs.length === 0 ? (
          <EmptyState title="No training programs" description="No training programs were returned." icon="ti-school" compact />
        ) : (
          programs.map((program) => (
            <div key={`${title}-${program.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-1 p-2.5">
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-text">{program.name}</div>
                <div className="truncate text-[10.5px] font-medium text-text-3">{program.topic}</div>
              </div>
              <button
                type="button"
                onClick={() => onAction(program)}
                disabled={disabled}
                className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-[10.5px] font-semibold text-text transition-all hover:bg-surface-2 disabled:opacity-50"
              >
                {actionLabel}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (key.includes('complete') || key.includes('active')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (key.includes('progress') || key.includes('ongoing')) return 'bg-blue-50 text-blue-900 border-blue-200'
  if (key.includes('pending')) return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-surface-1 text-text-3 border-border'
}

const fieldClass = 'w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text outline-none focus:border-navy'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold text-text-2">{label}</span>
      {children}
    </label>
  )
}
