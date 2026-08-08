import {
  useEffect,
  useState,
} from 'react'
import { AppIcon } from '../../components/shared/AppIcon'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonKpiGrid, SkeletonList, Topbar, Select } from '../shared'
import { useToast } from '../../context/ToastContext'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import {
  transformPartnerDashboard,
  transformPartnerRows,
  transformTraditionalMediaRows,
  type OperationsMetric,
  type PartnerOperationsRow,
  type TraditionalMediaRow,
} from '../../services/transformers/marketingTransformers'

type PartnerTab = 'realtors' | 'influencers' | 'billboards' | 'radio'

const tabs: { id: PartnerTab; label: string }[] = [
  { id: 'realtors', label: 'Realtors' },
  { id: 'influencers', label: 'Influencers' },
  { id: 'billboards', label: 'Billboards' },
  { id: 'radio', label: 'Radio / TV' },
]

function periodRange(period: string) {
  const end = new Date()
  const start = new Date(end)
  if (period === 'month') start.setDate(end.getDate() - 29)
  else if (period === 'quarter') start.setDate(end.getDate() - 89)
  else start.setDate(end.getDate() - 6)
  return { period_start: start.toISOString().slice(0, 10), period_end: end.toISOString().slice(0, 10) }
}

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (key.includes('active') || key.includes('approved')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (key.includes('pending') || key.includes('review')) return 'bg-indigo-50 text-indigo-800 border-indigo-200'
  if (key.includes('expired') || key.includes('archived')) return 'bg-rose-50 text-rose-800 border-rose-200'
  return 'bg-surface-1 text-text-3 border-border'
}

export function PartnersPage() {
  const [period, setPeriod] = useState('week')
  const [activeTab, setActiveTab] = useState<PartnerTab>('realtors')
  const [metrics, setMetrics] = useState<OperationsMetric[]>([])
  const [partners, setPartners] = useState<PartnerOperationsRow[]>([])
  const [placements, setPlacements] = useState<TraditionalMediaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', category: 'real_estate' })
  const { showToast } = useToast()

  const isMediaTab = activeTab === 'billboards' || activeTab === 'radio'

  async function loadOperations() {
    setIsLoading(true)
    setApiError('')
    try {
      const dashboardRes = await marketingService.getPartnerOperationsDashboard(periodRange(period))
      if (dashboardRes.data) setMetrics(transformPartnerDashboard(dashboardRes.data).metrics)
      else if (dashboardRes.error) setApiError(parseApiError(dashboardRes.error))

      if (isMediaTab) {
        const mediaRes = await marketingService.getTraditionalMediaPlacements(
          activeTab === 'billboards' ? { placement_type: 'billboard', limit: 50 } : { limit: 50 }
        )
        if (mediaRes.data) {
          const rows = transformTraditionalMediaRows(mediaRes.data)
          setPlacements(activeTab === 'radio'
            ? rows.filter((row) => /radio|tv|television/i.test(row.placementType))
            : rows)
        } else if (mediaRes.error) {
          setPlacements([])
          setApiError(parseApiError(mediaRes.error))
        }
      } else {
        const category = activeTab === 'realtors' ? 'real_estate' : 'influencer'
        const partnerRes = await marketingService.getPartnerDirectory({ category, limit: 50 })
        if (partnerRes.data) setPartners(transformPartnerRows(partnerRes.data))
        else if (partnerRes.error) {
          setPartners([])
          setApiError(parseApiError(partnerRes.error))
        }
      }
    } catch (err) {
      setPartners([])
      setPlacements([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadOperations())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, activeTab])

  async function handleAddPartner() {
    if (!form.email.trim()) {
      showToast('Partner email is required', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.inviteMarketingPartner({
        name: form.name.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        category: form.category,
        status: 'pending',
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not invite partner'), 'error')
        return
      }

      showToast('Partner invitation created.', 'success')
      setShowAddModal(false)
      setForm({ name: '', email: '', phone: '', category: 'real_estate' })
      await loadOperations()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Partners & media" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-xs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'border border-border bg-surface shadow-xs text-text'
                    : 'text-text-3 hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {apiError ? <ErrorState message={apiError} onRetry={loadOperations} compact /> : null}

          {isLoading ? (
            <SkeletonKpiGrid cards={3} />
          ) : metrics.length === 0 ? (
            <EmptyState
              title="No partner KPI cards"
              description="No backend partner KPI cards were returned."
              icon="ti-users-group"
              compact
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
              <div key={metric.key} className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                <div className="mb-1 text-xs font-medium text-text-3">{metric.label}</div>
                <div className="text-2xl font-extrabold tracking-tight text-text">{metric.value}</div>
                {metric.foot && <div className="mt-1 text-xs font-medium text-text-3">{metric.foot}</div>}
              </div>
              ))}
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">{tabs.find((tab) => tab.id === activeTab)?.label}</h3>
              {!isMediaTab && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95"
                >
                  <AppIcon name="plus" size={14} /> Add partner
                </button>
              )}
            </div>

            {isMediaTab ? (
              <MediaPlacementList rows={placements} loading={isLoading} />
            ) : (
              <PartnerList rows={partners} loading={isLoading} />
            )}
          </div>
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Partner">
        <div className="space-y-4">
          <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <div>
            <label className="mb-1 block text-xs font-bold text-text-2">Category</label>
            <Select
              options={[
                { value: 'real_estate', label: 'Realtor / Real Estate' },
                { value: 'influencer', label: 'Influencer' },
                { value: 'external_partner', label: 'External Partner' },
                { value: 'media', label: 'Media Partner' },
              ]}
              value={form.category}
              onChange={(val) => setForm({ ...form, category: val })}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1">Cancel</button>
            <button type="button" onClick={handleAddPartner} disabled={isSaving} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : 'Invite Partner'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function PartnerList({ rows, loading }: { rows: PartnerOperationsRow[]; loading: boolean }) {
  if (loading) return <SkeletonList rows={5} avatar />

  if (rows.length === 0) {
    return <EmptyState title="No partners" description="No partners were returned." icon="ti-users" compact />
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={String(row.id || row.name)} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-1 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-900">{row.init}</div>
            <div className="min-w-0">
              <h4 className="truncate text-xs font-bold text-text">{row.name}</h4>
              <p className="mt-0.5 truncate text-[10.5px] font-medium text-text-3">{row.meta || row.categoryLabel}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 text-right">
            <div>
              <div className="text-xs font-extrabold text-text">{row.valueLabel}</div>
              <div className="text-[10px] font-medium text-text-3">Closed value</div>
            </div>
            <span className={`rounded border px-2 py-0.5 text-[10.5px] font-bold ${statusClass(row.status)}`}>{row.status}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function MediaPlacementList({ rows, loading }: { rows: TraditionalMediaRow[]; loading: boolean }) {
  if (loading) return <SkeletonList rows={5} />

  if (rows.length === 0) {
    return <EmptyState title="No media placements" description="No media placements were returned." icon="ti-layout-board" compact />
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={String(row.id || row.name)} className="grid gap-3 rounded-xl border border-border/80 bg-surface-1 p-3 text-xs md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
          <div className="min-w-0">
            <div className="truncate font-bold text-text">{row.name}</div>
            <div className="mt-0.5 truncate text-[10.5px] font-medium text-text-3">{row.vendor} - {row.location}</div>
          </div>
          <div className="text-text-3">{row.ownership} - {row.amountLabel}</div>
          <div className="text-text-3">{row.startDate} to {row.endDate}</div>
          <span className={`rounded border px-2 py-0.5 text-[10.5px] font-bold ${statusClass(row.status)}`}>{row.status}</span>
        </div>
      ))}
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-text-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text outline-none focus:border-navy" />
    </div>
  )
}
