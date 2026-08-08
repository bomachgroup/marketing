import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppIcon } from '../../components/shared/AppIcon'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonKpiGrid, SkeletonList, Topbar, Select } from '../shared'
import { useToast } from '../../context/ToastContext'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import {
  transformPartnerReports,
  transformPartnerRows,
  transformPartnerTasks,
  type OperationsMetric,
  type PartnerOperationsRow,
  type PartnerReportRow,
  type PartnerTaskRow,
} from '../../services/transformers/marketingTransformers'

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (key.includes('approved') || key.includes('complete')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (key.includes('submitted') || key.includes('review')) return 'bg-purple-50 text-purple-900 border-purple-200'
  if (key.includes('assigned') || key.includes('progress') || key.includes('production')) return 'bg-blue-50 text-blue-900 border-blue-200'
  if (key.includes('reject') || key.includes('blocked')) return 'bg-rose-50 text-rose-800 border-rose-200'
  return 'bg-surface-1 text-text-3 border-border'
}

export function PartnerPortalPage() {
  const [period, setPeriod] = useState('week')
  const [partners, setPartners] = useState<PartnerOperationsRow[]>([])
  const [tasks, setTasks] = useState<PartnerTaskRow[]>([])
  const [reports, setReports] = useState<PartnerReportRow[]>([])
  const [metrics] = useState<OperationsMetric[]>([])
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [activeBrief, setActiveBrief] = useState<PartnerTaskRow | null>(null)
  const { showToast } = useToast()

  const [assignForm, setAssignForm] = useState({
    partnerId: '',
    title: '',
    fee: '150000',
    dueDate: '',
    objective: 'Brand Awareness & Lead Generation',
    proofRequirement: 'Performance proof link and lead count',
  })

  const [reportForm, setReportForm] = useState({
    taskId: '',
    reach: '',
    leads: '',
    proof: '',
    comment: '',
  })

  async function loadPartnerPortal() {
    setIsLoading(true)
    setApiError('')
    try {
      const [partnerRes, taskRes, reportRes] = await Promise.all([
        marketingService.getPartnerDirectory({ limit: 50 }),
        marketingService.getPartnerTasks({ limit: 50 }),
        marketingService.getPartnerReports({ limit: 50 }),
      ])

      if (partnerRes.data) {
        const rows = transformPartnerRows(partnerRes.data)
        setPartners(rows)
        setAssignForm((current) => ({ ...current, partnerId: current.partnerId || String(rows[0]?.id || '') }))
      } else if (partnerRes.error) {
        setPartners([])
      }

      if (taskRes.data) {
        const rows = transformPartnerTasks(taskRes.data)
        setTasks(rows)
        setReportForm((current) => ({ ...current, taskId: current.taskId || String(rows.find((row) => row.id)?.id || '') }))
      } else if (taskRes.error) {
        setTasks([])
      }

      if (reportRes.data) setReports(transformPartnerReports(reportRes.data))
      else if (reportRes.error) setReports([])
    } catch (err) {
      setTasks([])
      setReports([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPartnerPortal()
  }, [])

  const displayMetrics = useMemo(() => {
    if (metrics.length) return metrics.slice(0, 4)
    const fees = tasks.reduce((sum, task) => sum + Number(task.feeLabel.replace(/[^0-9.-]/g, '') || 0), 0)
    const reach = reports.reduce((sum, report) => sum + report.reach, 0)
    const leads = reports.reduce((sum, report) => sum + report.leadCount, 0)
    return [
      { key: 'tasks', label: 'Active briefs', value: tasks.length, foot: 'Clear owner, due date and output' },
      { key: 'fees', label: 'Partner fees', value: `NGN ${fees.toLocaleString()}`, foot: 'Subject to proof and approval' },
      { key: 'reach', label: 'Verified reach', value: reach.toLocaleString(), foot: 'Submitted performance evidence' },
      { key: 'leads', label: 'Partner leads', value: leads.toLocaleString(), foot: 'Tracked links and referral codes' },
    ]
  }, [metrics, reports, tasks])

  async function handleAssignTask() {
    if (!assignForm.partnerId || !assignForm.title.trim()) {
      showToast('Please choose a backend partner and enter task title', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.createPartnerTask({
        partner_id: Number(assignForm.partnerId),
        partner_type: 'external_partner',
        title: assignForm.title.trim(),
        objective: assignForm.objective.trim() || null,
        due_date: assignForm.dueDate || null,
        fee: assignForm.fee || '0',
        proof_requirement: assignForm.proofRequirement.trim() || null,
        status: 'assigned',
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not assign partner task'), 'error')
        return
      }

      showToast('Partner task assigned.', 'success')
      setShowAssignModal(false)
      setAssignForm({ partnerId: assignForm.partnerId, title: '', fee: '150000', dueDate: '', objective: 'Brand Awareness & Lead Generation', proofRequirement: 'Performance proof link and lead count' })
      await loadPartnerPortal()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmitReport() {
    if (!reportForm.taskId) {
      showToast('Please choose a backend task', 'error')
      return
    }
    if (!reportForm.proof.trim()) {
      showToast('Please provide a proof or report link', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.submitPartnerPortalReport({
        task_id: Number(reportForm.taskId),
        reach: Number(reportForm.reach || 0),
        lead_count: Number(reportForm.leads || 0),
        proof_url: reportForm.proof.trim(),
        note: reportForm.comment.trim() || null,
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not submit partner report'), 'error')
        return
      }

      showToast('Partner report submitted for review.', 'success')
      setReportForm({ ...reportForm, reach: '', leads: '', proof: '', comment: '' })
      await loadPartnerPortal()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleApproveReport(report: PartnerReportRow) {
    if (!report.id) {
      showToast('This report has no backend ID.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.reviewPartnerReport(report.id, { status: 'approved', review_note: 'Approved from partner portal.' })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not approve partner report'), 'error')
        return
      }
      showToast('Partner report approved.', 'success')
      await loadPartnerPortal()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Partner work portal" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="bg-navy rounded-2xl p-4 text-white shadow-md space-y-1">
          <h2 className="text-base font-bold">Influencer & External Partner Work Portal</h2>
          <p className="text-xs text-white/80">
            Issue briefs, deadlines, deliverables, tracking links and proof requirements. Partners submit reports; Bomach reviews performance before payment.
          </p>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadPartnerPortal} compact /> : null}

        {isLoading ? (
          <SkeletonKpiGrid />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {displayMetrics.map((metric, index) => (
            <div key={metric.key} className="bg-surface border border-border rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <div className="text-[11px] text-text-3 font-medium">{metric.label}</div>
                <div className="text-xl font-extrabold text-text tracking-tight">{metric.value}</div>
                <div className="text-[10px] text-text-3 font-medium">{metric.foot}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
                <AppIcon name={['file-text', 'currency-naira', 'eye', 'user-check'][index] || 'brand-instagram'} size={18} />
              </div>
            </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-2">
                <h3 className="text-sm font-bold text-text">Assigned campaigns & deliverables</h3>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95"
                >
                  <AppIcon name="plus" size={14} /> Assign task
                </button>
              </div>

              {isLoading ? (
                <SkeletonList rows={4} />
              ) : tasks.length === 0 ? (
                <EmptyState title="No partner tasks" description="No partner tasks were returned." icon="ti-briefcase" compact />
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={String(task.id || task.title)} className="bg-surface-1/50 border border-border rounded-xl p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-text truncate">{task.title}</h4>
                          <div className="text-[10.5px] font-medium text-text-3 mt-0.5">{task.partnerName} - Due {task.dueDate}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${statusClass(task.status)}`}>{task.status}</span>
                      </div>

                      <div className="text-[10.5px] font-medium text-text-2">
                        Objective: {task.objective || '-'} - Fee: {task.feeLabel} - Reach: {task.reach.toLocaleString()} - Leads: {task.leadCount.toLocaleString()}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const report = reports.find((row) => row.taskId && String(row.taskId) === String(task.id))
                            if (report) void handleApproveReport(report)
                            else showToast('No submitted backend report is available for this task.', 'error')
                          }}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-3 py-1 text-[10.5px] font-bold border border-border rounded-lg bg-surface text-text hover:bg-surface-2 transition-all disabled:opacity-50"
                        >
                          <AppIcon name="check" size={14} /> Approve report
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBrief(task)
                            setShowBriefModal(true)
                          }}
                          className="px-3 py-1 text-[10.5px] font-semibold border border-border rounded-lg bg-surface text-text hover:bg-surface-2 transition-all"
                        >
                          View brief
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">Submitted reports</h3>
              {isLoading ? (
                <SkeletonList rows={4} />
              ) : reports.length === 0 ? (
                <EmptyState title="No partner reports" description="No partner reports were returned." icon="ti-file-text" compact />
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div key={String(report.id || report.taskTitle)} className="grid gap-3 rounded-xl border border-border/80 bg-surface-1 p-3 text-xs md:grid-cols-[1.2fr_1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-text">{report.taskTitle}</div>
                        <div className="text-[10.5px] text-text-3">{report.partnerName} - Reach {report.reach.toLocaleString()} - Leads {report.leadCount.toLocaleString()}</div>
                      </div>
                      <span className={`w-fit rounded border px-2 py-0.5 text-[10.5px] font-bold ${statusClass(report.status)}`}>{report.status}</span>
                      <button
                        type="button"
                        onClick={() => handleApproveReport(report)}
                        disabled={isSaving || !report.id || /approved/i.test(report.status)}
                        className="px-2.5 py-1 text-[10.5px] font-semibold border border-border rounded-lg bg-surface text-text hover:bg-surface-2 transition-all disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">Submit partner report</h3>

            <div className="space-y-2.5">
              <SelectField label="Task" value={reportForm.taskId} onChange={(value) => setReportForm({ ...reportForm, taskId: value })} options={tasks.filter((task) => task.id).map((task) => [String(task.id), `${task.partnerName} - ${task.title}`])} emptyLabel="No backend task selected" />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Reach / views" type="number" value={reportForm.reach} onChange={(value) => setReportForm({ ...reportForm, reach: value })} />
                <Field label="Leads generated" type="number" value={reportForm.leads} onChange={(value) => setReportForm({ ...reportForm, leads: value })} />
              </div>
              <Field label="Report / proof link" value={reportForm.proof} onChange={(value) => setReportForm({ ...reportForm, proof: value })} />
              <TextAreaField label="Comment" value={reportForm.comment} onChange={(value) => setReportForm({ ...reportForm, comment: value })} />

              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSaving}
                className="w-full py-2 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <BusyLabel>Submitting...</BusyLabel> : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Partner Task & Brief">
        <div className="space-y-4">
          <SelectField label="Partner / Influencer" value={assignForm.partnerId} onChange={(value) => setAssignForm({ ...assignForm, partnerId: value })} options={partners.filter((partner) => partner.id).map((partner) => [String(partner.id), partner.name])} emptyLabel="Choose backend partner" />
          <Field label="Deliverable Title" value={assignForm.title} onChange={(value) => setAssignForm({ ...assignForm, title: value })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Agreed Fee (NGN)" type="number" value={assignForm.fee} onChange={(value) => setAssignForm({ ...assignForm, fee: value })} />
            <Field label="Due Date" type="date" value={assignForm.dueDate} onChange={(value) => setAssignForm({ ...assignForm, dueDate: value })} />
          </div>
          <TextAreaField label="Objective" value={assignForm.objective} onChange={(value) => setAssignForm({ ...assignForm, objective: value })} />
          <TextAreaField label="Proof Requirement" value={assignForm.proofRequirement} onChange={(value) => setAssignForm({ ...assignForm, proofRequirement: value })} />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-text hover:bg-surface-1">
              Cancel
            </button>
            <button type="button" onClick={handleAssignTask} disabled={isSaving} className="px-4 py-2 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : 'Assign Task'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showBriefModal} onClose={() => setShowBriefModal(false)} title="Partner Task Brief">
        {activeBrief && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface-1 rounded-xl border border-border/80">
              <h4 className="font-bold text-text text-sm">{activeBrief.title}</h4>
              <div className="text-text-3 mt-1 font-medium">{activeBrief.partnerName} - Due {activeBrief.dueDate}</div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium">
              Objective: {activeBrief.objective || '-'}<br />
              Proof: {activeBrief.proofRequirement || '-'}<br />
              Tracking: {activeBrief.trackingUrl || '-'}
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setShowBriefModal(false)} className="px-4 py-2 rounded-xl bg-navy text-xs font-bold text-white">
                Close Brief
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-text-2 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-3 outline-none focus:border-navy"
      />
    </div>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-text-2 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-3 outline-none focus:border-navy resize-none"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
  emptyLabel?: string
}) {
  const selectOptions = [
    ...(emptyLabel ? [{ value: '', label: emptyLabel }] : []),
    ...options.map(([val, lbl]) => ({ value: val, label: lbl })),
  ]

  return (
    <div>
      <label className="block text-[11px] font-bold text-text-2 mb-1">{label}</label>
      <Select
        options={selectOptions}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  )
}
