import { useEffect, useState } from 'react'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonKpiGrid, SkeletonList, Topbar, Select } from '../../shared'
import { useToast } from '../../../context/ToastContext'
import { marketingService } from '../../../services/api/marketingService'
import { parseApiError } from '../../../services/api/apiClient'
import { transformCsrcSupport, type CsrcInquiryRow } from '../../../services/transformers/marketingTransformers'
import { AppIcon } from '../../shared/AppIcon'

type SupportState = ReturnType<typeof transformCsrcSupport>

function periodRange(period: string) {
  const end = new Date()
  const start = new Date(end)
  if (period === 'month') start.setDate(end.getDate() - 29)
  else if (period === 'quarter') start.setDate(end.getDate() - 89)
  else start.setDate(end.getDate() - 6)
  return { date_from: start.toISOString().slice(0, 10), date_to: end.toISOString().slice(0, 10) }
}

function priorityClass(priority: string) {
  const key = priority.toLowerCase()
  if (key.includes('urgent') || key.includes('high')) return 'bg-rose-50 text-rose-800 border-rose-200'
  if (key.includes('medium')) return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-emerald-50 text-emerald-800 border-emerald-200'
}

export function SupportPage() {
  const [period, setPeriod] = useState('week')
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [support, setSupport] = useState<SupportState>(() => transformCsrcSupport({}))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const { showToast } = useToast()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    issue: '',
    source: 'website',
    priority: 'high',
  })

  async function loadSupport() {
    setIsLoading(true)
    setApiError('')
    try {
      const res = await marketingService.getCsrcInquiries(periodRange(period))
      if (res.data) {
        setSupport(transformCsrcSupport(res.data))
      } else if (res.error) {
        setSupport(transformCsrcSupport({}))
        setApiError(parseApiError(res.error))
      }
    } catch (err) {
      setSupport(transformCsrcSupport({}))
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadSupport())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  async function handleCreateTicket() {
    if (!form.name.trim() || !form.phone.trim() || !form.issue.trim()) {
      showToast('Please enter customer name, phone, and issue description', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.createCsrcInquiry({
        lead_name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        source: form.source,
        channel: form.source,
        inquiry_type: 'support',
        priority: form.priority,
        notes: form.issue.trim(),
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not create support inquiry'), 'error')
        return
      }

      showToast('Support inquiry created.', 'success')
      setShowNewTicketModal(false)
      setForm({ name: '', phone: '', email: '', issue: '', source: 'website', priority: 'high' })
      await loadSupport()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleResolve(ticket: CsrcInquiryRow) {
    if (!ticket.id) {
      showToast('This inquiry has no backend ID.', 'error')
      return
    }

    const res = await marketingService.updateCsrcInquiryStatus(ticket.id, { status: 'resolved' })
    if (res.data) {
      showToast('Support inquiry resolved.', 'success')
      await loadSupport()
    } else {
      showToast(parseApiError(res.error || 'Could not resolve inquiry'), 'error')
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Customer support" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="space-y-4">
          {apiError ? <ErrorState message={apiError} onRetry={loadSupport} compact /> : null}

          {isLoading ? (
            <SkeletonKpiGrid cards={3} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard label="Open inquiries" value={support.summary.total} tone="text-rose-600" />
              <MetricCard label="Avg. response time" value={`${support.summary.avgResponseTime} min`} foot="CSRC response average" />
              <MetricCard label="Pending follow-ups" value={support.summary.pendingFollowups} tone="text-emerald-600" />
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Active support inquiries</h3>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(true)}
                className="flex items-center gap-1 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-dark active:scale-95"
              >
                <AppIcon name="plus" size={14} /> New ticket
              </button>
            </div>

            {isLoading ? (
              <SkeletonList rows={5} avatar />
            ) : support.inquiries.length === 0 ? (
              <EmptyState title="No support inquiries" description="No support inquiries were returned." icon="ti-headset" compact />
            ) : (
              <div className="space-y-3">
                {support.inquiries.map((ticket) => (
                  <div key={String(ticket.id || ticket.leadName)} className="space-y-2.5 rounded-2xl border border-border/80 bg-surface p-3.5 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-xs text-rose-600">
                          <AppIcon name="alert-circle" size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="break-words text-xs font-bold text-text">
                            #{ticket.id} - {ticket.leadName}: {ticket.issue}
                          </h4>
                          <p className="mt-0.5 text-[10.5px] font-medium text-text-3">{ticket.meta}</p>
                        </div>
                      </div>

                      <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${priorityClass(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
                      <div className="flex items-center gap-1.5">
                        <button type="button" disabled className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-3 opacity-60">
                          <AppIcon name="message" size={14} /> Reply
                        </button>
                        <button
                          type="button"
                          disabled
                          title="No agent selector is available for escalation yet."
                          className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-3 opacity-60"
                        >
                          <AppIcon name="arrow-up" size={14} /> Escalate
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleResolve(ticket)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1 text-[11px] font-semibold text-white transition-all hover:bg-emerald-800 active:scale-95"
                      >
                        <AppIcon name="check" size={14} /> Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showNewTicketModal} onClose={() => setShowNewTicketModal(false)} title="Create Support Ticket">
        <div className="space-y-4">
          <Field label="Customer Full Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="e.g. Chief Kenneth Okafor" />
          <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="080..." />
          <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="Optional" />

          <div>
            <label className="mb-1 block text-xs font-bold text-text-2">Issue Description</label>
            <textarea
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              placeholder="Describe customer complaint or inquiry..."
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-surface p-2.5 text-xs text-text outline-none focus:border-navy"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-text-2">Source</label>
              <Select
                options={[
                  { value: 'website', label: 'Website' },
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'phone', label: 'Phone' },
                  { value: 'email', label: 'Email' },
                  { value: 'social_media', label: 'Social media' },
                ]}
                value={form.source}
                onChange={(val) => setForm({ ...form, source: val })}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-text-2">Priority</label>
              <Select
                options={[
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
                value={form.priority}
                onChange={(val) => setForm({ ...form, priority: val })}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-2">
            <button type="button" onClick={() => setShowNewTicketModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-text hover:bg-surface-1">Cancel</button>
            <button type="button" onClick={handleCreateTicket} disabled={isSaving} className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
              {isSaving ? <BusyLabel>Saving...</BusyLabel> : 'Create Ticket'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function MetricCard({ label, value, foot, tone = 'text-text' }: { label: string; value: string | number; foot?: string; tone?: string }) {
  return (
    <div className="space-y-1 rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <div className="text-xs font-medium text-text-3">{label}</div>
      <div className={`text-2xl font-extrabold tracking-tight ${tone}`}>{value}</div>
      {foot && <div className="text-xs font-bold text-text-3">{foot}</div>}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-text-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text outline-none focus:border-navy" />
    </div>
  )
}
