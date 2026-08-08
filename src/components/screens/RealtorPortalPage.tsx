import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppIcon } from '../../components/shared/AppIcon'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonKpiGrid, SkeletonList, SkeletonTable, Topbar, Select } from '../shared'
import { useToast } from '../../context/ToastContext'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import {
  transformPartnerCommissions,
  transformPartnerDashboard,
  transformPartnerRows,
  transformPartnerTasks,
  type OperationsMetric,
  type PartnerCommissionRow,
  type PartnerOperationsRow,
  type PartnerTaskRow,
} from '../../services/transformers/marketingTransformers'

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (key.includes('active') || key.includes('approved') || key.includes('paid') || key.includes('complete')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (key.includes('pending') || key.includes('assigned') || key.includes('progress')) return 'bg-blue-50 text-blue-900 border-blue-200'
  if (key.includes('rejected') || key.includes('expired')) return 'bg-rose-50 text-rose-800 border-rose-200'
  return 'bg-surface-1 text-text-3 border-border'
}

export function RealtorPortalPage() {
  const [period, setPeriod] = useState('week')
  const [partners, setPartners] = useState<PartnerOperationsRow[]>([])
  const [tasks, setTasks] = useState<PartnerTaskRow[]>([])
  const [commissions, setCommissions] = useState<PartnerCommissionRow[]>([])
  const [metrics, setMetrics] = useState<OperationsMetric[]>([])
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddRealtorModal, setShowAddRealtorModal] = useState(false)
  const { showToast } = useToast()

  const [realtorForm, setRealtorForm] = useState({ name: '', email: '', phone: '', rate: '3' })
  const [leadForm, setLeadForm] = useState({
    partnerId: '',
    fullName: '',
    phone: '',
    email: '',
    division: 'real_estate',
    estimatedValue: '0',
    notes: '',
  })

  async function loadRealtorOperations() {
    setIsLoading(true)
    setApiError('')
    try {
      const [dashboardRes, partnerRes, taskRes, commissionRes] = await Promise.all([
        marketingService.getPartnerOperationsDashboard(),
        marketingService.getPartnerDirectory({ category: 'real_estate', limit: 50 }),
        marketingService.getPartnerTasks({ partner_type: 'real_estate', limit: 50 }),
        marketingService.getPartnerCommissions({ limit: 50 }),
      ])

      if (dashboardRes.data) setMetrics(transformPartnerDashboard(dashboardRes.data).metrics)
      else if (dashboardRes.error) setApiError(parseApiError(dashboardRes.error))

      if (partnerRes.data) {
        const rows = transformPartnerRows(partnerRes.data)
        setPartners(rows)
        setLeadForm((current) => ({ ...current, partnerId: current.partnerId || String(rows[0]?.id || '') }))
      } else if (partnerRes.error) {
        setPartners([])
        setApiError((prev) => [prev, parseApiError(partnerRes.error)].filter(Boolean).join(' '))
      }

      if (taskRes.data) setTasks(transformPartnerTasks(taskRes.data))
      else if (taskRes.error) setTasks([])

      if (commissionRes.data) setCommissions(transformPartnerCommissions(commissionRes.data))
      else if (commissionRes.error) setCommissions([])
    } catch (err) {
      setPartners([])
      setTasks([])
      setCommissions([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRealtorOperations()
  }, [])

  const displayMetrics = useMemo(() => {
    if (metrics.length) return metrics.slice(0, 4)
    const active = partners.filter((partner) => /active|approved/i.test(partner.status)).length
    const due = commissions.reduce((sum, row) => sum + Number(row.commissionDueLabel.replace(/[^0-9.-]/g, '') || 0), 0)
    return [
      { key: 'active', label: 'Active realtors', value: active, foot: 'Verified external sales agents' },
      { key: 'partners', label: 'Realtor records', value: partners.length, foot: 'Backend partner directory' },
      { key: 'tasks', label: 'Assigned tasks', value: tasks.length, foot: 'Backend realtor task rows' },
      { key: 'due', label: 'Commission due', value: `NGN ${due.toLocaleString()}`, foot: 'Pending verification / payment' },
    ]
  }, [commissions, metrics, partners, tasks])

  async function handleAddRealtor() {
    if (!realtorForm.email.trim()) {
      showToast('Partner email is required', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.inviteMarketingPartner({
        name: realtorForm.name.trim() || null,
        email: realtorForm.email.trim(),
        phone: realtorForm.phone.trim() || null,
        category: 'real_estate',
        status: 'pending',
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not invite realtor'), 'error')
        return
      }

      showToast('Realtor invitation created.', 'success')
      setShowAddRealtorModal(false)
      setRealtorForm({ name: '', email: '', phone: '', rate: '3' })
      await loadRealtorOperations()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRegisterLead() {
    if (!leadForm.fullName.trim() || !leadForm.phone.trim()) {
      showToast('Please enter prospect name and phone number', 'error')
      return
    }
    const estimatedValue = Number(leadForm.estimatedValue || 0)
    if (!Number.isFinite(estimatedValue)) {
      showToast('Please enter a valid estimated value', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.createPartnerReferredLead({
        partner_id: leadForm.partnerId ? Number(leadForm.partnerId) : null,
        full_name: leadForm.fullName.trim(),
        phone: leadForm.phone.trim(),
        email: leadForm.email.trim() || null,
        division: leadForm.division,
        estimated_value: estimatedValue,
        notes: leadForm.notes.trim() || null,
        next_action: 'Verify partner-sourced lead',
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not register referred lead'), 'error')
        return
      }

      showToast('Referred lead registered.', 'success')
      setLeadForm({ ...leadForm, fullName: '', phone: '', email: '', estimatedValue: '0', notes: '' })
      await loadRealtorOperations()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCompleteTask(task: PartnerTaskRow) {
    if (!task.id) {
      showToast('This task has no backend ID.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.updatePartnerTask(task.id, { status: 'completed' })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not complete task'), 'error')
        return
      }
      showToast('Realtor task completed.', 'success')
      await loadRealtorOperations()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePayCommission(row: PartnerCommissionRow) {
    if (!row.id) {
      showToast('This commission has no backend ID.', 'error')
      return
    }

    setIsSaving(true)
    try {
      if (!/approved|paid/i.test(row.status)) {
        const approveRes = await marketingService.approvePartnerCommission(row.id, { note: 'Approved from realtor portal.' })
        if (!approveRes.data) {
          showToast(parseApiError(approveRes.error || 'Could not approve commission'), 'error')
          return
        }
      }

      const paidRes = await marketingService.markPartnerCommissionPaid(row.id, { payment_reference: 'Marked paid from realtor portal.' })
      if (!paidRes.data) {
        showToast(parseApiError(paidRes.error || 'Could not mark commission paid'), 'error')
        return
      }
      showToast('Commission marked paid.', 'success')
      await loadRealtorOperations()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="External realtor network" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="bg-navy rounded-2xl p-4 text-white shadow-md space-y-1">
          <h2 className="text-base font-bold">External Realtor Network</h2>
          <p className="text-xs text-white/80">
            Register agents, assign estates and tasks, track referred leads, verify sales, calculate commission and maintain partner performance history.
          </p>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadRealtorOperations} compact /> : null}

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
                <AppIcon name={['user-star', 'user-plus', 'check-check', 'currency-naira'][index] || 'users'} size={18} />
              </div>
            </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-2">
                <h3 className="text-sm font-bold text-text">Realtor directory</h3>
                <button
                  type="button"
                  onClick={() => setShowAddRealtorModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95"
                >
                  <AppIcon name="user-plus" size={14} /> Add realtor
                </button>
              </div>

              {isLoading ? (
                <SkeletonTable rows={5} columns={5} />
              ) : partners.length === 0 ? (
                <EmptyState title="No realtor partners" description="No realtor partners were returned." icon="ti-user-star" compact />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-text-3 font-bold">
                        <th className="py-2.5 px-3">Realtor</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3 text-right">Closed value</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-medium">
                      {partners.map((partner) => (
                        <tr key={String(partner.id || partner.name)} className="hover:bg-surface-1">
                          <td className="py-2.5 px-3 font-bold text-text">{partner.name}</td>
                          <td className="py-2.5 px-3 text-text-3">{partner.categoryLabel}</td>
                          <td className="py-2.5 px-3 text-text-3">{partner.email || partner.phone || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-text">{partner.valueLabel}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${statusClass(partner.status)}`}>{partner.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">Assigned realtor tasks</h3>
              {isLoading ? (
                <SkeletonList rows={4} />
              ) : tasks.length === 0 ? (
                <EmptyState title="No realtor tasks" description="No realtor tasks were returned." icon="ti-list-check" compact />
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={String(task.id || task.title)} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/80 bg-surface-1">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text truncate">{task.title}</div>
                        <div className="text-[10.5px] font-medium text-text-3 truncate mt-0.5">{task.partnerName} - Due {task.dueDate} - {task.feeLabel}</div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${statusClass(task.status)}`}>{task.status}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCompleteTask(task)}
                        disabled={isSaving || !task.id || /complete/i.test(task.status)}
                        className="px-2.5 py-1 text-[10.5px] font-semibold border border-border rounded-lg bg-surface text-text hover:bg-surface-2 transition-all shrink-0 disabled:opacity-50"
                      >
                        Mark complete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">Commission ledger</h3>
              {isLoading ? (
                <SkeletonList rows={4} />
              ) : commissions.length === 0 ? (
                <EmptyState title="No commissions" description="No commission rows were returned." icon="ti-currency-naira" compact />
              ) : (
                <div className="space-y-2">
                  {commissions.map((commission) => (
                    <div key={String(commission.id || commission.partnerName)} className="grid gap-3 rounded-xl border border-border/80 bg-surface-1 p-3 text-xs md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-text">{commission.partnerName}</div>
                        <div className="mt-0.5 text-[10.5px] font-medium text-text-3">{commission.amountBasisLabel} at {commission.commissionRate}</div>
                      </div>
                      <div className="font-bold text-text">{commission.commissionDueLabel}</div>
                      <span className={`w-fit rounded border px-2 py-0.5 text-[10.5px] font-bold ${statusClass(commission.status)}`}>{commission.status}</span>
                      <button
                        type="button"
                        onClick={() => handlePayCommission(commission)}
                        disabled={isSaving || !commission.id || /paid/i.test(commission.status)}
                        className="px-2.5 py-1 text-[10.5px] font-semibold border border-border rounded-lg bg-surface text-text hover:bg-surface-2 transition-all disabled:opacity-50"
                      >
                        Pay due
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">Realtor lead registration</h3>

              <div className="space-y-2.5">
                <SelectField label="Realtor" value={leadForm.partnerId} onChange={(value) => setLeadForm({ ...leadForm, partnerId: value })} options={partners.map((partner) => [String(partner.id || ''), partner.name])} emptyLabel="Unassigned partner" />
                <Field label="Prospect name" value={leadForm.fullName} onChange={(value) => setLeadForm({ ...leadForm, fullName: value })} />
                <Field label="Phone / WhatsApp" value={leadForm.phone} onChange={(value) => setLeadForm({ ...leadForm, phone: value })} />
                <Field label="Email" value={leadForm.email} onChange={(value) => setLeadForm({ ...leadForm, email: value })} />
                <SelectField label="Division" value={leadForm.division} onChange={(value) => setLeadForm({ ...leadForm, division: value })} options={[['real_estate', 'Real Estate'], ['benji', 'Benji'], ['engineering', 'Engineering']]} />
                <Field label="Estimated value" type="number" value={leadForm.estimatedValue} onChange={(value) => setLeadForm({ ...leadForm, estimatedValue: value })} />
                <Field label="Notes" value={leadForm.notes} onChange={(value) => setLeadForm({ ...leadForm, notes: value })} />

                <button
                  type="button"
                  onClick={handleRegisterLead}
                  disabled={isSaving}
                  className="w-full py-2 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <BusyLabel>Submitting...</BusyLabel> : 'Submit referred lead'}
                </button>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">Partner rules</h3>
              {[
                'Every referred lead must be registered before physical site inspection call.',
                'Commission is calculated only on verified cleared customer payment.',
                'Realtors must use approved price lists, marketing materials and claim links.',
                'Duplicate lead ownership is decided by first registered timestamp in OS.',
                'Commission approval follows documentation check and CEO approval.',
              ].map((rule, index) => (
                <div key={rule} className="flex items-start gap-2 text-xs font-medium text-text-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-900 text-white text-[10px] font-bold">{index + 1}</span>
                  <span className="leading-snug pt-0.5">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showAddRealtorModal} onClose={() => setShowAddRealtorModal(false)} title="Register External Realtor / Agency">
        <div className="space-y-4">
          <Field label="Agency / Realtor Name" value={realtorForm.name} onChange={(value) => setRealtorForm({ ...realtorForm, name: value })} />
          <Field label="Email" value={realtorForm.email} onChange={(value) => setRealtorForm({ ...realtorForm, email: value })} />
          <Field label="Phone Number" value={realtorForm.phone} onChange={(value) => setRealtorForm({ ...realtorForm, phone: value })} />
          <SelectField label="Commission Rate" value={realtorForm.rate} onChange={(value) => setRealtorForm({ ...realtorForm, rate: value })} options={[['3', '3% Standard'], ['2.5', '2.5%'], ['2', '2%'], ['5', '5% VIP Partner']]} />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={() => setShowAddRealtorModal(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-text hover:bg-surface-1">
              Cancel
            </button>
            <button type="button" onClick={handleAddRealtor} disabled={isSaving} className="px-4 py-2 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : 'Invite Realtor'}
            </button>
          </div>
        </div>
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
