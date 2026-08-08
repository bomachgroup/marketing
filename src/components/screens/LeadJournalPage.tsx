import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useStore } from '../../context/StoreContext'
import { useToast } from '../../context/ToastContext'
import { BusyLabel, EmptyState, Modal, Select, SkeletonDetail, SkeletonForm, SkeletonList, Topbar } from '../shared'
import type { Activity, Lead } from '../../data/types'
import { marketingService } from '../../services/api/marketingService'
import { transformBackendLead, transformBackendLeadActivity } from '../../services/transformers/marketingTransformers'
import { parseApiError } from '../../services/api/apiClient'
import { AppIcon } from '../../components/shared/AppIcon'
import { pluralize } from '../../utils/formatters'

const ACTIVITY_TYPE_OPTIONS = ['Phone Call', 'WhatsApp', 'Email', 'Meeting', 'Site Visit', 'Field Outreach', 'Social Media'].map((t) => ({ value: t, label: t }))
const OUTCOME_OPTIONS = ['Connected', 'No Answer', 'Busy', 'Scheduled Inspection', 'Follow-up Required', 'Won / Converted'].map((o) => ({ value: o, label: o }))
const LEAD_SOURCE_OPTIONS = [
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'direct_contact', label: 'Direct Contact' },
  { value: 'other', label: 'Other' },
]
const LEAD_STAGE_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]
const PIPELINE_STAGE_OPTIONS = [
  { value: 'keep', label: 'Keep current stage' },
  ...LEAD_STAGE_OPTIONS,
]

export function LeadJournalPage() {
  const { leads, setLeads } = useStore()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [period, setPeriod] = useState('week')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(() => leads[0] ?? null)
  const [backendLeadIds, setBackendLeadIds] = useState<string[]>([])
  const [isLoadingLeads, setIsLoadingLeads] = useState(true)
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [isSavingActivity, setIsSavingActivity] = useState(false)

  const [actType, setActType] = useState('Phone Call')
  const [actOutcome, setActOutcome] = useState('Connected')
  const [actNotes, setActNotes] = useState('')
  const [actNextDate, setActNextDate] = useState('')
  const [actStage, setActStage] = useState<string>('keep')
  const [actNext, setActNext] = useState('')
  const [editingActivityId, setEditingActivityId] = useState<string | number | null>(null)
  const [editActType, setEditActType] = useState('Phone Call')
  const [editActOutcome, setEditActOutcome] = useState('Connected')
  const [editActNotes, setEditActNotes] = useState('')
  const [editActNextDate, setEditActNextDate] = useState('')
  const [editActNext, setEditActNext] = useState('')
  const [isSavingActivityEdit, setIsSavingActivityEdit] = useState(false)

  // Edit lead panel state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSource, setEditSource] = useState('other')
  const [editStatus, setEditStatus] = useState('new')
  const [editNotes, setEditNotes] = useState('')
  const [editInterests, setEditInterests] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const normalizeChoice = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

  const dateToApiDateTime = (value: string) => {
    if (!value) return null
    return `${value}T09:00:00Z`
  }

  const openEditPanel = (lead: Lead) => {
    const parts = lead.name.split(' ')
    setEditFirstName(parts[0] || '')
    setEditLastName(parts.slice(1).join(' ') || '')
    setEditPhone(lead.phone || '')
    setEditSource(LEAD_SOURCE_OPTIONS.some((o) => o.value === lead.source) ? lead.source : 'other')
    setEditStatus(lead.stage || 'new')
    setEditNotes('')
    setEditInterests(lead.campaign !== '-' ? lead.campaign : '')
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedLead) return
    if (!backendLeadIds.includes(String(selectedLead.id))) {
      showToast('Select a backend lead before saving changes.', 'error')
      return
    }
    if (!editFirstName.trim()) {
      showToast('First name is required', 'error')
      return
    }
    setIsSavingEdit(true)
    try {
      const res = await marketingService.updateLead(selectedLead.id, {
        full_name: [editFirstName.trim(), editLastName.trim()].filter(Boolean).join(' '),
        phone: editPhone.trim() || selectedLead.phone || '',
        division: selectedLead.div,
        source: editSource,
        status: editStatus,
        notes: editNotes.trim() || undefined,
        budget_range: selectedLead.budget || undefined,
        next_action: selectedLead.nextAction || undefined,
      })
      if (res.data) {
        const updated = transformBackendLead(res.data)
        setLeads(leads.map((l) => (l.id === selectedLead.id ? updated : l)))
        setSelectedLead(updated)
        setIsEditOpen(false)
        showToast(`${updated.name} has been updated.`, 'success')
      } else {
        showToast(parseApiError(res.error || 'Could not save changes'), 'error')
      }
    } catch (err: unknown) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Something went wrong'), 'error')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Load leads on mount
  useEffect(() => {
    async function fetchLiveLeads() {
      setIsLoadingLeads(true)
      try {
        const res = await marketingService.getLeads()
        if (res.data && Array.isArray(res.data.items || res.data)) {
          const apiLeads = (res.data.items || res.data).map(transformBackendLead)
          setBackendLeadIds(apiLeads.map((lead: Lead) => String(lead.id)))
          setLeads(apiLeads)
          if (apiLeads.length > 0) {
            setSelectedLead(apiLeads[0])
          }
        } else {
          setBackendLeadIds([])
        }
      } catch {
        setBackendLeadIds([])
        /* Graceful error handling */
      } finally {
        setIsLoadingLeads(false)
      }
    }
    queueMicrotask(() => void fetchLiveLeads())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedLead?.id) return
    if (!backendLeadIds.includes(String(selectedLead.id))) return

    async function fetchActivities() {
      if (!selectedLead?.id) return
      setIsLoadingActivities(true)
      try {
        const res = await marketingService.getLeadActivities(selectedLead.id, { limit: 100 })
        if (res.data) {
          const rawItems = res.data.items || res.data
          if (Array.isArray(rawItems)) {
            const activities = rawItems.map(transformBackendLeadActivity)
            const updated = { ...selectedLead, activities }
            setLeads(leads.map((l) => (l.id === selectedLead.id ? updated : l)))
            setSelectedLead(updated)
          }
        } else if (res.error) {
          showToast(parseApiError(res.error), 'error')
        }
      } finally {
        setIsLoadingActivities(false)
      }
    }

    queueMicrotask(() => void fetchActivities())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLead?.id, backendLeadIds])

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.toLowerCase().includes(search.toLowerCase()) ||
      l.assigned?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedAssignee = selectedLead?.assigned?.trim()
  const selectedAssigneeDisplay =
    selectedAssignee && selectedAssignee.toLowerCase() !== 'unassigned'
      ? `Assigned: ${selectedAssignee}`
      : 'Unassigned'
  const selectedLeadHasBackendId = !!selectedLead?.id && backendLeadIds.includes(String(selectedLead.id))

  const handleSelectLead = (l: Lead) => {
    setSelectedLead(l)
    setActNotes('')
    setActNext('')
    setActNextDate('')
    setActStage('keep')
  }

  const handleLogActivity = () => handleLogActivityApi()

  const openActivityEdit = (activity: Activity) => {
    if (!selectedLead || !selectedLeadHasBackendId) {
      showToast('Select a backend lead before editing activities.', 'error')
      return
    }
    if (!activity.id) {
      showToast('This activity has no backend ID.', 'error')
      return
    }
    setEditingActivityId(activity.id)
    setEditActType(activity.t || 'Phone Call')
    setEditActOutcome('Connected')
    setEditActNotes(activity.note || activity.t || '')
    setEditActNext(activity.nextAction || '')
    setEditActNextDate(activity.nextFollowup?.slice(0, 10) || '')
  }

  const closeActivityEdit = () => {
    if (isSavingActivityEdit) return
    setEditingActivityId(null)
    setEditActNotes('')
    setEditActNext('')
    setEditActNextDate('')
  }

  const handleSaveActivityEdit = async () => {
    if (!selectedLead || !editingActivityId) return
    if (!editActNotes.trim()) {
      showToast('Please enter activity details', 'error')
      return
    }

    setIsSavingActivityEdit(true)
    try {
      const res = await marketingService.updateLeadActivity(selectedLead.id, editingActivityId, {
        activity_type: normalizeChoice(editActType),
        outcome: normalizeChoice(editActOutcome),
        note: editActNotes.trim(),
        next_follow_up_at: dateToApiDateTime(editActNextDate),
        next_action: editActNext.trim(),
      })

      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not update activity'), 'error')
        return
      }

      const updatedActivity = transformBackendLeadActivity(res.data)
      const updatedLead = {
        ...selectedLead,
        activities: selectedLead.activities.map((activity) =>
          String(activity.id) === String(editingActivityId) ? updatedActivity : activity,
        ),
      }
      setLeads(leads.map((lead) => (lead.id === selectedLead.id ? updatedLead : lead)))
      setSelectedLead(updatedLead)
      setEditingActivityId(null)
      showToast('Activity updated.', 'success')
    } catch (err: unknown) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not update activity'), 'error')
    } finally {
      setIsSavingActivityEdit(false)
    }
  }

  const handleLogActivityApi = async () => {
    if (!selectedLead) return
    if (!selectedLeadHasBackendId) {
      showToast('Select a backend lead before logging activities.', 'error')
      return
    }
    if (!actNotes.trim()) {
      showToast('Please enter conversation/activity details', 'error')
      return
    }

    const finalStage = actStage === 'keep' ? selectedLead.stage : actStage
    setIsSavingActivity(true)
    try {
      const res = await marketingService.logLeadActivity(selectedLead.id, {
        activity_type: normalizeChoice(actType),
        outcome: normalizeChoice(actOutcome),
        note: actNotes.trim(),
        next_follow_up_at: dateToApiDateTime(actNextDate),
        next_action: actNext.trim(),
        to_status: actStage === 'keep' ? undefined : finalStage,
      })

      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not save activity'), 'error')
        return
      }

      const newActivity = transformBackendLeadActivity(res.data)
      let updatedLead: Lead = {
        ...selectedLead,
        activities: [newActivity, ...selectedLead.activities],
      }

      if (actStage !== 'keep') {
        const detail = await marketingService.getLeadDetail(selectedLead.id)
        if (detail.data) {
          updatedLead = {
            ...transformBackendLead(detail.data),
            activities: updatedLead.activities,
          }
        }
      }

      setLeads(leads.map((l) => (l.id === selectedLead.id ? updatedLead : l)))
      setSelectedLead(updatedLead)
      setActNotes('')
      setActNext('')
      setActNextDate('')
      setActStage('keep')
      showToast('Activity logged.', 'success')
    } catch (err: unknown) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not save activity'), 'error')
    } finally {
      setIsSavingActivity(false)
    }
  }

  const getStagePill = (stage: string) => {
    switch (stage) {
      case 'negotiation':
        return <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-pink-100 text-rose-800 border border-pink-200">Negotiation</span>
      case 'proposal':
        return <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Proposal sent</span>
      case 'won':
        return <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Won</span>
      case 'contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-teal-100 text-teal-800 border border-teal-200">Contacted</span>
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200">New</span>
      case 'qualified':
        return <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Qualified</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-gray-100 text-gray-800 border border-gray-200">{stage}</span>
    }
  }

  const getDivBadge = (div: string) => {
    switch (div) {
      case 'eng':
        return <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Engineering</span>
      case 're':
        return <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Real Estate</span>
      case 'ben':
        return <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Benji</span>
      case 'sur':
        return <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Surveying</span>
      case 'agr':
        return <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Agriculture</span>
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-gray-100 text-gray-800 border border-gray-200">Division</span>
    }
  }

  const initials = selectedLead?.name ? selectedLead.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'LD'

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col overflow-x-hidden">
      <Topbar title="Lead 360 journal" period={period} onPeriodChange={setPeriod} />

      <div className="min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        {/* Main Header Summary Banner */}
        <div className="flex min-w-0 flex-col gap-3 border-b border-border/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text">Lead 360 Journal & Activity Log</h2>
            <p className="text-xs text-text-3 mt-0.5">
              One complete client file: source, conversations, documents, follow-ups, inspections, payments, handoffs and next actions
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: '/new-lead' })}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95 sm:w-auto sm:shrink-0"
          >
            <AppIcon name="user-plus" size={14} /> Register lead
          </button>
        </div>

        {/* 3-Column Layout */}
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          {/* Column 1: Search & Lead List */}
          <div className="min-w-0 space-y-2 rounded-2xl border border-border bg-surface p-3 shadow-xs">
            <div className="relative">
              <AppIcon name="search" size={14} className="absolute left-3 top-2.5 text-text-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-3 outline-none focus:border-navy"
              />
            </div>

            <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-0.5">
              {isLoadingLeads ? (
                <SkeletonList rows={6} avatar />
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((l) => {
                  const isSelected = selectedLead?.id === l.id
                  return (
                    <div
                      key={l.id}
                      onClick={() => handleSelectLead(l)}
                      className={`min-w-0 space-y-1 rounded-xl border p-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-surface border-border shadow-xs ring-1 ring-border'
                          : 'bg-surface hover:bg-surface-1 border-transparent'
                      }`}
                    >
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-1.5">
                        <h4 className="min-w-0 flex-1 truncate text-xs font-bold text-text">{l.name}</h4>
                        {getStagePill(l.stage)}
                      </div>
                      <div className="truncate text-[10.5px] font-medium text-text-3">
                        {l.phone || 'No phone'} - {l.source || 'Direct'}
                      </div>
                      <div className="truncate text-[10.5px] font-medium text-text-3">
                        {l.assigned || 'Unassigned'} - <span className="font-bold text-text">{l.value || 'NGN 0'}</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <EmptyState
                  title="No leads found"
                  description="Register a lead to start building a client activity file."
                  icon="ti-user-plus"
                  compact
                  action={
                    <button
                      type="button"
                      onClick={() => navigate({ to: '/new-lead' })}
                      className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-navy-dark"
                    >
                      Register lead
                    </button>
                  }
                />
              )}
            </div>
          </div>

          {/* Column 2 & 3: Client Overview & Follow-up Activity Log */}
          {isLoadingLeads ? (
            <div className="xl:col-span-2 2xl:col-span-2">
              <div className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                  <SkeletonDetail />
                  <SkeletonList rows={4} />
                </div>
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                  <SkeletonForm fields={5} />
                </div>
              </div>
            </div>
          ) : selectedLead ? (
            <>
              {/* Column 2: Client Overview & Complete Activity Timeline */}
              <div className="min-w-0 space-y-4">
                {/* Selected Lead Overview Header Box */}
                <div className="min-w-0 space-y-3 rounded-2xl border border-border bg-surface p-3 shadow-xs sm:p-4">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white text-sm font-extrabold">
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-text truncate">{selectedLead.name}</h3>
                        {getStagePill(selectedLead.stage)}
                        {getDivBadge(selectedLead.div)}
                      </div>
                      <div className="mt-0.5 break-words text-[11px] font-medium text-text-3">
                        Phone: {selectedLead.phone || 'N/A'} - {selectedAssigneeDisplay}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditPanel(selectedLead)}
                      disabled={!selectedLeadHasBackendId}
                      title={selectedLeadHasBackendId ? 'Edit lead' : 'This lead has not been confirmed by the backend yet.'}
                      className="flex w-full items-center justify-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition-all hover:bg-surface-1 active:scale-95 disabled:opacity-50 sm:w-auto sm:shrink-0"
                    >
                      <AppIcon name="edit" size={14} /> Edit
                    </button>
                  </div>

              {/* 6 Key Detail Metric Grid Boxes */}
              <div className="grid min-w-0 grid-cols-1 gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-surface-1/60 border border-border/60 rounded-xl p-2.5">
                  <div className="text-[10px] font-medium text-text-3">Source</div>
                  <div className="mt-0.5 break-words text-xs font-bold text-text">{selectedLead.source || 'Referral'}</div>
                </div>

                <div className="bg-surface-1/60 border border-border/60 rounded-xl p-2.5">
                  <div className="text-[10px] font-medium text-text-3">Campaign</div>
                  <div className="mt-0.5 break-words text-xs font-bold text-text">{selectedLead.campaign || '-'}</div>
                </div>

                <div className="bg-surface-1/60 border border-border/60 rounded-xl p-2.5">
                  <div className="text-[10px] font-medium text-text-3">Deal value</div>
                  <div className="mt-0.5 break-words text-xs font-bold text-text">{selectedLead.value}</div>
                </div>

                <div className="bg-surface-1/60 border border-border/60 rounded-xl p-2.5">
                  <div className="text-[10px] font-medium text-text-3">Budget</div>
                  <div className="mt-0.5 break-words text-xs font-bold text-text">{selectedLead.budget || 'NGN 25M - NGN 35M'}</div>
                </div>

                <div className="bg-surface-1/60 border border-border/60 rounded-xl p-2.5">
                  <div className="text-[10px] font-medium text-text-3">Next action</div>
                  <div className="mt-0.5 break-words text-xs font-bold text-text">{selectedLead.nextAction || 'Not set'}</div>
                </div>

                <div className="bg-surface-1/60 border border-border/60 rounded-xl p-2.5">
                  <div className="text-[10px] font-medium text-text-3">Next follow-up</div>
                  <div className="mt-0.5 break-words text-xs font-bold text-text">Not set</div>
                </div>
              </div>
            </div>

            {/* Complete Activity Timeline Card */}
            <div className="min-w-0 space-y-3 rounded-2xl border border-border bg-surface p-3 shadow-xs sm:p-4">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2">
                <h3 className="text-sm font-bold text-text">Complete activity timeline</h3>
                <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {pluralize(selectedLead.activities.length, 'activity', 'activities')}
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {isLoadingActivities && <SkeletonList rows={4} />}
                {!isLoadingActivities && !selectedLeadHasBackendId && (
                  <EmptyState
                    title="Activities unavailable"
                    description="Activities load after the lead is confirmed by the backend."
                    icon="ti-info-circle"
                    compact
                  />
                )}
                {!isLoadingActivities && selectedLeadHasBackendId && selectedLead.activities.length === 0 && (
                  <EmptyState
                    title="No activities yet"
                    description="Log the first call, WhatsApp message, meeting, or follow-up for this lead."
                    icon="ti-message-circle"
                    compact
                  />
                )}
                {!isLoadingActivities && selectedLeadHasBackendId && selectedLead.activities.map((act, i) => (
                  <div key={act.id || i} className="flex items-start gap-3 text-xs">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] mt-0.5 ${i === 1 ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-blue-500 text-blue-600 bg-blue-50'}`}>
                      {i === 1 ? '✓' : '○'}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="break-words font-bold text-text">{act.t}</div>
                      <div className="break-words text-[10.5px] font-medium text-text-3">{act.m}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openActivityEdit(act)}
                      disabled={!act.id}
                      title={act.id ? 'Edit activity' : 'This activity has no backend ID.'}
                      className="shrink-0 rounded-lg border border-border bg-surface px-2 py-1 text-[10.5px] font-semibold text-text-3 hover:bg-surface-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Log a Follow-up Activity Form */}
          <div className="min-w-0 space-y-3 rounded-2xl border border-border bg-surface p-3 shadow-xs sm:p-4 xl:col-span-2 2xl:col-span-1">
            <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">
              Log a follow-up activity
            </h3>

            <div className="space-y-3">
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">Channel / activity</label>
                  <Select options={ACTIVITY_TYPE_OPTIONS} value={actType} onChange={setActType} fullWidth />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">Outcome</label>
                  <Select options={OUTCOME_OPTIONS} value={actOutcome} onChange={setActOutcome} fullWidth />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-2 mb-1">Conversation / activity details</label>
                <textarea
                  value={actNotes}
                  onChange={(e) => setActNotes(e.target.value)}
                  placeholder="Record what was discussed, objections, commitments, documents sent and decision-maker information..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-3 outline-none focus:border-navy resize-none"
                />
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">Next follow-up date</label>
                  <input
                    type="date"
                    value={actNextDate}
                    onChange={(e) => setActNextDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">Move pipeline stage</label>
                  <Select options={PIPELINE_STAGE_OPTIONS} value={actStage} onChange={setActStage} fullWidth />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-2 mb-1">Next action</label>
                <input
                  type="text"
                  value={actNext}
                  onChange={(e) => setActNext(e.target.value)}
                  placeholder="e.g. Send payment plan and call by 10 AM"
                  className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-3 outline-none focus:border-navy"
                />
              </div>

              <button
                type="button"
                onClick={handleLogActivity}
                disabled={isSavingActivity || !selectedLeadHasBackendId}
                className="w-full py-2.5 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95 flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {isSavingActivity ? <BusyLabel>Saving...</BusyLabel> : <><AppIcon name="plus" size={14} /> Save activity and next action</>}
              </button>

              <button
                type="button"
                onClick={() => navigate({ to: '/handoff' })}
                className="w-full py-2.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-1 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <AppIcon name="corner-down-right" size={14} /> Create documentation / allocation handoff
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="xl:col-span-2 2xl:col-span-2">
          <EmptyState
            title="No lead selected"
            description="Select a lead on the left or register a new one to open the activity journal."
            icon="ti-user-search"
            action={
              <button
                type="button"
                onClick={() => navigate({ to: '/new-lead' })}
                className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-navy-dark"
              >
                Register lead
              </button>
            }
          />
        </div>
      )}
        </div>
      </div>

      {/* Edit Lead Slide-out Panel */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[9998] flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsEditOpen(false)}
          />

          {/* Panel */}
          <div className="w-full max-w-sm bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h3 className="text-sm font-bold text-text">Edit Lead</h3>
                <p className="text-[11px] text-text-3 font-medium mt-0.5">{selectedLead?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-1 text-text-3 transition-all active:scale-95"
              >
                <AppIcon name="x" size={14} />
              </button>
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">First name</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">Last name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-2 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-2 mb-1">Interested services</label>
                <input
                  type="text"
                  value={editInterests}
                  onChange={(e) => setEditInterests(e.target.value)}
                  placeholder="e.g. Real estate, construction..."
                  className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-3 outline-none focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">Lead source</label>
                  <Select options={LEAD_SOURCE_OPTIONS} value={editSource} onChange={setEditSource} fullWidth />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">Stage</label>
                  <Select options={LEAD_STAGE_OPTIONS} value={editStatus} onChange={setEditStatus} fullWidth />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-2 mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add any notes about this lead..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-3 outline-none focus:border-navy resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex-1 py-2.5 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSavingEdit ? <BusyLabel>Saving...</BusyLabel> : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-1 transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={Boolean(editingActivityId)} onClose={closeActivityEdit} title="Edit activity">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold text-text-2 mb-1">Channel / activity</label>
              <Select options={ACTIVITY_TYPE_OPTIONS} value={editActType} onChange={setEditActType} fullWidth />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-2 mb-1">Outcome</label>
              <Select options={OUTCOME_OPTIONS} value={editActOutcome} onChange={setEditActOutcome} fullWidth />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-2 mb-1">Activity details</label>
            <textarea
              value={editActNotes}
              onChange={(e) => setEditActNotes(e.target.value)}
              rows={4}
              className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy resize-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold text-text-2 mb-1">Next follow-up date</label>
              <input
                type="date"
                value={editActNextDate}
                onChange={(e) => setEditActNextDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-2 mb-1">Next action</label>
              <input
                value={editActNext}
                onChange={(e) => setEditActNext(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button type="button" onClick={closeActivityEdit} disabled={isSavingActivityEdit} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1 disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleSaveActivityEdit} disabled={isSavingActivityEdit || !editActNotes.trim()} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSavingActivityEdit ? <BusyLabel>Saving...</BusyLabel> : 'Save activity'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
