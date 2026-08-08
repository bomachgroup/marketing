import { useEffect, useState, type ReactNode } from 'react'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonCardGrid, SkeletonKpiGrid, Topbar, Select } from '../shared'
import { useToast } from '../../context/ToastContext'
import { parseApiError } from '../../services/api/apiClient'
import { marketingService } from '../../services/api/marketingService'
import { teamService } from '../../services/api/teamService'
import { transformContentStudio, type ContentStudioColumn, type ContentStudioMetric } from '../../services/transformers/marketingTransformers'
import { transformEmployeeOptions, type EmployeeOption } from '../../services/transformers/teamTransformers'
import { AppIcon } from '../../components/shared/AppIcon'
import { pluralize } from '../../utils/formatters'

const formatOptions = ['Video', 'Carousel', 'Graphic', 'Text+Image', 'Blog post']
const platformOptions = ['Instagram', 'TikTok', 'Facebook', 'WhatsApp', 'LinkedIn', 'Website']
const funnelOptions = ['Awareness', 'Discovery', 'Evaluation', 'Intent']

export function ContentStudioPage() {
  const [period, setPeriod] = useState('week')
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [studio, setStudio] = useState(() => transformContentStudio({}))
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const { showToast } = useToast()

  const [briefForm, setBriefForm] = useState({
    title: '',
    format: 'Video',
    platform: 'Instagram',
    funnel: 'Awareness',
    cta: 'Book site inspection',
    ownerId: '',
    insight: '',
  })

  async function loadStudio() {
    setIsLoading(true)
    setApiError('')
    try {
      const [contentRes, employeeRes] = await Promise.all([
        marketingService.getContentItems({ limit: 100 }),
        teamService.listEmployees({ is_active: true, limit: 100 }),
      ])

      if (contentRes.data) setStudio(transformContentStudio(contentRes.data))
      else {
        setStudio(transformContentStudio({}))
        setApiError(parseApiError(contentRes.error || 'No backend content rows returned.'))
      }

      if (employeeRes.data) setEmployees(transformEmployeeOptions(employeeRes.data))
      else if (employeeRes.error) setApiError((prev) => [prev, parseApiError(employeeRes.error)].filter(Boolean).join(' '))
    } catch (err) {
      setStudio(transformContentStudio({}))
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadStudio())
  }, [])

  async function handleCreateBrief() {
    if (!briefForm.title.trim()) {
      showToast('Please enter a content title', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.createContentItem({
        title: briefForm.title.trim(),
        platform: briefForm.platform,
        content_type: briefForm.format.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        status: 'draft',
        body: briefForm.insight.trim(),
        excerpt: briefForm.cta.trim(),
        category: briefForm.funnel,
        author_id: briefForm.ownerId ? Number(briefForm.ownerId) : null,
        allow_comments: true,
      })

      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not create content brief'), 'error')
        return
      }

      showToast(`Content brief "${briefForm.title}" created.`, 'success')
      setShowBriefModal(false)
      setBriefForm({
        title: '',
        format: 'Video',
        platform: 'Instagram',
        funnel: 'Awareness',
        cta: 'Book site inspection',
        ownerId: '',
        insight: '',
      })
      await loadStudio()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Content revenue studio" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text">Content Revenue Studio</h2>
            <p className="mt-0.5 text-xs text-text-3">
              Every content item must have a funnel objective, target audience, CTA, owner and revenue signal
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBriefModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95"
          >
            <AppIcon name="plus" size={14} /> Create brief
          </button>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadStudio} compact /> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {studio.metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        {isLoading ? (
          <>
            <SkeletonKpiGrid />
            <SkeletonCardGrid cards={6} className="grid grid-cols-1 gap-3 lg:grid-cols-3" />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              {studio.columns.map((col) => (
                <ContentColumn key={col.stage} column={col} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2">
                  <h3 className="text-sm font-bold text-text">Content intelligence</h3>
                  <span className="text-[11px] font-medium text-text-3">Rows come from backend content data.</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border font-bold text-text-3">
                        <th className="px-3 py-2.5">Content</th>
                        <th className="px-3 py-2.5">Funnel</th>
                        <th className="px-3 py-2.5">CTA</th>
                        <th className="px-3 py-2.5 text-right">Leads</th>
                        <th className="px-3 py-2.5 text-right">Revenue influenced</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-medium">
                      {studio.intelRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-3"><EmptyState title="No content rows" description="No backend content rows were returned." icon="ti-photo" compact /></td>
                        </tr>
                      ) : (
                        studio.intelRows.map((row) => (
                          <tr key={row.id} className="hover:bg-surface-1">
                            <td className="px-3 py-2.5 font-bold text-text">{row.content}</td>
                            <td className="px-3 py-2.5 text-text-3">{row.funnel}</td>
                            <td className="px-3 py-2.5 text-text-3">{row.cta}</td>
                            <td className="px-3 py-2.5 text-right text-text">{row.leads}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-text">{row.revenue}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <BriefPanel
                form={briefForm}
                setForm={setBriefForm}
                employees={employees}
                isSaving={isSaving}
                onSave={handleCreateBrief}
              />
            </div>
          </>
        )}
      </div>

      <Modal open={showBriefModal} onClose={() => setShowBriefModal(false)} title="Create Content Brief">
        <BriefForm form={briefForm} setForm={setBriefForm} employees={employees} />
        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
          <button type="button" onClick={() => setShowBriefModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1">
            Cancel
          </button>
          <button type="button" onClick={handleCreateBrief} disabled={isSaving} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
            {isSaving ? <BusyLabel>Creating...</BusyLabel> : 'Create Brief'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function MetricCard({ metric }: { metric: ContentStudioMetric }) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 shadow-xs">
      <div className="min-w-0 space-y-1">
        <div className="truncate text-[11px] font-medium text-text-3">{metric.label}</div>
        <div className="truncate text-xl font-extrabold tracking-tight text-text">{metric.value}</div>
        <div className="truncate text-[10px] font-medium text-text-3">{metric.sub}</div>
      </div>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${tones[metric.tone] || tones.blue}`}>
        <AppIcon name={metric.icon.replace(/^ti-/, '')} size={14} />
      </div>
    </div>
  )
}

function ContentColumn({ column }: { column: ContentStudioColumn }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-blue-900">{column.stage}</span>
        <span className="text-[10.5px] font-bold text-text-3">{column.cards.length}</span>
      </div>
      <div className="min-h-[160px] space-y-2 rounded-2xl border border-border/40 bg-surface-1/40 p-1.5">
        {column.cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-3 text-center text-[10.5px] font-medium text-text-3">
            No items
          </div>
        ) : (
          column.cards.map((card) => (
            <div key={card.id} className="space-y-1.5 rounded-xl border border-border bg-surface p-3 shadow-xs">
              <h4 className="text-xs font-bold leading-snug text-text">{card.title}</h4>
              <div className="text-[10.5px] font-medium text-text-3">{card.meta}</div>
              <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-1">
                <span className="truncate rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                  {card.action}
                </span>
                <span className="shrink-0 text-[10px] font-medium text-text-3">{pluralize(card.leads, 'lead')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function BriefPanel({ form, setForm, employees, isSaving, onSave }: {
  form: BriefFormState
  setForm: (form: BriefFormState) => void
  employees: EmployeeOption[]
  isSaving: boolean
  onSave: () => void
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <h3 className="border-b border-border/80 pb-2 text-sm font-bold text-text">Create a revenue-focused brief</h3>
      <BriefForm form={form} setForm={setForm} employees={employees} compact />
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-1 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95 disabled:opacity-50"
      >
        {isSaving ? <BusyLabel>Adding...</BusyLabel> : <><AppIcon name="check" size={14} /> Add to ideas</>}
      </button>
    </div>
  )
}

type BriefFormState = {
  title: string
  format: string
  platform: string
  funnel: string
  cta: string
  ownerId: string
  insight: string
}

function BriefForm({ form, setForm, employees, compact = false }: { form: BriefFormState; setForm: (form: BriefFormState) => void; employees: EmployeeOption[]; compact?: boolean }) {
  return (
    <div className="space-y-2.5">
      <Field label="Topic">
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Why inspect land before payment" className={fieldClass} />
      </Field>
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <Field label="Format">
          <Select
            options={formatOptions}
            value={form.format}
            onChange={(val) => setForm({ ...form, format: val })}
            className="w-full"
          />
        </Field>
        <Field label="Platform">
          <Select
            options={platformOptions}
            value={form.platform}
            onChange={(val) => setForm({ ...form, platform: val })}
            className="w-full"
          />
        </Field>
      </div>
      <Field label="Funnel stage">
        <Select
          options={funnelOptions}
          value={form.funnel}
          onChange={(val) => setForm({ ...form, funnel: val })}
          className="w-full"
        />
      </Field>
      <Field label="Primary CTA">
        <input type="text" value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Book an inspection" className={fieldClass} />
      </Field>
      <Field label="Owner">
        <Select
          options={[
            { value: '', label: 'Unassigned' },
            ...employees.map((emp) => ({ value: String(emp.id), label: emp.label })),
          ]}
          value={form.ownerId}
          onChange={(val) => setForm({ ...form, ownerId: val })}
          className="w-full"
        />
      </Field>
      <Field label="Customer problem / insight">
        <textarea value={form.insight} onChange={(e) => setForm({ ...form, insight: e.target.value })} placeholder="What customer anxiety or decision barrier will this content address?" rows={3} className={`${fieldClass} resize-none`} />
      </Field>
    </div>
  )
}

const fieldClass = 'w-full rounded-xl border border-border bg-surface p-2 text-xs text-text placeholder:text-text-3 outline-none focus:border-navy'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-bold text-text-2">{label}</span>
      {children}
    </label>
  )
}
