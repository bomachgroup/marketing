import { useState, useEffect } from 'react'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonCardGrid, Topbar, Select } from '../shared'
import { parseApiError } from '../../services/api/apiClient'
import { marketingService } from '../../services/api/marketingService'
import { transformSalesPlaybook, type SalesPlaybookGuide } from '../../services/transformers/marketingTransformers'
import { useToast } from '../../context/ToastContext'
import { AppIcon } from '../../components/shared/AppIcon'

const divisions = [
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'benji', label: 'Benji' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'surveying', label: 'Surveying' },
  { value: 'ict', label: 'ICT' },
  { value: 'agriculture', label: 'Agriculture' },
]

const stages = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'closing', label: 'Closing' },
]

const personas = [
  { value: 'individual', label: 'Individual buyer' },
  { value: 'corporate', label: 'Corporate buyer' },
  { value: 'diaspora', label: 'Diaspora buyer' },
]

function responseHasRows(data: unknown) {
  if (!data || typeof data !== 'object') return false
  const record = data as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items.length > 0
  if (Array.isArray(record.results)) return record.results.length > 0
  if (Array.isArray(record.rows)) return record.rows.length > 0
  if (Array.isArray(record.data)) return record.data.length > 0
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) return Boolean((record.data as Record<string, unknown>).id || (record.data as Record<string, unknown>).playbook_id)
  return Boolean(record.id || record.playbook_id)
}

export function PlaybooksPage() {
  const [period, setPeriod] = useState('week')
  const [division, setDivision] = useState('real_estate')
  const [stage, setStage] = useState('discovery')
  const [customerType, setCustomerType] = useState('individual')
  const [guide, setGuide] = useState<SalesPlaybookGuide>(() => transformSalesPlaybook({}, { division, stage, persona: customerType }))
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    division: 'real_estate',
    stage: 'discovery',
    persona: 'individual',
    objective: '',
  })
  const { showToast } = useToast()

  async function handleCreatePlaybook() {
    if (!createForm.title.trim()) {
      showToast('Please enter playbook title', 'error')
      return
    }
    setIsCreating(true)
    try {
      const res = await marketingService.createSalesPlaybook({
        title: createForm.title.trim(),
        division: createForm.division,
        stage: createForm.stage,
        persona: createForm.persona,
        objective: createForm.objective.trim() || undefined,
        status: 'active',
      })
      if (res.error) {
        showToast(parseApiError(res.error), 'error')
        return
      }
      showToast('Sales playbook created successfully.', 'success')
      setShowCreateModal(false)
      setCreateForm({ title: '', division: 'real_estate', stage: 'discovery', persona: 'individual', objective: '' })
      await loadPlaybook()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsCreating(false)
    }
  }

  async function loadPlaybook() {
    setIsLoading(true)
    setApiError('')
    try {
      const filters = { division, stage, persona: customerType }
      const listRes = await marketingService.getSalesPlaybooks({ ...filters, limit: 1 })
      if (listRes.data && responseHasRows(listRes.data)) {
        setGuide(transformSalesPlaybook(listRes.data, filters))
      } else if (listRes.error) {
        setGuide(transformSalesPlaybook({}, filters))
        setApiError(parseApiError(listRes.error || 'Could not load sales playbooks.'))
      } else {
        setGuide(transformSalesPlaybook({}, filters))
      }
    } catch (err) {
      setGuide(transformSalesPlaybook({}, { division, stage, persona: customerType }))
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadPlaybook())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [division, stage, customerType])

  async function handleCopyGuide() {
    const text = [
      guide.title,
      guide.objective,
      guide.openingScript,
      guide.questions.join('\n'),
      guide.proofToUse,
      guide.primaryCta,
      guide.exitCriteria,
    ].filter(Boolean).join('\n\n')

    try {
      await navigator.clipboard.writeText(text)
      showToast('Current guide copied.', 'success')
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Sales playbooks" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text">Sales Playbook & Conversation Guide</h2>
            <p className="mt-0.5 text-xs text-text-3">
              Standard questions, proof, scripts, exit criteria and objections for every service line
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 rounded-xl bg-navy px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95"
            >
              <AppIcon name="plus" size={14} /> New playbook
            </button>
            <button
              type="button"
              onClick={handleCopyGuide}
              disabled={!guide.id}
              className="flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text shadow-xs transition-all hover:bg-surface-1 active:scale-95 disabled:opacity-50"
            >
              <AppIcon name="copy" size={14} /> Copy current guide
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xs sm:grid-cols-3">
          <Filter label="Division" value={division} onChange={setDivision} options={divisions} />
          <Filter label="Conversation stage" value={stage} onChange={setStage} options={stages} />
          <Filter label="Customer type" value={customerType} onChange={setCustomerType} options={personas} />
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadPlaybook} compact /> : null}

        {isLoading ? (
          <SkeletonCardGrid cards={3} className="grid grid-cols-1 gap-4 lg:grid-cols-3" />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-xs lg:col-span-2">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-bold text-blue-900">
                  {guide.badge}
                </span>
                <h3 className="mt-2 text-base font-bold text-text">{guide.title}</h3>
                <p className="mt-1 text-xs text-text-3">{guide.objective}</p>
              </div>

              <GuideBlock label="Opening Script">{guide.openingScript}</GuideBlock>

              <div className="space-y-1.5 border-t border-border/80 pt-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-3">Discovery / Qualification Questions</div>
                {guide.questions.length > 0 ? (
                  <ol className="list-inside list-decimal space-y-1 text-xs font-medium leading-relaxed text-text">
                    {guide.questions.map((question, index) => (
                      <li key={`${question}-${index}`}>{question}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs font-medium text-text-3">No questions recorded.</p>
                )}
              </div>

              <GuideBlock label="Proof to Use">{guide.proofToUse}</GuideBlock>
              <GuideBlock label="Primary Call to Action" strong>{guide.primaryCta}</GuideBlock>
              <GuideBlock label="Exit Criteria">{guide.exitCriteria}</GuideBlock>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
              <h3 className="border-b border-border/80 pb-2.5 text-sm font-bold text-text">
                Objection handling library
              </h3>

              <div className="space-y-2.5">
                {guide.objections.length === 0 ? (
                  <EmptyState title="No objections" description="No backend objections were returned for this playbook." icon="ti-message-question" compact />
                ) : (
                  guide.objections.map((obj) => (
                    <div key={obj.id} className="space-y-1 rounded-xl border border-border/80 bg-surface-1 p-3">
                      <h4 className="text-xs font-bold text-text">{obj.title}</h4>
                      <p className="text-[11px] font-medium leading-relaxed text-text-3">{obj.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New sales playbook">
          <form onSubmit={(e) => { e.preventDefault(); void handleCreatePlaybook() }} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Playbook title *</label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g. Discovery & Qualification Script"
                className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text placeholder:text-text-3 focus:outline-none focus:border-navy"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Division</label>
                <Select
                  options={divisions}
                  value={createForm.division}
                  onChange={(val) => setCreateForm({ ...createForm, division: val })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Stage</label>
                <Select
                  options={stages}
                  value={createForm.stage}
                  onChange={(val) => setCreateForm({ ...createForm, stage: val })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Persona</label>
                <Select
                  options={personas}
                  value={createForm.persona}
                  onChange={(val) => setCreateForm({ ...createForm, persona: val })}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Playbook objective</label>
              <textarea
                value={createForm.objective}
                onChange={(e) => setCreateForm({ ...createForm, objective: e.target.value })}
                rows={2}
                placeholder="What is the goal of this playbook?"
                className="w-full p-2.5 text-xs rounded-xl border border-border bg-surface text-text placeholder:text-text-3 focus:outline-none focus:border-navy"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-text-3 hover:text-text transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-navy rounded-xl shadow-xs hover:bg-navy-dark disabled:opacity-60 transition-all"
              >
                {isCreating ? <BusyLabel>Creating...</BusyLabel> : 'Create playbook'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  )
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div className="block min-w-0">
      <span className="mb-1 block text-[11px] font-medium text-text-3">{label}</span>
      <Select
        options={options}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  )
}

function GuideBlock({ label, children, strong = false }: { label: string; children: string; strong?: boolean }) {
  return (
    <div className="space-y-1 border-t border-border/80 pt-3.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-3">{label}</div>
      <p className={`text-xs leading-relaxed ${strong ? 'font-bold text-text' : 'font-medium text-text'}`}>{children}</p>
    </div>
  )
}
