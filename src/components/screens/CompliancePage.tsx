import { useCallback, useEffect, useMemo, useState } from 'react'
import { BusyLabel, EmptyState, ErrorState, Modal, Pill, SkeletonKpiGrid, SkeletonList, Topbar, Select, AppIcon } from '../shared'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { parseApiError } from '../../services/api/apiClient'
import { marketingService, type ComplianceRecordUpdate } from '../../services/api/marketingService'
import NoPermissionPage from '../layout/NoPermissionPage'
import { pluralize, pluralizeNoun } from '../../utils/formatters'

type UnknownRecord = Record<string, unknown>

type ComplianceRecord = {
  id: string | number
  fullName: string
  email: string
  phone: string
  departmentId: number
  complianceType: string
  referenceNumber: string | null
  dateOfIssue: string
  expiryDate: string
  issuingAuthority: string
  status: string
  description: string | null
  contactPerson: string | null
  contactEmail: string | null
  cost: number | string | null
  priorityLevel: string | null
  isExpired: boolean
  daysUntilExpiry: number
  documents: string[]
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

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function nullableText(value: unknown) {
  const parsed = text(value)
  return parsed || null
}

function transformRecord(value: unknown): ComplianceRecord {
  const data = record(value)
  const id = typeof data.id === 'string' || typeof data.id === 'number' ? data.id : text(data.reference_number, 'missing-id')
  return {
    id,
    fullName: text(data.full_name, 'Unknown owner'),
    email: text(data.email_address),
    phone: text(data.phone_number),
    departmentId: num(data.department_id),
    complianceType: text(data.compliance_type, 'Compliance record'),
    referenceNumber: nullableText(data.reference_number),
    dateOfIssue: text(data.date_of_issue),
    expiryDate: text(data.expiry_date),
    issuingAuthority: text(data.issuing_authority),
    status: text(data.status, 'pending'),
    description: nullableText(data.description),
    contactPerson: nullableText(data.contact_person),
    contactEmail: nullableText(data.contact_email),
    cost: typeof data.cost === 'string' || typeof data.cost === 'number' ? data.cost : null,
    priorityLevel: nullableText(data.priority_level),
    isExpired: Boolean(data.is_expired),
    daysUntilExpiry: num(data.days_until_expiry),
    documents: asArray(data.documents).map((item) => text(item)).filter(Boolean),
  }
}

function toUpdatePayload(recordItem: ComplianceRecord, status: string): ComplianceRecordUpdate {
  return {
    full_name: recordItem.fullName,
    email_address: recordItem.email,
    phone_number: recordItem.phone,
    department_id: recordItem.departmentId,
    compliance_type: recordItem.complianceType,
    reference_number: recordItem.referenceNumber,
    date_of_issue: recordItem.dateOfIssue,
    expiry_date: recordItem.expiryDate,
    issuing_authority: recordItem.issuingAuthority,
    status,
    description: recordItem.description,
    contact_person: recordItem.contactPerson,
    contact_email: recordItem.contactEmail,
    cost: recordItem.cost,
    priority_level: recordItem.priorityLevel,
    documents: recordItem.documents,
  }
}

function isActiveStatus(status: string) {
  return ['active', 'approved', 'ready', 'valid', 'complete', 'completed'].includes(status.toLowerCase())
}

function isHoldStatus(status: string) {
  return ['hold', 'blocked', 'expired', 'rejected', 'gap'].includes(status.toLowerCase())
}

function controlGroup(recordItem: ComplianceRecord) {
  const type = recordItem.complianceType.toLowerCase()
  if (/(privacy|consent|direct|opt|ndpa)/.test(type)) return 'privacy'
  if (/(ads|ad|arcon|creative|campaign|claim)/.test(type)) return 'ads'
  return 'other'
}

function statusVariant(status: string): 'p-active' | 'p-over' | 'p-pause' | 'p-review' {
  if (isActiveStatus(status)) return 'p-active'
  if (isHoldStatus(status)) return 'p-over'
  if (status.toLowerCase().includes('review')) return 'p-review'
  return 'p-pause'
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value || 'N/A'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function CompliancePage() {
  const { showToast } = useToast()
  const { hasPermission } = useAuth()
  const [period, setPeriod] = useState('week')
  const [records, setRecords] = useState<ComplianceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | number | null>(null)
  const [apiError, setApiError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    complianceType: 'privacy',
    issuingAuthority: 'NDPC',
    dateOfIssue: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    description: '',
  })

  async function handleCreateRecord() {
    if (!hasPermission('compliance', 'create')) {
      showToast('You do not have permission to create compliance records', 'error')
      return
    }
    if (!createForm.fullName.trim() || !createForm.email.trim()) {
      showToast('Please enter full name and email', 'error')
      return
    }
    setIsCreating(true)
    try {
      const response = await marketingService.createComplianceRecord({
        full_name: createForm.fullName.trim(),
        email_address: createForm.email.trim(),
        phone_number: createForm.phone.trim() || '08000000000',
        department_id: 0,
        compliance_type: createForm.complianceType,
        reference_number: null,
        issuing_authority: createForm.issuingAuthority.trim() || 'Internal Compliance',
        date_of_issue: createForm.dateOfIssue,
        expiry_date: createForm.expiryDate || '',
        status: 'active',
        description: createForm.description.trim() || null,
        contact_person: null,
        contact_email: null,
        cost: null,
        priority_level: null,
        documents: [],
      })
      if (response.error) {
        showToast(parseApiError(response.error), 'error')
        return
      }
      showToast('Compliance record created.', 'success')
      setShowCreateModal(false)
      setCreateForm({ fullName: '', email: '', phone: '', complianceType: 'privacy', issuingAuthority: 'NDPC', dateOfIssue: new Date().toISOString().slice(0, 10), expiryDate: '', description: '' })
      await loadRecords()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const loadRecords = useCallback(async () => {
    setIsLoading(true)
    setApiError('')

    try {
      const response = await marketingService.getComplianceRecords({ limit: 100 })
      if (response.error) {
        setApiError(parseApiError(response.error))
      }
      setRecords(asArray(response.data).map(transformRecord))
    } catch (err) {
      setApiError(parseApiError(err))
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadRecords()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadRecords])

  const privacyControls = useMemo(() => records.filter((item) => controlGroup(item) === 'privacy'), [records])
  const adsControls = useMemo(() => records.filter((item) => controlGroup(item) === 'ads'), [records])
  const registerRows = useMemo(() => records.filter((item) => controlGroup(item) !== 'other').concat(records.filter((item) => controlGroup(item) === 'other')), [records])
  const activeCount = records.filter((item) => isActiveStatus(item.status)).length
  const consentCoverage = privacyControls.length ? Math.round((privacyControls.filter((item) => isActiveStatus(item.status)).length / privacyControls.length) * 100) : 0
  const holdCount = records.filter((item) => isHoldStatus(item.status) || item.isExpired).length
  const approvedCreatives = adsControls.filter((item) => isActiveStatus(item.status)).length

  const toggleRecord = async (recordItem: ComplianceRecord) => {
    const nextStatus = isActiveStatus(recordItem.status) ? 'gap' : 'active'
    setSavingId(recordItem.id)
    try {
      const response = await marketingService.updateComplianceRecord(recordItem.id, toUpdatePayload(recordItem, nextStatus))
      if (response.error) {
        showToast(response.error, 'error')
        return
      }
      showToast('Compliance record updated.', 'success')
      await loadRecords()
    } catch (err) {
      showToast(err, 'error')
    } finally {
      setSavingId(null)
    }
  }

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="compliance" />
  }

  return (
    <div className="flex min-h-0 flex-col">
      <Topbar title="Marketing compliance" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-text">Marketing Compliance Control</h3>
            <p className="text-xs text-text-3">Consent, direct-marketing opt-out, claim approval, ad vetting and audit evidence</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95"
            >
              <AppIcon name="plus" size={14} /> New record
            </button>
            <button
              type="button"
              onClick={() => void loadRecords()}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-900 shadow-xs hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <BusyLabel>Refreshing...</BusyLabel> : <><AppIcon name="refresh" size={14} /> Refresh records</>}
            </button>
          </div>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={() => void loadRecords()} compact /> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full">
              <SkeletonKpiGrid cards={4} />
            </div>
          ) : (
            <>
              <Metric label="Control readiness" value={records.length ? `${Math.round((activeCount / records.length) * 100)}%` : '0%'} sub={`${activeCount} of ${records.length} ${pluralizeNoun(records.length, 'record')} active`} />
              <Metric label="Consent coverage" value={`${consentCoverage}%`} sub="Privacy/direct-marketing records active" />
              <Metric label="Campaigns on hold" value={holdCount.toString()} sub="Expired, blocked or gap records" />
              <Metric label="Approved creatives" value={approvedCreatives.toString()} sub="Ad/ARCON records active" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ControlPanel title="NDPA / direct marketing controls" subtitle="Consent records and withdrawal must be easy to evidence" records={privacyControls} savingId={savingId} onToggle={toggleRecord} empty="No privacy or consent compliance records were returned." loading={isLoading} />
          <ControlPanel title="ARCON / advertising approval controls" subtitle="Campaigns should not go live before required approval" records={adsControls} savingId={savingId} onToggle={toggleRecord} empty="No ARCON, ad, creative, or claim compliance records were returned." loading={isLoading} />
        </div>

        <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
            <h3 className="text-sm font-bold text-text">Campaign compliance register</h3>
            <span className="rounded border border-border bg-surface-1 px-2 py-0.5 text-[11px] font-bold text-text-3">{pluralize(records.length, 'record')}</span>
          </div>

          {isLoading ? (
            <SkeletonList rows={5} />
          ) : registerRows.length ? (
            <div className="space-y-2">
              {registerRows.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border/80 bg-surface-1 p-3 text-xs sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_96px_96px]">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-text">{item.complianceType}</div>
                    <div className="truncate text-[10px] text-text-3">{item.referenceNumber || item.issuingAuthority}</div>
                  </div>
                  <span className="truncate">{item.fullName}</span>
                  <span className="truncate">{formatDate(item.expiryDate)}</span>
                  <span className={item.isExpired ? 'font-bold text-rose-600' : 'font-semibold text-text-2'}>
                    {item.isExpired ? 'Expired' : `${item.daysUntilExpiry}d`}
                  </span>
                  <Pill variant={statusVariant(item.status)}>{item.status}</Pill>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No compliance records" description="No compliance records were returned." icon="ti-shield-check" compact />
          )}
        </section>

        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs font-medium text-amber-900">
          <AppIcon name="shield-alert" size={16} className="shrink-0 text-amber-700" />
          <span>
            Keep consent source, timestamp, permitted channels, privacy notice version, opt-out timestamp, creative approval, claim evidence and ARCON certificate/reference where applicable.
          </span>
        </div>
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New compliance record">
          <form onSubmit={(e) => { e.preventDefault(); void handleCreateRecord() }} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Full name *</label>
              <input
                type="text"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text placeholder:text-text-3 focus:outline-none focus:border-navy"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text placeholder:text-text-3 focus:outline-none focus:border-navy"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Phone</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="08012345678"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text placeholder:text-text-3 focus:outline-none focus:border-navy"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Compliance type</label>
                <Select
                  options={[
                    { value: 'privacy', label: 'Privacy / NDPA' },
                    { value: 'arcon', label: 'ARCON Advertising' },
                    { value: 'creative', label: 'Creative Approval' },
                    { value: 'direct_marketing', label: 'Direct Marketing Consent' },
                  ]}
                  value={createForm.complianceType}
                  onChange={(val) => setCreateForm({ ...createForm, complianceType: val })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Authority</label>
                <input
                  type="text"
                  value={createForm.issuingAuthority}
                  onChange={(e) => setCreateForm({ ...createForm, issuingAuthority: e.target.value })}
                  placeholder="NDPC / ARCON"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text placeholder:text-text-3 focus:outline-none focus:border-navy"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Issue date</label>
                <input
                  type="date"
                  value={createForm.dateOfIssue}
                  onChange={(e) => setCreateForm({ ...createForm, dateOfIssue: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Expiry date</label>
                <input
                  type="date"
                  value={createForm.expiryDate}
                  onChange={(e) => setCreateForm({ ...createForm, expiryDate: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Description / Notes</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                rows={2}
                placeholder="Optional notes or reference numbers..."
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
                {isCreating ? <BusyLabel>Creating...</BusyLabel> : 'Create record'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  )
}

function ControlPanel({
  title,
  subtitle,
  records,
  savingId,
  onToggle,
  empty,
  loading,
}: {
  title: string
  subtitle: string
  records: ComplianceRecord[]
  savingId: string | number | null
  onToggle: (recordItem: ComplianceRecord) => void
  empty: string
  loading: boolean
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="border-b border-border/80 pb-2.5">
        <h3 className="text-sm font-bold text-text">{title}</h3>
        <p className="text-xs text-text-3">{subtitle}</p>
      </div>

      {loading && records.length === 0 ? (
        <SkeletonList rows={4} />
      ) : records.length ? (
        <div className="space-y-2">
          {records.map((item) => {
            const active = isActiveStatus(item.status)
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-1 p-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggle(item)}
                    disabled={savingId === item.id}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      active ? 'bg-emerald-700' : 'bg-surface-2'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <div className="min-w-0">
                    <h4 className="truncate text-xs font-bold text-text">{item.complianceType}</h4>
                    <p className="mt-0.5 truncate text-[10.5px] font-medium text-text-3">{item.referenceNumber || item.description || item.issuingAuthority}</p>
                  </div>
                </div>

                <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {active ? 'Active' : 'Gap'}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState title="No compliance controls" description={empty} icon="ti-shield-off" compact />
      )}
    </section>
  )
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="mb-1 text-xs font-medium text-text-3">{label}</div>
      <div className="text-2xl font-extrabold tracking-tight text-text">{value}</div>
      <div className="mt-1 text-xs font-medium text-text-3">{sub}</div>
    </div>
  )
}
