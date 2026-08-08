import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BusyLabel, InlineState, ModalDialog, SkeletonField, Topbar, Select } from '../../shared'
import { AppIcon } from '../../shared/AppIcon'
import { useStore } from '../../../context/StoreContext'
import { useToast } from '../../../context/ToastContext'
import { parseApiError } from '../../../services/api/apiClient'
import { marketingService } from '../../../services/api/marketingService'
import { teamService } from '../../../services/api/teamService'
import { transformBackendLead } from '../../../services/transformers/marketingTransformers'
import { transformEmployeeOptions, type EmployeeOption } from '../../../services/transformers/teamTransformers'

const divisionOptions = [
  { value: 'real_estate', label: 'Real Estate', icon: 'building' },
  { value: 'benji', label: 'Benji Vendors & Delivery', icon: 'box' },
  { value: 'engineering', label: 'Engineering Services', icon: 'setting-2' },
  { value: 'surveying', label: 'Land Surveying', icon: 'radar' },
  { value: 'ict', label: 'ICT Solutions', icon: 'desktop' },
  { value: 'agriculture', label: 'Agriculture & Farm', icon: 'gallery' },
]

const sourceOptions = [
  { value: 'website', label: 'Website Inquiry', icon: 'desktop' },
  { value: 'referral', label: 'Client / Realtor Referral', icon: 'profile-2user' },
  { value: 'social', label: 'Social Media Ad (FB/IG/TikTok)', icon: 'notification-bing' },
  { value: 'whatsapp', label: 'WhatsApp Direct Chat', icon: 'messages' },
  { value: 'other', label: 'Other Channel', icon: 'routing' },
]

interface CampaignOption {
  id: string | number
  label: string
  icon?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function textFrom(value: unknown, fallback = '') {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function rowsFrom(value: unknown) {
  if (Array.isArray(value)) return value
  if (!isRecord(value)) return []
  const candidates = [value.items, value.results, value.data, value.campaigns, value.rows]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

function transformCampaignOptions(value: unknown): CampaignOption[] {
  return rowsFrom(value)
    .map((row, index): CampaignOption | null => {
      if (!isRecord(row)) return null
      const id = textFrom(row.id ?? row.campaign_id, String(index + 1))
      const label = textFrom(row.name ?? row.title ?? row.campaign_name, 'Untitled campaign')
      return { id, label, icon: 'notification-bing' }
    })
    .filter((row): row is CampaignOption => Boolean(row))
}

function numericId(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function NewLeadPage() {
  const [period, setPeriod] = useState('week')
  const navigate = useNavigate()
  const { leads, setLeads } = useStore()
  const { showToast } = useToast()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [division, setDivision] = useState('real_estate')
  const [source, setSource] = useState('other')
  const [campaign, setCampaign] = useState('none')
  const [budget, setBudget] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignees, setAssignees] = useState<EmployeeOption[]>([])
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([])
  const [lookupError, setLookupError] = useState('')
  const [isLoadingLookups, setIsLoadingLookups] = useState(true)

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    title: string
    description?: string
    type: 'success' | 'error' | 'warning' | 'info'
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info',
    onConfirm: () => {},
  })

  function openModal(title: string, description: string, type: 'success' | 'error' | 'warning' | 'info', onConfirm?: () => void) {
    setModalConfig({
      isOpen: true,
      title,
      description,
      type,
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }))
        if (onConfirm) onConfirm()
      },
    })
  }

  useEffect(() => {
    let alive = true

    async function loadLookups() {
      setIsLoadingLookups(true)
      setLookupError('')
      try {
        const [employeeRes, campaignRes] = await Promise.all([
          teamService.listEmployees({ is_active: true, limit: 100 }),
          marketingService.getCampaigns({ limit: 100 }),
        ])

        if (!alive) return

        const errors = [employeeRes.error, campaignRes.error].filter(Boolean)
        if (errors.length > 0) {
          setLookupError(parseApiError(errors.join(' ')))
        }

        setAssignees(employeeRes.data ? transformEmployeeOptions(employeeRes.data) : [])
        setCampaignOptions(campaignRes.data ? transformCampaignOptions(campaignRes.data) : [])
      } finally {
        if (alive) setIsLoadingLookups(false)
      }
    }

    void loadLookups()

    return () => {
      alive = false
    }
  }, [])

  async function handleRegisterLead() {
    if (!fullName.trim()) {
      showToast('Please enter the full name', 'error')
      openModal('Missing Lead Name', 'Please enter the client full name before registering.', 'warning')
      return
    }

    if (!phone.trim()) {
      showToast('Please enter the phone number', 'error')
      openModal('Missing Phone Number', 'Please enter the client phone number before registering.', 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await marketingService.createLead({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        division,
        source,
        campaign_id: campaign !== 'none' ? numericId(campaign) : null,
        assigned_to_id: assignedToId ? numericId(assignedToId) : null,
        budget_range: budget.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      if (res.data) {
        const newLead = transformBackendLead(res.data)
        setLeads([newLead, ...leads])
        showToast(`${newLead.name} has been added to your leads.`, 'success')
        navigate({ to: '/lead-journal' })
      } else {
        const errMsg = parseApiError(res.error || 'Failed to register lead')
        showToast(errMsg, 'error')
        openModal('Registration Failed', errMsg, 'error')
      }
    } catch (err: unknown) {
      const errMsg = parseApiError(err instanceof Error ? err.message : err)
      showToast(errMsg, 'error')
      openModal('Something went wrong', errMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedDivisionLabel = divisionOptions.find((d) => d.value === division)?.label || 'Real Estate'
  const selectedAssigneeLabel = assignees.find((a) => String(a.id) === assignedToId)?.label || 'Unassigned'

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Register new lead" period={period} onPeriodChange={setPeriod} />

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-5 overflow-y-auto overflow-x-hidden p-3 sm:p-6">
        {/* Page Hero Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-gradient-to-r from-surface via-surface-1 to-surface p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy/10 text-navy shadow-xs">
              <AppIcon name="user-add" size={24} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text" style={{ fontFamily: 'var(--font-heading)' }}>
                Lead Intake Command
              </h2>
              <p className="text-xs font-medium text-text-3">
                Register new prospect inquiries, route to sales representatives, and link active marketing campaigns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/lead-journal' })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text hover:bg-surface-1 transition-all"
            >
              <AppIcon name="book" size={15} /> Lead 360 Journal
            </button>
          </div>
        </div>

        {lookupError ? <InlineState type="warning" message={lookupError} /> : null}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleRegisterLead()
          }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          {/* Main Intake Form Card */}
          <div className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-xs lg:col-span-8">
            <div className="flex items-center justify-between border-b border-border/80 pb-3.5">
              <div className="flex items-center gap-2">
                <AppIcon name="user-tag" size={18} className="text-navy" />
                <h3 className="text-sm font-bold text-text" style={{ fontFamily: 'var(--font-heading)' }}>
                  Client Contact & Qualification
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-text-3">* Required fields</span>
            </div>

            {/* Contact Details Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Client Full Name *">
                  <div className="relative">
                    <AppIcon name="user-tag" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adaeze Chukwu"
                      className="w-full rounded-xl border border-border/80 bg-surface py-2.5 pl-9 pr-3 text-xs text-text placeholder:text-text-3 outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-all font-semibold"
                    />
                  </div>
                </Field>

                <Field label="Phone Number *">
                  <div className="relative">
                    <AppIcon name="call" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full rounded-xl border border-border/80 bg-surface py-2.5 pl-9 pr-3 text-xs text-text placeholder:text-text-3 outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-all font-semibold"
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email Address">
                  <div className="relative">
                    <AppIcon name="sms" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-xl border border-border/80 bg-surface py-2.5 pl-9 pr-3 text-xs text-text placeholder:text-text-3 outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-all font-semibold"
                    />
                  </div>
                </Field>

                <Field label="Division *">
                  <Select
                    options={divisionOptions}
                    value={division}
                    onChange={setDivision}
                    className="w-full"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Lead Source *">
                  <Select
                    options={sourceOptions}
                    value={source}
                    onChange={setSource}
                    className="w-full"
                  />
                </Field>

                <Field label="Linked Campaign">
                  {isLoadingLookups ? (
                    <SkeletonField />
                  ) : (
                    <Select
                      options={[
                        { value: 'none', label: 'No campaign selected', icon: 'notification-bing' },
                        ...campaignOptions.map((c) => ({ value: String(c.id), label: c.label, icon: 'notification-bing' })),
                      ]}
                      value={campaign}
                      onChange={setCampaign}
                      className="w-full"
                    />
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Budget Range">
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. ₦3M - ₦8M"
                    className="w-full rounded-xl border border-border/80 bg-surface py-2.5 px-3 text-xs text-text placeholder:text-text-3 outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-all font-semibold"
                  />
                </Field>

                <Field label="Assign to Sales Representative">
                  {isLoadingLookups ? (
                    <SkeletonField />
                  ) : (
                    <Select
                      options={[
                        { value: '', label: 'Unassigned', icon: 'people' },
                        ...assignees.map((emp) => ({ value: String(emp.id), label: `${emp.label} (${emp.sublabel})`, icon: 'people' })),
                      ]}
                      value={assignedToId}
                      onChange={setAssignedToId}
                      className="w-full"
                    />
                  )}
                </Field>
              </div>

              <Field label="First Contact Notes & Inquiry Context">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key inquiry details, specific property/service interest, timeline, budget hints..."
                  rows={4}
                  className="w-full rounded-xl border border-border/80 bg-surface p-3 text-xs text-text placeholder:text-text-3 outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-all resize-none font-medium"
                />
              </Field>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4">
              <button
                type="button"
                onClick={() => navigate({ to: '/lead-journal' })}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text hover:bg-surface-1 transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-navy-dark active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <BusyLabel>Registering lead...</BusyLabel>
                ) : (
                  <>
                    <AppIcon name="tick-square" size={16} /> Register Lead
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Lead Preview & Intake Rules */}
          <div className="space-y-5 lg:col-span-4">
            {/* Live Card Preview */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-3">Lead Intake Preview</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  New Lead
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-medium text-text-3">Prospect Name</div>
                  <div className="text-sm font-extrabold text-text truncate">
                    {fullName.trim() || 'ADA EZE CHUKWU'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-text-3">Division</span>
                    <p className="font-bold text-text truncate">{selectedDivisionLabel}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-3">Phone</span>
                    <p className="font-bold text-text truncate">{phone.trim() || 'Not set'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-text-3">Assigned Rep</span>
                    <p className="font-bold text-text truncate">{selectedAssigneeLabel}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-3">Budget</span>
                    <p className="font-bold text-text truncate">{budget.trim() || 'Flexible'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead SLA Policy Reminder */}
            <div className="rounded-2xl border border-navy/20 bg-blue-50/60 p-4 space-y-2 text-xs text-navy-dark">
              <div className="flex items-center gap-1.5 font-bold text-navy">
                <AppIcon name="shield-security" size={16} /> 2-Hour Response SLA Policy
              </div>
              <p className="text-[11px] leading-relaxed text-text-2">
                All newly registered leads are automatically tracked in the <strong>Lead Control Tower</strong>. First follow-up contact must be completed within 2 hours of registration.
              </p>
            </div>
          </div>
        </form>
      </div>

      <ModalDialog
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block min-w-0 space-y-1">
      <span className="block text-xs font-bold text-text-2">{label}</span>
      {children}
    </div>
  )
}
