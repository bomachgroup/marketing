import { useEffect, useState } from 'react'
import { BusyLabel, EmptyState, ErrorState, Modal, Pill, Select, SkeletonKpiGrid, SkeletonTable, Topbar } from '../shared'
import { useToast } from '../../context/ToastContext'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import { transformContentCalendar, type MarketingCalendarItem } from '../../services/transformers/marketingTransformers'
import { AppIcon } from '../../components/shared/AppIcon'
import NoPermissionPage from '../layout/NoPermissionPage'

type CalendarState = ReturnType<typeof transformContentCalendar>

const divisionOptions = [
  ['real_estate', 'Real Estate'],
  ['benji', 'Benji'],
  ['engineering', 'Engineering'],
  ['surveying', 'Surveying'],
  ['ict', 'ICT'],
  ['agriculture', 'Agriculture'],
]

const formatOptions = [
  ['graphic', 'Graphic'],
  ['video', 'Video'],
  ['carousel', 'Carousel'],
  ['text_image', 'Text + Image'],
  ['other', 'Other'],
]

const platformOptions = [
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['tiktok', 'TikTok'],
  ['linkedin', 'LinkedIn'],
  ['whatsapp', 'WhatsApp'],
  ['multiple', 'Multiple'],
]

const statusOptions = [
  ['briefed', 'Briefed'],
  ['in_progress', 'In Progress'],
  ['in_review', 'In Review'],
  ['scheduled', 'Scheduled'],
  ['published', 'Published'],
]

function startOfWeek() {
  const today = new Date()
  const day = today.getDay()
  const offset = day === 0 ? -6 : 1 - day
  today.setDate(today.getDate() + offset)
  return today.toISOString().slice(0, 10)
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function weekTitle(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  return `Week of ${startDate.toLocaleDateString('en-NG', { month: 'long', day: 'numeric' })}-${endDate.toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })}`
}

function optionTuples(options: { value: string; label: string }[], fallback: string[][]) {
  return options.length ? options.map((option) => [option.value, option.label]) : fallback
}

export function CalendarPage() {
  const [period, setPeriod] = useState('week')
  const [weekStart, setWeekStart] = useState(startOfWeek)
  const [calendar, setCalendar] = useState<CalendarState>(() => transformContentCalendar({}, weekStart))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MarketingCalendarItem | null>(null)
  const [publishingItemId, setPublishingItemId] = useState<string | number | null>(null)
  const [form, setForm] = useState({
    title: '',
    format: 'graphic',
    platform: 'instagram',
    division: 'real_estate',
    dueDate: weekStart,
    status: 'briefed',
    funnelStage: '',
    description: '',
  })
  const { showToast } = useToast()

  async function loadCalendar(targetWeek = weekStart) {
    setIsLoading(true)
    setApiError('')
    try {
      const res = await marketingService.getContentBriefs({ week_start: targetWeek })
      if (res.data) {
        setCalendar(transformContentCalendar(res.data, targetWeek))
      } else if (res.error) {
        setCalendar(transformContentCalendar({}, targetWeek))
        setApiError(parseApiError(res.error))
      }
    } catch (err) {
      setCalendar(transformContentCalendar({}, targetWeek))
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadCalendar(weekStart))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  function moveWeek(days: number) {
    setWeekStart((current) => addDays(current, days))
  }

  function resetForm() {
    setForm({ title: '', format: 'graphic', platform: 'instagram', division: 'real_estate', dueDate: weekStart, status: 'briefed', funnelStage: '', description: '' })
  }

  function openCreateBrief() {
    setEditingItem(null)
    resetForm()
    setShowBriefModal(true)
  }

  function openEditBrief(item: MarketingCalendarItem) {
    if (!item.id) {
      showToast('This calendar item has no backend ID.', 'error')
      return
    }
    setEditingItem(item)
    setForm({
      title: item.title,
      format: item.format,
      platform: item.platform,
      division: item.division,
      dueDate: item.dueDate || weekStart,
      status: item.status || 'briefed',
      funnelStage: '',
      description: '',
    })
    setShowBriefModal(true)
  }

  async function handleCreateBrief() {
    if (!form.title.trim()) {
      showToast('Please enter a content title', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.createContentBrief({
        title: form.title.trim(),
        format: form.format,
        platform: form.platform,
        division: form.division,
        due_date: form.dueDate || null,
        description: form.description.trim() || null,
        status: form.status,
        funnel_stage: form.funnelStage || null,
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not create content brief'), 'error')
        return
      }

      showToast(`Content brief "${form.title}" created.`, 'success')
      setShowBriefModal(false)
      resetForm()
      await loadCalendar(weekStart)
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateBrief() {
    if (!editingItem?.id) return
    if (!form.title.trim()) {
      showToast('Please enter a content title', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.updateContentBrief(editingItem.id, {
        title: form.title.trim(),
        format: form.format,
        platform: form.platform,
        division: form.division,
        due_date: form.dueDate || null,
        description: form.description.trim() || null,
        status: form.status,
        funnel_stage: form.funnelStage || null,
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not update content brief'), 'error')
        return
      }

      showToast('Content brief updated.', 'success')
      setShowBriefModal(false)
      setEditingItem(null)
      resetForm()
      await loadCalendar(weekStart)
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublishBrief(item: MarketingCalendarItem) {
    if (!item.id) {
      showToast('This calendar item has no backend ID.', 'error')
      return
    }

    setPublishingItemId(item.id)
    try {
      const res = await marketingService.publishContentBrief(item.id, {
        published_at: new Date().toISOString(),
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not publish content brief'), 'error')
        return
      }

      showToast('Content brief published.', 'success')
      await loadCalendar(weekStart)
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setPublishingItemId(null)
    }
  }

  const [isExporting, setIsExporting] = useState(false)

  async function handleExportCalendar() {
    setIsExporting(true)
    try {
      const res = await marketingService.exportContentCalendar({ week_start: weekStart })
      if (res.error) {
        showToast(parseApiError(res.error), 'error')
        return
      }
      showToast('Content calendar exported.', 'success')
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsExporting(false)
    }
  }

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="calendar" />
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Content calendar" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-text">{calendar.label || weekTitle(calendar.weekStart, calendar.weekEnd)}</h3>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCalendar}
                disabled={isExporting}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 active:scale-95 disabled:opacity-60 transition-all"
              >
                {isExporting ? <BusyLabel>Exporting...</BusyLabel> : <><AppIcon name="download" size={14} /> Export</>}
              </button>
              <button
                type="button"
                onClick={() => moveWeek(-7)}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 active:scale-95 transition-all"
              >
                <AppIcon name="arrow-left" size={14} /> Prev
              </button>
              <button
                type="button"
                onClick={() => moveWeek(7)}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 active:scale-95 transition-all"
              >
                Next <AppIcon name="arrow-right" size={14} />
              </button>
              <button
                type="button"
                onClick={openCreateBrief}
                className="flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-navy-dark active:scale-95 transition-all"
              >
                <AppIcon name="plus" size={14} /> New brief
              </button>
            </div>
          </div>

          {apiError ? <ErrorState message={apiError} onRetry={() => loadCalendar(weekStart)} compact /> : null}

          {isLoading ? (
            <SkeletonKpiGrid cards={5} />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <KpiCard label="Total" value={calendar.summary.total} />
              <KpiCard label="Published" value={calendar.summary.publishedCount} />
              <KpiCard label="Scheduled" value={calendar.summary.scheduledCount} />
              <KpiCard label="In progress" value={calendar.summary.inProgressCount} />
              <KpiCard label="Overdue" value={calendar.summary.overdueCount} tone="text-rose-600" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-surface p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-7">
            {calendar.days.map((day) => (
              <div key={day.key} className={`min-h-[120px] min-w-0 space-y-2 rounded-xl border p-2 ${day.isToday ? 'border-navy bg-blue-50' : 'border-border/60 bg-surface-1/50'}`}>
                <div className="flex items-center justify-between border-b border-border/40 pb-1 text-[11px] font-bold text-text-3">
                  <span>{day.num}</span>
                  <span>{day.name}</span>
                </div>

                <div className="space-y-1">
                  {day.items.map((item) => (
                    <div key={String(item.id || item.title)} className="truncate rounded bg-blue-100 p-1 px-1.5 text-[10px] font-bold text-blue-800">
                      {item.title}
                    </div>
                  ))}
                  {!isLoading && day.items.length === 0 && (
                    <div className="py-4 text-center text-[10.5px] font-medium text-text-3">
                      No items
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">All content items this week</h3>
              <span className="text-xs font-medium text-text-3">
                {calendar.summary.publishedLabel} - {calendar.summary.overdueCount} overdue
              </span>
            </div>

            {isLoading ? (
              <SkeletonTable rows={6} columns={7} />
            ) : calendar.items.length === 0 ? (
              <EmptyState title="No content items" description="No content items were returned for this week." icon="ti-calendar" compact />
            ) : (
              <div className="overflow-hidden">
                <table className="w-full table-fixed border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border font-bold text-text-3">
                      <th className="px-3 py-2.5">Title</th>
                      <th className="hidden px-3 py-2.5 sm:table-cell">Format</th>
                      <th className="hidden px-3 py-2.5 md:table-cell">Platform</th>
                      <th className="hidden px-3 py-2.5 lg:table-cell">Division</th>
                      <th className="hidden px-3 py-2.5 lg:table-cell">Owner</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Due</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {calendar.items.map((item) => (
                      <tr key={String(item.id || item.title)} className="hover:bg-surface-1">
                        <td className="break-words px-3 py-2.5 font-bold text-text">{item.title}</td>
                        <td className="hidden px-3 py-2.5 sm:table-cell">{item.format}</td>
                        <td className="hidden px-3 py-2.5 md:table-cell">{item.platform}</td>
                        <td className="hidden px-3 py-2.5 lg:table-cell">{item.divisionLabel}</td>
                        <td className="hidden px-3 py-2.5 lg:table-cell">{item.owner}</td>
                        <td className="px-3 py-2.5">
                          <Pill variant={item.statusVariant}>{item.statusLabel}</Pill>
                        </td>
                        <td className={`px-3 py-2.5 font-bold ${item.isOverdue ? 'text-rose-600' : 'text-text-3'}`}>
                          {item.dueLabel}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditBrief(item)}
                              disabled={!item.id}
                              className="rounded-lg border border-border bg-surface px-2 py-1 text-[10.5px] font-semibold text-text hover:bg-surface-1 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePublishBrief(item)}
                              disabled={!item.id || publishingItemId === item.id || item.status.toLowerCase().includes('publish')}
                              className="rounded-lg bg-navy px-2 py-1 text-[10.5px] font-semibold text-white hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {publishingItemId === item.id ? 'Publishing...' : 'Publish'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showBriefModal} onClose={() => setShowBriefModal(false)} title={editingItem ? 'Edit Content Brief' : 'Create Content Brief'} size="lg">
        <div className="space-y-4">
          <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="e.g. Bethel City estate walkthrough" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField label="Format" value={form.format} onChange={(value) => setForm({ ...form, format: value })} options={optionTuples(calendar.metadata.formats, formatOptions)} />
            <SelectField label="Platform" value={form.platform} onChange={(value) => setForm({ ...form, platform: value })} options={optionTuples(calendar.metadata.platforms, platformOptions)} />
            <SelectField label="Division" value={form.division} onChange={(value) => setForm({ ...form, division: value })} options={optionTuples(calendar.metadata.divisions, divisionOptions)} />
            <Field label="Due date" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} />
            <SelectField label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={optionTuples(calendar.metadata.statuses, statusOptions)} />
            <SelectField label="Funnel stage" value={form.funnelStage} onChange={(value) => setForm({ ...form, funnelStage: value })} options={[['', 'Not set'], ...optionTuples(calendar.metadata.funnelStages, [])]} />
          </div>
          <TextAreaField label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          <div className="flex justify-end gap-2 border-t border-border pt-2">
            <button type="button" onClick={() => setShowBriefModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1">
              Cancel
            </button>
            <button type="button" onClick={editingItem ? handleUpdateBrief : handleCreateBrief} disabled={isSaving} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : editingItem ? 'Save Brief' : 'Create Brief'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function KpiCard({ label, value, tone = 'text-text' }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-xs">
      <div className="text-[11px] font-bold uppercase text-text-3">{label}</div>
      <div className={`mt-1 text-xl font-extrabold ${tone}`}>{value}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-text-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text outline-none focus:border-navy" />
    </div>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-text-2">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-border bg-surface p-2.5 text-xs text-text outline-none focus:border-navy" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-text-2">{label}</label>
      <Select
        options={options.map(([val, lbl]) => ({ value: val, label: lbl }))}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  )
}
