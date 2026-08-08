import { useState, useMemo } from 'react'
import { useStore } from '../../context/StoreContext'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Avatar, BusyLabel, EmptyState, Modal, Select, Topbar } from '../shared'
import { money, divLabel, leadDerived } from '../../data/helpers'
import type { Stage } from '../../data/types'
import { ArrowLeft, Calendar, MessageAdd, Call, Send2 } from 'iconsax-react'
import { useToast } from '../../context/ToastContext'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import { transformBackendLead, transformBackendLeadActivity } from '../../services/transformers/marketingTransformers'

import { pluralize } from '../../utils/formatters'

const STAGE_OPTIONS: Stage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const QUICK_ACTIVITY_TYPES = {
  note: { label: 'Log Note', activityType: 'Phone Call' },
  call: { label: 'Log Voice Call', activityType: 'Phone Call' },
  whatsapp: { label: 'WhatsApp Note', activityType: 'WhatsApp' },
  meeting: { label: 'Schedule Meeting', activityType: 'Meeting' },
} as const

type QuickActivityKey = keyof typeof QUICK_ACTIVITY_TYPES

function normalizeChoice(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function dateToApiDateTime(value: string) {
  return value ? `${value}T09:00:00Z` : null
}

function hasBackendLeadId(value: string | undefined): value is string {
  return Boolean(value && /^\d+$/.test(String(value)))
}

export function LeadsDetailPage() {
  const { id } = useSearch({ from: '/leads-detail' })
  const { leads, setLeads } = useStore()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const lead = useMemo(() => leads.find((l) => l.id === id), [leads, id])

  const [logText, setLogText] = useState('')
  const [isChangingStage, setIsChangingStage] = useState(false)
  const [isSavingActivity, setIsSavingActivity] = useState(false)
  const [activityModal, setActivityModal] = useState<QuickActivityKey | null>(null)
  const [activityForm, setActivityForm] = useState({
    note: '',
    nextAction: '',
    nextFollowUp: '',
  })

  if (!lead) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Topbar
          title="Lead record not found"
          hidePeriod
          action={
            <button
              type="button"
              onClick={() => navigate({ to: '/pipeline' })}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-navy px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-navy-dark"
            >
              <ArrowLeft size={15} color="currentColor" variant="Outline" />
              <span className="truncate">Return to Pipeline</span>
            </button>
          }
        />
        <EmptyState
          title="Lead record not found"
          description="This lead is not available in the local lead store. Return to the pipeline and select an active lead."
          icon="ti-user-question"
          action={
        <button
          type="button"
          onClick={() => navigate({ to: '/pipeline' })}
          className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-navy-dark transition-all"
        >
          Return to Pipeline
        </button>
          }
        />
      </div>
    )
  }

  const derived = leadDerived(lead)

  const selectedQuickActivity = activityModal ? QUICK_ACTIVITY_TYPES[activityModal] : null
  const selectedLeadHasBackendId = hasBackendLeadId(lead.id)

  const openActivityModal = (type: QuickActivityKey, note = '') => {
    if (!selectedLeadHasBackendId) {
      showToast('Select a backend lead before logging activities.', 'error')
      return
    }
    setActivityModal(type)
    setActivityForm({ note, nextAction: '', nextFollowUp: '' })
  }

  const closeActivityModal = () => {
    if (isSavingActivity) return
    setActivityModal(null)
    setActivityForm({ note: '', nextAction: '', nextFollowUp: '' })
  }

  const handleLog = () => {
    if (!logText.trim()) return
    openActivityModal('note', logText.trim())
  }

  const handleSaveActivity = async () => {
    if (!selectedQuickActivity || !activityForm.note.trim()) {
      showToast('Please enter activity details.', 'error')
      return
    }
    if (!selectedLeadHasBackendId) {
      showToast('Select a backend lead before logging activities.', 'error')
      return
    }

    setIsSavingActivity(true)
    try {
      const res = await marketingService.logLeadActivity(lead.id, {
        activity_type: normalizeChoice(selectedQuickActivity.activityType),
        note: activityForm.note.trim(),
        next_action: activityForm.nextAction.trim(),
        next_follow_up_at: dateToApiDateTime(activityForm.nextFollowUp),
      })

      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not save activity'), 'error')
        return
      }

      const activity = transformBackendLeadActivity(res.data)
      const updatedLead = {
        ...lead,
        activities: [activity, ...lead.activities],
      }
      setLeads(leads.map((item) => (item.id === lead.id ? updatedLead : item)))
      setLogText('')
      setActivityModal(null)
      setActivityForm({ note: '', nextAction: '', nextFollowUp: '' })
      showToast('Activity logged.', 'success')
    } catch (err: unknown) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not save activity'), 'error')
    } finally {
      setIsSavingActivity(false)
    }
  }

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value as Stage
    if (!selectedLeadHasBackendId) {
      showToast('Select a backend lead before updating stage.', 'error')
      return
    }
    setIsChangingStage(true)
    try {
      const res = await marketingService.updateLeadStage(lead.id, newStage)
      if (res.data) {
        const updated = transformBackendLead(res.data)
        setLeads(leads.map((l) => (l.id === lead.id ? updated : l)))
        showToast('Lead stage updated.', 'success')
      } else {
        showToast(parseApiError(res.error || 'Could not update lead stage'), 'error')
      }
    } catch (err: unknown) {
      showToast(parseApiError(err instanceof Error ? err.message : 'Could not update lead stage'), 'error')
    } finally {
      setIsChangingStage(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 md:p-8 min-h-0">
      <Topbar
        title={`360 Prospect Profile: ${lead.name}`}
        hidePeriod
        action={
          <div className="flex min-w-0 flex-1 flex-col gap-2 min-[520px]:flex-row min-[520px]:items-center">
          <button
            type="button"
            onClick={() => navigate({ to: '/pipeline' })}
            className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text transition-all hover:bg-surface-1"
          >
            <ArrowLeft size={15} color="currentColor" variant="Outline" />
            <span className="truncate">Back to Pipeline</span>
          </button>

          <div className="flex min-w-0 items-center gap-2">
          <span className="hidden text-xs font-bold text-text-3 sm:inline">Pipeline Stage:</span>
          <Select
            options={STAGE_OPTIONS.map((s) => ({
              value: s,
              label: `${s.charAt(0).toUpperCase() + s.slice(1)} Stage`,
            }))}
            value={lead.stage}
            onChange={(val) => {
              const e = { target: { value: val } } as React.ChangeEvent<HTMLSelectElement>
              void handleStageChange(e)
            }}
            disabled={isChangingStage}
            size="sm"
          />
          </div>
          </div>
        }
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left Side: Lead Metadata Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <div className="flex flex-col items-center gap-3 pb-4 border-b border-border/80">
              <Avatar name={lead.name} bg={lead.color} color={lead.tc} size="lg" />
              <div className="text-center">
                <span className="text-base font-bold text-text block">{lead.name}</span>
                <span className="text-xs font-mono font-semibold text-navy bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 mt-1 inline-block">{lead.id}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-3 font-medium">Contact Phone</span>
                <span className="font-bold text-text font-mono">{lead.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-3 font-medium">Division</span>
                <span className="font-bold text-navy">{divLabel(lead.div)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-3 font-medium">Attribution Source</span>
                <span className="font-semibold text-text">{lead.source}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-3 font-medium">Campaign Tag</span>
                <span className="font-semibold text-text">{lead.campaign}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-3 font-medium">Stated Budget</span>
                <span className="font-semibold text-text">{lead.budget}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-3 font-medium">Estimated Deal Value</span>
                <span className="font-bold text-emerald-600">{money(lead.value)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-3 font-medium">Assigned Representative</span>
                <span className="font-bold text-text">{lead.assigned}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-3 font-medium">Priority Index</span>
                <span className={`font-extrabold px-2 py-0.5 rounded ${derived.priority === 'Hot' ? 'text-rose-600 bg-rose-50 border border-rose-200' : derived.priority === 'Warm' ? 'text-amber-600 bg-amber-50 border border-amber-200' : 'text-slate-600 bg-slate-50 border border-slate-200'}`}>{derived.priority}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-3 font-medium">Qualifying Score</span>
                <span className="font-bold text-navy bg-navy/10 px-2 py-0.5 rounded">{derived.score}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Activity Timeline & Logging */}
        <div className="lg:col-span-2 space-y-5">
          {/* Timeline Feed */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold text-text">Activity Audit & Interaction History</h3>
              <span className="text-xs font-extrabold text-navy bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {pluralize(lead.activities.length, 'Entry', 'Entries')}
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {lead.activities.length === 0 && (
                <EmptyState
                  title="No activities yet"
                  description="Log the first touchpoint or follow-up note for this lead."
                  icon="ti-message-circle"
                  compact
                />
              )}
              {lead.activities.map((a, i) => (
                <div key={i} className="flex gap-3 border-l-2 border-navy/30 pl-3.5 py-1">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-xs font-bold text-text">{a.t}</span>
                    <span className="text-[11px] font-semibold text-text-3">{a.m}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Logger */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">Log Touchpoint & Follow-Up Note</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="e.g. Call completed — Client confirmed site inspection for Saturday at 10 AM"
                className="flex-1 rounded-xl border border-border bg-surface-1 px-3.5 py-2.5 text-xs text-text focus:outline-none focus:border-navy"
                onKeyDown={(e) => e.key === 'Enter' && handleLog()}
              />
              <button
                type="button"
                onClick={handleLog}
                disabled={!logText.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-navy-dark transition-all disabled:opacity-50"
              >
                <Send2 size={14} color="currentColor" variant="Outline" /> Log Note
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={() => openActivityModal('call')} disabled={!selectedLeadHasBackendId} className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-1 px-3 py-1.5 text-xs font-bold text-text hover:bg-surface-2 transition-all disabled:cursor-not-allowed disabled:opacity-50">
                <Call size={14} variant="Outline" className="text-navy" /> Log Voice Call
              </button>
              <button type="button" onClick={() => openActivityModal('whatsapp')} disabled={!selectedLeadHasBackendId} className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-1 px-3 py-1.5 text-xs font-bold text-text hover:bg-surface-2 transition-all disabled:cursor-not-allowed disabled:opacity-50">
                <MessageAdd size={14} variant="Outline" className="text-emerald-600" /> WhatsApp Note
              </button>
              <button type="button" onClick={() => openActivityModal('meeting')} disabled={!selectedLeadHasBackendId} className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-1 px-3 py-1.5 text-xs font-bold text-text hover:bg-surface-2 transition-all disabled:cursor-not-allowed disabled:opacity-50">
                <Calendar size={14} variant="Outline" className="text-amber-600" /> Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={Boolean(activityModal)}
        onClose={closeActivityModal}
        title={selectedQuickActivity?.label || 'Log activity'}
        footer={
          <>
            <button
              type="button"
              onClick={closeActivityModal}
              disabled={isSavingActivity}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text hover:bg-surface-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveActivity}
              disabled={isSavingActivity || !activityForm.note.trim()}
              className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50"
            >
              {isSavingActivity ? <BusyLabel>Saving...</BusyLabel> : 'Save activity'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-3">Activity type</label>
            <input
              value={selectedQuickActivity?.activityType || ''}
              readOnly
              className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs font-semibold text-text"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-3">Details</label>
            <textarea
              value={activityForm.note}
              onChange={(e) => setActivityForm({ ...activityForm, note: e.target.value })}
              rows={4}
              placeholder="Record the call, WhatsApp note, meeting schedule, or next context."
              className="w-full resize-none rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-text outline-none focus:border-navy"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-3">Next action</label>
              <input
                value={activityForm.nextAction}
                onChange={(e) => setActivityForm({ ...activityForm, nextAction: e.target.value })}
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-text outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-3">Next follow-up</label>
              <input
                type="date"
                value={activityForm.nextFollowUp}
                onChange={(e) => setActivityForm({ ...activityForm, nextFollowUp: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-text outline-none focus:border-navy"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
