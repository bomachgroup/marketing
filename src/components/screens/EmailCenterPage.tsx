import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppIcon } from '../../components/shared/AppIcon'
import { BusyLabel, EmptyState, ErrorState, SkeletonKpiGrid, SkeletonList, SkeletonTable, Topbar, Select } from '../shared'
import { useToast } from '../../context/ToastContext'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import {
  transformEmailAudiences,
  transformEmailCampaigns,
  transformEmailMetrics,
  type EmailAudienceOption,
  type EmailCampaignRow,
} from '../../services/transformers/marketingTransformers'

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (key.includes('sent') || key.includes('delivered') || key.includes('complete')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (key.includes('draft') || key.includes('scheduled')) return 'bg-blue-50 text-blue-900 border-blue-200'
  if (key.includes('fail') || key.includes('bounce')) return 'bg-rose-50 text-rose-800 border-rose-200'
  return 'bg-surface-1 text-text-3 border-border'
}

export function EmailCenterPage() {
  const [period, setPeriod] = useState('week')
  const [selectedAudience, setSelectedAudience] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [audiences, setAudiences] = useState<EmailAudienceOption[]>([])
  const [campaigns, setCampaigns] = useState<EmailCampaignRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const { showToast } = useToast()

  async function loadEmailOperations() {
    setIsLoading(true)
    setApiError('')
    try {
      const [audienceRes, campaignRes] = await Promise.all([
        marketingService.getEmailAudiences(),
        marketingService.getEmailCampaigns({ limit: 50 }),
      ])

      if (audienceRes.data) {
        const rows = transformEmailAudiences(audienceRes.data)
        setAudiences(rows)
        setSelectedAudience((current) => current || rows[0]?.id || '')
      } else if (audienceRes.error) {
        setAudiences([])
        setApiError(parseApiError(audienceRes.error))
      }

      if (campaignRes.data) {
        setCampaigns(transformEmailCampaigns(campaignRes.data))
      } else if (campaignRes.error) {
        setCampaigns([])
        setApiError((prev) => [prev, parseApiError(campaignRes.error)].filter(Boolean).join(' '))
      }
    } catch (err) {
      setAudiences([])
      setCampaigns([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEmailOperations()
  }, [])

  const metrics = useMemo(() => transformEmailMetrics(campaigns), [campaigns])

  const audiencePayload = () => ({
    audience_groups: selectedAudience ? [selectedAudience] : [],
    filters: { period },
    manual_recipients: null,
  })

  async function handlePreview() {
    setIsSaving(true)
    try {
      const res = await marketingService.previewEmailCampaign(audiencePayload())
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not preview email audience'), 'error')
        return
      }
      showToast('Email audience preview generated.', 'success')
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSendCampaign() {
    if (!subject.trim() || !message.trim()) {
      showToast('Please enter subject and email content', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.sendEmailCampaign({
        ...audiencePayload(),
        subject: subject.trim(),
        body: message.trim(),
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not send email campaign'), 'error')
        return
      }

      showToast(`Email campaign "${subject.trim()}" sent.`, 'success')
      setSubject('')
      setMessage('')
      await loadEmailOperations()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Email marketing" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-text">Email Marketing & Nurture Center</h2>
            <p className="text-xs text-text-3 mt-0.5">
              Permission-based email campaigns, automation sequences, templates and deliverability controls
            </p>
          </div>

          <button
            type="button"
            disabled
            title="No confirmed email export endpoint is available."
            className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text opacity-50 shadow-xs"
          >
            <AppIcon name="download" size={14} /> Export report
          </button>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadEmailOperations} compact /> : null}

        {isLoading ? (
          <SkeletonKpiGrid />
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
                <AppIcon name={['send', 'mail-check', 'mail-opened', 'click'][index] || 'mail'} size={18} />
              </div>
            </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <h3 className="text-sm font-bold text-text">Compose campaign</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                Backend sender
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">Audience segment</label>
                  <Select
                    options={
                      audiences.length === 0
                        ? [{ value: '', label: 'No audiences returned' }]
                        : audiences.map((a) => ({
                            value: String(a.id),
                            label: `${a.label}${a.count !== undefined ? ` (${a.count})` : ''}`,
                          }))
                    }
                    value={selectedAudience}
                    onChange={setSelectedAudience}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-2 mb-1">Template</label>
                  <Select
                    options={[{ value: 'custom', label: 'Custom email' }]}
                    value="custom"
                    onChange={() => {}}
                    disabled
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-2 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Write a clear subject line"
                  className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-3 outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-2 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Use approved personalization fields only."
                  rows={4}
                  className="w-full p-2 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-3 outline-none focus:border-navy resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isSaving || isLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-text hover:bg-surface-1 transition-all active:scale-95 disabled:opacity-50"
                >
                  <AppIcon name="eye" size={14} /> Preview audience
                </button>
                <button
                  type="button"
                  onClick={handleSendCampaign}
                  disabled={isSaving || isLoading}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <BusyLabel>Sending...</BusyLabel> : <><AppIcon name="send" size={14} /> Send campaign</>}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="border-b border-border/80 pb-2">
              <h3 className="text-sm font-bold text-text">Deliverability & consent controls</h3>
              <p className="text-[11px] text-text-3">Operational requirements before production campaigns</p>
            </div>

            {isLoading ? (
              <SkeletonList rows={6} />
            ) : (
              <div className="space-y-2.5">
                {[
                  'Send only to contacts with the required channel consent',
                  'Maintain SPF, DKIM, DMARC and TLS for the sending domain',
                  'Include one-click unsubscribe and suppression-list enforcement',
                  'Separate transactional messages from marketing campaigns',
                  'Monitor bounces, complaints and domain reputation',
                  'Store template version, sender, segment and approval history',
                ].map((title) => (
                  <div key={title} className="flex items-start justify-between gap-3 p-2 rounded-xl border border-border/60 bg-surface-1/40">
                    <div className="flex items-start gap-2 min-w-0">
                      <input type="checkbox" checked={false} readOnly className="rounded border-border cursor-default shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text leading-snug">{title}</div>
                        <div className="text-[10.5px] font-medium text-text-3 mt-0.5">No backend status endpoint</div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-900">
                      Unverified
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">Campaign history</h3>

          {isLoading ? (
            <SkeletonTable rows={6} columns={8} />
          ) : campaigns.length === 0 ? (
            <EmptyState title="No email campaigns" description="No email campaigns were returned." icon="ti-mail" compact />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-3 font-bold">
                    <th className="py-2.5 px-3">Campaign</th>
                    <th className="py-2.5 px-3">Segment</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Sent</th>
                    <th className="py-2.5 px-3 text-right">Delivered</th>
                    <th className="py-2.5 px-3 text-right">Opened</th>
                    <th className="py-2.5 px-3 text-right">Clicked</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {campaigns.map((campaign) => (
                    <tr key={String(campaign.id || campaign.name)} className="hover:bg-surface-1">
                      <td className="py-2.5 px-3 font-bold text-text">{campaign.name}</td>
                      <td className="py-2.5 px-3 text-text-3">{campaign.segment}</td>
                      <td className="py-2.5 px-3 text-text-3">{campaign.date}</td>
                      <td className="py-2.5 px-3 text-right text-text">{campaign.sent.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-text">{campaign.delivered.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-text">{campaign.opened.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-text">{campaign.clicked.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${statusClass(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
