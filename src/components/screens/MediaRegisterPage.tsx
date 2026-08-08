import {
  useEffect,
  useState,
} from 'react'
import { AppIcon } from '../../components/shared/AppIcon'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonKpiGrid, SkeletonTable, Topbar, Select } from '../shared'
import { useToast } from '../../context/ToastContext'
import { marketingService, type BackendTraditionalMediaPlacementCreate } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import {
  transformTraditionalMediaDashboard,
  transformTraditionalMediaRows,
  type OperationsMetric,
  type TraditionalMediaRow,
} from '../../services/transformers/marketingTransformers'

const emptyForm: BackendTraditionalMediaPlacementCreate = {
  placement_type: 'billboard',
  name: '',
  vendor: '',
  location: '',
  ownership: 'rented',
  amount_paid: '0',
  start_date: '',
  end_date: '',
  status: 'active',
  proof_url: '',
  division: '',
  notes: '',
}

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (key.includes('active')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (key.includes('expired') || key.includes('archived')) return 'bg-rose-50 text-rose-800 border-rose-200'
  if (key.includes('pending') || key.includes('draft')) return 'bg-blue-50 text-blue-900 border-blue-200'
  return 'bg-surface-1 text-text-3 border-border'
}

export function MediaRegisterPage() {
  const [period, setPeriod] = useState('week')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [metrics, setMetrics] = useState<OperationsMetric[]>([])
  const [placements, setPlacements] = useState<TraditionalMediaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [form, setForm] = useState<BackendTraditionalMediaPlacementCreate>(emptyForm)
  const { showToast } = useToast()

  async function loadMediaRegister() {
    setIsLoading(true)
    setApiError('')
    try {
      const [dashboardRes, placementRes] = await Promise.all([
        marketingService.getTraditionalMediaDashboard({ limit: 50 }),
        marketingService.getTraditionalMediaPlacements({ limit: 50 }),
      ])

      if (dashboardRes.data) setMetrics(transformTraditionalMediaDashboard(dashboardRes.data))
      else if (dashboardRes.error) setApiError(parseApiError(dashboardRes.error))

      if (placementRes.data) setPlacements(transformTraditionalMediaRows(placementRes.data))
      else if (placementRes.error) {
        setPlacements([])
        setApiError((prev) => [prev, parseApiError(placementRes.error)].filter(Boolean).join(' '))
      }
    } catch (err) {
      setPlacements([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMediaRegister()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(row: TraditionalMediaRow) {
    if (!row.id) {
      showToast('This placement has no backend ID.', 'error')
      return
    }
    setEditingId(row.id)
    setForm({
      placement_type: row.placementType,
      name: row.name,
      vendor: row.vendor,
      location: row.location,
      ownership: row.ownership,
      amount_paid: row.amountLabel.replace(/[^0-9.-]/g, '') || '0',
      start_date: row.startDateValue || null,
      end_date: row.endDateValue,
      status: row.status,
      proof_url: row.proofUrl,
      division: '',
      notes: row.notes,
    })
    setShowModal(true)
  }

  async function handleSavePlacement() {
    if (!form.name.trim()) {
      showToast('Please enter a media placement title', 'error')
      return
    }
    if (!form.end_date) {
      showToast('Please enter an expiry date', 'error')
      return
    }

    setIsSaving(true)
    try {
      const payload: BackendTraditionalMediaPlacementCreate = {
        ...form,
        name: form.name.trim(),
        vendor: form.vendor?.trim() || null,
        location: form.location?.trim() || null,
        amount_paid: form.amount_paid || '0',
        start_date: form.start_date || null,
        proof_url: form.proof_url?.trim() || null,
        division: form.division || null,
        notes: form.notes?.trim() || null,
      }
      const res = editingId
        ? await marketingService.updateTraditionalMediaPlacement(editingId, payload)
        : await marketingService.createTraditionalMediaPlacement(payload)

      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not save media placement'), 'error')
        return
      }

      showToast(editingId ? 'Media placement updated.' : 'Media placement created.', 'success')
      setShowModal(false)
      setEditingId(null)
      setForm(emptyForm)
      await loadMediaRegister()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleExport() {
    setIsSaving(true)
    try {
      const res = await marketingService.exportTraditionalMediaPlacements()
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not export media placements'), 'error')
        return
      }
      showToast('Traditional media export generated.', 'success')
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Traditional media register" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-text">Traditional Advertising & Media Asset Register</h2>
            <p className="text-xs text-text-3 mt-0.5">
              Billboards, radio, TV, print, activations, branded assets, contracts, expiry dates and proof of execution
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text shadow-xs hover:bg-surface-1 transition-all active:scale-95 disabled:opacity-50"
            >
              <AppIcon name="download" size={14} /> Export
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-navy text-xs font-semibold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95"
            >
              <AppIcon name="plus" size={14} /> Add media placement
            </button>
          </div>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadMediaRegister} compact /> : null}

        {isLoading ? (
          <SkeletonKpiGrid />
        ) : metrics.length === 0 ? (
          <EmptyState
            title="No media KPI cards"
            description="No backend traditional-media KPI cards were returned."
            icon="ti-ad"
            compact
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.map((metric, index) => (
            <div key={metric.key} className="bg-surface border border-border rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <div className="text-[11px] text-text-3 font-medium">{metric.label}</div>
                <div className="text-xl font-extrabold text-text tracking-tight">{metric.value}</div>
                <div className="text-[10px] text-text-3 font-medium">{metric.foot}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
                <AppIcon name={['layout-board', 'currency-naira', 'clock', 'archive'][index] || 'ad'} size={18} />
              </div>
            </div>
            ))}
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-2">
            <h3 className="text-sm font-bold text-text">Active and historical media placements</h3>
            <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
              Expiring within 14 days
            </span>
          </div>

          {isLoading ? (
            <SkeletonTable rows={6} columns={11} />
          ) : placements.length === 0 ? (
            <EmptyState title="No media placements" description="No media placements were returned." icon="ti-layout-board" compact />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-3 font-bold">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Type / placement</th>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Location / channel</th>
                    <th className="py-2.5 px-3">Ownership</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Start</th>
                    <th className="py-2.5 px-3">Expiry</th>
                    <th className="py-2.5 px-3 text-center">Days</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {placements.map((placement) => (
                    <tr key={String(placement.id || placement.name)} className="hover:bg-surface-1">
                      <td className="py-2.5 px-3 font-bold text-text-3">{placement.id || '-'}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-text">{placement.placementType}</div>
                        <div className="text-[10.5px] text-text-3">{placement.name}</div>
                      </td>
                      <td className="py-2.5 px-3 text-text">{placement.vendor}</td>
                      <td className="py-2.5 px-3 text-text-3">{placement.location}</td>
                      <td className="py-2.5 px-3 text-text-3">{placement.ownership}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-text">{placement.amountLabel}</td>
                      <td className="py-2.5 px-3 text-text-3">{placement.startDate}</td>
                      <td className="py-2.5 px-3 text-text-3">{placement.endDate}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${placement.daysClass}`}>
                          {placement.daysLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${statusClass(placement.status)}`}>
                          {placement.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => openEdit(placement)}
                          className="px-2.5 py-1 text-[10.5px] font-semibold border border-border rounded-lg bg-surface text-text hover:bg-surface-2 transition-all shrink-0"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Media Placement' : 'Add Media Placement'} size="lg">
        <div className="space-y-4">
          <Field label="Placement Title" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Type" value={form.placement_type} onChange={(value) => setForm({ ...form, placement_type: value })} options={[
              ['billboard', 'Billboard'],
              ['radio', 'Radio'],
              ['tv', 'TV'],
              ['branded_vehicle', 'Branded Vehicle'],
              ['print', 'Flyer / Print'],
            ]} />
            <Field label="Vendor / Provider" value={form.vendor || ''} onChange={(value) => setForm({ ...form, vendor: value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Contract Amount (NGN)" type="number" value={String(form.amount_paid || '')} onChange={(value) => setForm({ ...form, amount_paid: value })} />
            <Field label="Location / Channel" value={form.location || ''} onChange={(value) => setForm({ ...form, location: value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Start Date" type="date" value={form.start_date || ''} onChange={(value) => setForm({ ...form, start_date: value || null })} />
            <Field label="Expiry Date" type="date" value={form.end_date || ''} onChange={(value) => setForm({ ...form, end_date: value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Ownership" value={form.ownership || 'rented'} onChange={(value) => setForm({ ...form, ownership: value })} options={[
              ['rented', 'Rented'],
              ['company_owned', 'Company-owned'],
            ]} />
            <SelectField label="Status" value={form.status || 'active'} onChange={(value) => setForm({ ...form, status: value })} options={[
              ['active', 'Active'],
              ['expired', 'Expired'],
              ['archived', 'Archived'],
            ]} />
          </div>

          <Field label="Proof URL" value={form.proof_url || ''} onChange={(value) => setForm({ ...form, proof_url: value })} />
          <Field label="Notes" value={form.notes || ''} onChange={(value) => setForm({ ...form, notes: value })} />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-text hover:bg-surface-1">
              Cancel
            </button>
            <button type="button" onClick={handleSavePlacement} disabled={isSaving} className="px-4 py-2 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : editingId ? 'Save Changes' : 'Add Placement'}
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
      <label className="block text-xs font-bold text-text-2 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-text-2 mb-1">{label}</label>
      <Select
        options={options.map(([val, lbl]) => ({ value: val, label: lbl }))}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  )
}
