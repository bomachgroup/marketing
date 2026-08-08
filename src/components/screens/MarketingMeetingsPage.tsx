import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppIcon } from '../../components/shared/AppIcon'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonList, Topbar, Select } from '../shared'
import { useToast } from '../../context/ToastContext'
import {
  marketingService,
  type BackendMarketingMeetingCreate,
  type BackendMarketingMeetingActionCreate,
  type BackendMarketingMeetingDecisionCreate,
} from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import { pluralize } from '../../utils/formatters'
import NoPermissionPage from '../layout/NoPermissionPage'
import {
  transformMeetings,
  type MeetingActionRow,
  type MeetingDecisionRow,
  type MeetingRow,
} from '../../services/transformers/marketingTransformers'

type MeetingTab = 'meetings' | 'actions' | 'decisions'
type Choice = [string, string]

const emptyForm = {
  title: '',
  agenda: '',
  meetingDate: '',
  meetingTime: '',
  durationMinutes: '60',
  status: 'scheduled',
  locationType: 'physical',
  location: '',
  notes: '',
  meetingType: 'general_marketing',
  facilitator: '',
  recorder: '',
  preRead: '',
  expectedOutcome: '',
}

const emptyActionForm = {
  meetingId: '',
  title: '',
  description: '',
  ownerName: '',
  dueDate: '',
  priority: 'medium',
}

const emptyDecisionForm = {
  meetingId: '',
  decision: '',
  owner: '',
  approver: '',
  reason: '',
  decisionDate: '',
}

const DEFAULT_STATUS_OPTIONS: Choice[] = [['scheduled', 'Scheduled'], ['completed', 'Completed'], ['cancelled', 'Cancelled']]
const DEFAULT_LOCATION_OPTIONS: Choice[] = [['physical', 'Physical'], ['virtual', 'Virtual'], ['hybrid', 'Hybrid']]
const DEFAULT_MEETING_TYPE_OPTIONS: Choice[] = [
  ['general_marketing', 'General marketing'],
  ['campaign_review', 'Campaign review'],
  ['content_review', 'Content review'],
  ['partnership_review', 'Partnership review'],
]

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (key.includes('complete')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (key.includes('cancel')) return 'bg-rose-50 text-rose-800 border-rose-200'
  if (key.includes('schedule') || key.includes('upcoming')) return 'bg-blue-50 text-blue-900 border-blue-200'
  return 'bg-surface-1 text-text-3 border-border'
}

export function MarketingMeetingsPage() {
  const [period, setPeriod] = useState('week')
  const [activeTab, setActiveTab] = useState<MeetingTab>('meetings')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [meetings, setMeetings] = useState<MeetingRow[]>([])
  const [statusOptions] = useState<Choice[]>(DEFAULT_STATUS_OPTIONS)
  const [locationOptions] = useState<Choice[]>(DEFAULT_LOCATION_OPTIONS)
  const [showModal, setShowModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [actionForm, setActionForm] = useState(emptyActionForm)
  const [decisionForm, setDecisionForm] = useState(emptyDecisionForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const { showToast } = useToast()

  async function loadMeetings() {
    setIsLoading(true)
    setApiError('')
    try {
      const meetingRes = await marketingService.getMarketingMeetings({
        limit: 100,
        search,
        status: statusFilter,
      })

      if (meetingRes.data) setMeetings(transformMeetings(meetingRes.data))
      else {
        setMeetings([])
        setApiError(parseApiError(meetingRes.error || 'Could not load meetings'))
      }
    } catch (err) {
      setMeetings([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMeetings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter])

  const metrics = useMemo(() => {
    const upcoming = meetings.filter((meeting) => /schedule|upcoming/i.test(meeting.status)).length
    const completed = meetings.filter((meeting) => /complete/i.test(meeting.status)).length
    const notes = meetings.filter((meeting) => meeting.notes).length
    return [
      { label: 'Upcoming meetings', value: upcoming, foot: 'Scheduled backend rows' },
      { label: 'Completed meetings', value: completed, foot: 'Minutes archive' },
      { label: 'Meetings with notes', value: notes, foot: 'Meeting notes field' },
      { label: 'Total meetings', value: meetings.length, foot: 'Backend meetings in view' },
    ]
  }, [meetings])

  const actionRows = useMemo<MeetingActionRow[]>(
    () => meetings.flatMap((meeting) => meeting.actions),
    [meetings],
  )

  const decisionRows = useMemo<MeetingDecisionRow[]>(
    () => meetings.flatMap((meeting) => meeting.decisions),
    [meetings],
  )

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(meeting: MeetingRow, markComplete = false) {
    if (!meeting.id) {
      showToast('This meeting has no backend ID.', 'error')
      return
    }
    setEditingId(meeting.id)
    setForm({
      title: meeting.title,
      agenda: meeting.agenda,
      meetingDate: meeting.dateValue,
      meetingTime: meeting.timeValue,
      durationMinutes: String(parseInt(meeting.duration, 10) || 60),
      status: markComplete ? 'completed' : meeting.status.toLowerCase().replace(/\s+/g, '_'),
      locationType: meeting.locationType.toLowerCase().replace(/\s+/g, '_'),
      location: meeting.location === 'Location not recorded' ? '' : meeting.location,
      notes: meeting.notes,
      meetingType: meeting.meetingType.toLowerCase().replace(/\s+/g, '_'),
      facilitator: meeting.facilitator || (meeting.organizer === 'Organizer not recorded' ? '' : meeting.organizer),
      recorder: meeting.recorder,
      preRead: meeting.preRead,
      expectedOutcome: meeting.expectedOutcome,
    })
    setShowModal(true)
  }

  function payloadFromForm(): BackendMarketingMeetingCreate | null {
    const duration = Number(form.durationMinutes || 0)
    if (!form.title.trim() || !form.agenda.trim() || !form.meetingDate || !form.meetingTime || !Number.isFinite(duration) || duration <= 0) {
      showToast('Please enter title, agenda, date, time and a valid duration', 'error')
      return null
    }

    return {
      title: form.title.trim(),
      agenda: form.agenda.trim(),
      meeting_date: form.meetingDate,
      meeting_time: form.meetingTime,
      duration_minutes: duration,
      status: form.status,
      location_type: form.locationType,
      location: form.location.trim() || null,
      attendee_ids: [],
      notes: form.notes.trim() || null,
      meeting_type: form.meetingType,
      facilitator: form.facilitator.trim() || null,
      recorder: form.recorder.trim() || null,
      pre_read: form.preRead.trim() || null,
      expected_outcome: form.expectedOutcome.trim() || null,
    }
  }

  async function handleSaveMeeting() {
    const payload = payloadFromForm()
    if (!payload) return

    setIsSaving(true)
    try {
      const res = editingId
        ? await marketingService.updateMarketingMeeting(editingId, payload)
        : await marketingService.createMarketingMeeting(payload)
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not save meeting'), 'error')
        return
      }

      showToast(editingId ? 'Meeting updated.' : 'Meeting scheduled.', 'success')
      setShowModal(false)
      setEditingId(null)
      setForm(emptyForm)
      await loadMeetings()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCancelMeeting(meeting: MeetingRow) {
    if (!meeting.id) {
      showToast('This meeting has no backend ID.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.updateMarketingMeeting(meeting.id, { status: 'cancelled' })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not cancel meeting'), 'error')
        return
      }
      showToast('Meeting cancelled.', 'success')
      await loadMeetings()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  function openAction(meeting: MeetingRow) {
    if (!meeting.id) {
      showToast('This meeting has no backend ID.', 'error')
      return
    }
    setActionForm({ ...emptyActionForm, meetingId: String(meeting.id) })
    setShowActionModal(true)
  }

  function openDecision(meeting: MeetingRow) {
    if (!meeting.id) {
      showToast('This meeting has no backend ID.', 'error')
      return
    }
    setDecisionForm({ ...emptyDecisionForm, meetingId: String(meeting.id) })
    setShowDecisionModal(true)
  }

  function actionPayloadFromForm(): BackendMarketingMeetingActionCreate | null {
    if (!actionForm.meetingId || !actionForm.title.trim()) {
      showToast('Choose a meeting and enter an action title', 'error')
      return null
    }
    return {
      title: actionForm.title.trim(),
      description: actionForm.description.trim() || null,
      owner_name: actionForm.ownerName.trim() || null,
      due_date: actionForm.dueDate || null,
      priority: actionForm.priority,
      status: 'open',
    }
  }

  async function handleSaveAction() {
    const payload = actionPayloadFromForm()
    if (!payload) return
    setIsSaving(true)
    try {
      const res = await marketingService.createMarketingMeetingAction(actionForm.meetingId, payload)
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not add action item'), 'error')
        return
      }
      showToast('Action item added.', 'success')
      setShowActionModal(false)
      setActionForm(emptyActionForm)
      await loadMeetings()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCompleteAction(action: MeetingActionRow) {
    if (!action.id) {
      showToast('This action item has no backend ID.', 'error')
      return
    }
    setIsSaving(true)
    try {
      const res = await marketingService.updateMarketingMeetingAction(action.id, { status: 'done' })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not update action item'), 'error')
        return
      }
      showToast('Action item updated.', 'success')
      await loadMeetings()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  function decisionPayloadFromForm(): BackendMarketingMeetingDecisionCreate | null {
    if (!decisionForm.meetingId || !decisionForm.decision.trim()) {
      showToast('Choose a meeting and enter the decision', 'error')
      return null
    }
    return {
      decision: decisionForm.decision.trim(),
      decision_date: decisionForm.decisionDate || null,
      owner: decisionForm.owner.trim() || null,
      approver: decisionForm.approver.trim() || null,
      reason: decisionForm.reason.trim() || null,
    }
  }

  async function handleSaveDecision() {
    const payload = decisionPayloadFromForm()
    if (!payload) return
    setIsSaving(true)
    try {
      const res = await marketingService.createMarketingMeetingDecision(decisionForm.meetingId, payload)
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not record decision'), 'error')
        return
      }
      showToast('Decision recorded.', 'success')
      setShowDecisionModal(false)
      setDecisionForm(emptyDecisionForm)
      await loadMeetings()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleExport() {
    setIsSaving(true)
    try {
      const res = await marketingService.exportMarketingMeetings({
        limit: 100,
        search,
        status: statusFilter,
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not export meetings'), 'error')
        return
      }
      const response = res.data as Record<string, unknown>
      const data = (response.data && typeof response.data === 'object' ? response.data : response) as Record<string, unknown>
      const url = data.url || data.file_url || data.download_url
      if (url) {
        window.open(String(url), '_blank', 'noopener,noreferrer')
      }
      showToast('Meeting export requested.', 'success')
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="marketing-meetings" />
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Marketing meetings & decisions" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1 rounded-2xl border border-border bg-surface p-3.5 shadow-xs">
              <div className="text-[11px] font-medium text-text-3">{metric.label}</div>
              <div className="text-xl font-extrabold tracking-tight text-text">{metric.value}</div>
              <div className="text-[10px] font-medium text-text-3">{metric.foot}</div>
            </div>
          ))}
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadMeetings} compact /> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings..."
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface p-2 text-xs text-text outline-none placeholder:text-text-3 focus:border-navy sm:min-w-[220px]"
            />
            <Select
              options={[
                { value: 'all', label: 'All meetings' },
                ...statusOptions.map(([val, lbl]) => ({ value: val, label: lbl })),
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              size="sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 disabled:opacity-50"
            >
              <AppIcon name="download" size={14} /> Export
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-xl bg-navy px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95"
            >
              <AppIcon name="calendar" size={14} /> Schedule meeting
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-border/80 pb-1">
          {[
            ['meetings', 'Meetings'],
            ['actions', 'Open action items'],
            ['decisions', 'Decision register'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as MeetingTab)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === key ? 'border border-border bg-surface text-text shadow-xs' : 'text-text-3 hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'meetings' && (
          <div className="space-y-4">
            {isLoading ? (
              <SkeletonList rows={4} />
            ) : meetings.length === 0 ? (
              <EmptyState title="No meetings" description="No meetings were returned." icon="ti-calendar-event" />
            ) : meetings.map((meeting) => (
              <div key={String(meeting.id || meeting.title)} className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusClass(meeting.status)}`}>
                        {meeting.status}
                      </span>
                      <span className="rounded border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-text-3">
                        {meeting.locationType}
                      </span>
                    </div>

                    <h3 className="truncate text-sm font-bold text-text">{meeting.title}</h3>
                    <div className="text-[10.5px] font-medium text-text-3">
                      {meeting.date} at {meeting.time} - {meeting.duration} - {meeting.location}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => openEdit(meeting)} disabled={isSaving || !meeting.id} className="rounded border border-border p-1 text-text-3 hover:text-text disabled:opacity-50">
                      <AppIcon name="edit" size={14} />
                    </button>
                    <button type="button" onClick={() => void handleCancelMeeting(meeting)} disabled={isSaving || !meeting.id} className="rounded border border-border p-1 text-text-3 hover:text-rose-600 disabled:opacity-50">
                      <AppIcon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-medium text-text-2">
                  <div><b className="text-text">Agenda:</b> {meeting.agenda}</div>
                  <div><b className="text-text">Organizer:</b> {meeting.organizer}</div>
                  <div><b className="text-text">Attendees:</b> {meeting.attendees || pluralize(meeting.attendeeCount, 'attendee')}</div>
                </div>

                {meeting.notes && (
                  <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-xs text-blue-900">
                    <b className="font-bold">Notes:</b> {meeting.notes}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openEdit(meeting, true)}
                    disabled={isSaving || !meeting.id}
                    className="flex items-center gap-1 rounded-lg bg-navy px-3 py-1 text-[10.5px] font-bold text-white shadow-xs transition-all hover:bg-navy-dark disabled:opacity-50"
                  >
                    <AppIcon name="file-text" size={14} /> Record minutes
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction(meeting)}
                    disabled={isSaving || !meeting.id}
                    className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1 text-[10.5px] font-bold text-text hover:bg-surface-1 disabled:opacity-50"
                  >
                    <AppIcon name="plus" size={14} /> Add action
                  </button>
                  <button
                    type="button"
                    onClick={() => openDecision(meeting)}
                    disabled={isSaving || !meeting.id}
                    className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1 text-[10.5px] font-bold text-text hover:bg-surface-1 disabled:opacity-50"
                  >
                    <AppIcon name="checklist" size={14} /> Record decision
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
            {isLoading ? (
              <SkeletonList rows={4} />
            ) : actionRows.length ? (
              <div className="space-y-2">
                {actionRows.map((action) => (
                  <div key={String(action.id || `${action.meetingTitle}-${action.title}`)} className="flex flex-col gap-2 rounded-xl border border-border bg-surface-1 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${statusClass(action.status)}`}>{action.status}</span>
                        <span className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] font-bold text-text-3">{action.priority}</span>
                      </div>
                      <div className="mt-1 truncate text-xs font-bold text-text">{action.title}</div>
                      <div className="mt-0.5 text-[10.5px] font-medium text-text-3">{action.meetingTitle} - {action.owner} - Due {action.dueDate}</div>
                      {action.description && <p className="mt-1 text-[11px] font-medium text-text-2">{action.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCompleteAction(action)}
                      disabled={isSaving || !action.id || /done|complete/i.test(action.status)}
                      className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-[10.5px] font-bold text-white hover:bg-navy-dark disabled:opacity-50"
                    >
                      Mark done
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No action items" description="No meeting action items were returned." icon="ti-list-check" compact />
            )}
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
            {isLoading ? (
              <SkeletonList rows={4} />
            ) : decisionRows.length ? (
              <div className="space-y-2">
                {decisionRows.map((decision) => (
                  <div key={String(decision.id || `${decision.meetingTitle}-${decision.decision}`)} className="rounded-xl border border-border bg-surface-1 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 truncate text-xs font-bold text-text">{decision.decision}</div>
                      <span className="text-[10.5px] font-semibold text-text-3">{decision.decisionDate}</span>
                    </div>
                    <div className="mt-1 text-[10.5px] font-medium text-text-3">{decision.meetingTitle} - {decision.owner} - {decision.approver}</div>
                    {decision.reason && <p className="mt-1 text-[11px] font-medium text-text-2">{decision.reason}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No decisions" description="No meeting decisions were returned." icon="ti-checklist" compact />
            )}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Update meeting' : 'Schedule meeting'}>
        <div className="space-y-3">
          <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Field label="Agenda" value={form.agenda} onChange={(value) => setForm({ ...form, agenda: value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Date" type="date" value={form.meetingDate} onChange={(value) => setForm({ ...form, meetingDate: value })} />
            <Field label="Time" type="time" value={form.meetingTime} onChange={(value) => setForm({ ...form, meetingTime: value })} />
            <Field label="Duration" type="number" value={form.durationMinutes} onChange={(value) => setForm({ ...form, durationMinutes: value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={statusOptions} />
            <SelectField label="Location type" value={form.locationType} onChange={(value) => setForm({ ...form, locationType: value })} options={locationOptions} />
          </div>
          <SelectField label="Meeting type" value={form.meetingType} onChange={(value) => setForm({ ...form, meetingType: value })} options={DEFAULT_MEETING_TYPE_OPTIONS} />
          <Field label="Location" value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Facilitator" value={form.facilitator} onChange={(value) => setForm({ ...form, facilitator: value })} />
            <Field label="Recorder" value={form.recorder} onChange={(value) => setForm({ ...form, recorder: value })} />
          </div>
          <Field label="Pre-read" value={form.preRead} onChange={(value) => setForm({ ...form, preRead: value })} />
          <Field label="Expected outcome" value={form.expectedOutcome} onChange={(value) => setForm({ ...form, expectedOutcome: value })} />
          <Field label="Notes / minutes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />

          <div className="flex justify-end gap-2 border-t border-border pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1">
              Cancel
            </button>
            <button type="button" onClick={() => void handleSaveMeeting()} disabled={isSaving} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : editingId ? 'Update meeting' : 'Schedule meeting'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showActionModal} onClose={() => setShowActionModal(false)} title="Add action item">
        <div className="space-y-3">
          <SelectField
            label="Meeting"
            value={actionForm.meetingId}
            onChange={(value) => setActionForm({ ...actionForm, meetingId: value })}
            options={meetings.filter((meeting) => meeting.id).map((meeting) => [String(meeting.id), meeting.title])}
          />
          <Field label="Action title" value={actionForm.title} onChange={(value) => setActionForm({ ...actionForm, title: value })} />
          <Field label="Description" value={actionForm.description} onChange={(value) => setActionForm({ ...actionForm, description: value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Owner name" value={actionForm.ownerName} onChange={(value) => setActionForm({ ...actionForm, ownerName: value })} />
            <Field label="Due date" type="date" value={actionForm.dueDate} onChange={(value) => setActionForm({ ...actionForm, dueDate: value })} />
          </div>
          <SelectField label="Priority" value={actionForm.priority} onChange={(value) => setActionForm({ ...actionForm, priority: value })} options={[['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]} />
          <div className="flex justify-end gap-2 border-t border-border pt-2">
            <button type="button" onClick={() => setShowActionModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1">
              Cancel
            </button>
            <button type="button" onClick={() => void handleSaveAction()} disabled={isSaving} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : 'Add action'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showDecisionModal} onClose={() => setShowDecisionModal(false)} title="Record decision">
        <div className="space-y-3">
          <SelectField
            label="Meeting"
            value={decisionForm.meetingId}
            onChange={(value) => setDecisionForm({ ...decisionForm, meetingId: value })}
            options={meetings.filter((meeting) => meeting.id).map((meeting) => [String(meeting.id), meeting.title])}
          />
          <Field label="Decision" value={decisionForm.decision} onChange={(value) => setDecisionForm({ ...decisionForm, decision: value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Owner" value={decisionForm.owner} onChange={(value) => setDecisionForm({ ...decisionForm, owner: value })} />
            <Field label="Approver" value={decisionForm.approver} onChange={(value) => setDecisionForm({ ...decisionForm, approver: value })} />
          </div>
          <Field label="Decision date" type="date" value={decisionForm.decisionDate} onChange={(value) => setDecisionForm({ ...decisionForm, decisionDate: value })} />
          <Field label="Reason" value={decisionForm.reason} onChange={(value) => setDecisionForm({ ...decisionForm, reason: value })} />
          <div className="flex justify-end gap-2 border-t border-border pt-2">
            <button type="button" onClick={() => setShowDecisionModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1">
              Cancel
            </button>
            <button type="button" onClick={() => void handleSaveDecision()} disabled={isSaving} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : 'Record decision'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-text-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-surface p-2 text-xs font-medium text-text outline-none focus:border-navy"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Choice[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-text-2">{label}</span>
      <Select
        options={options.map(([val, lbl]) => ({ value: val, label: lbl }))}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </label>
  )
}
