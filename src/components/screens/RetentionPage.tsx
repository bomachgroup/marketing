import { useEffect, useState } from 'react'
import { EmptyState, ErrorState, SkeletonKpiGrid, SkeletonList, SkeletonTableBodyRows, Topbar } from '../shared'
import { parseApiError } from '../../services/api/apiClient'
import { marketingService } from '../../services/api/marketingService'
import { transformRetentionLeads, type RetentionLeadRow } from '../../services/transformers/marketingTransformers'
import { AppIcon } from '../../components/shared/AppIcon'
import { pluralize } from '../../utils/formatters'

export function RetentionPage() {
  const [period, setPeriod] = useState('week')
  const [opportunities, setOpportunities] = useState<RetentionLeadRow[]>([])
  const [dormant, setDormant] = useState<RetentionLeadRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  async function loadRetention() {
    setIsLoading(true)
    setApiError('')
    try {
      const [referralRes, leadsRes] = await Promise.all([
        marketingService.getLeads({ limit: 50, source: 'referral' }),
        marketingService.getLeads({ limit: 50, status: 'nurturing' }),
      ])

      if (referralRes.data) setOpportunities(transformRetentionLeads(referralRes.data))
      else {
        setOpportunities([])
        setApiError(parseApiError(referralRes.error || 'No backend referral leads returned.'))
      }

      if (leadsRes.data) setDormant(transformRetentionLeads(leadsRes.data))
      else {
        setDormant([])
        setApiError((prev) => [prev, parseApiError(leadsRes.error || 'No backend dormant leads returned.')].filter(Boolean).join(' '))
      }
    } catch (err) {
      setOpportunities([])
      setDormant([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadRetention())
  }, [])

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Retention & referrals" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text">Loyalty, Referral & Reactivation Engine</h2>
            <p className="mt-0.5 text-xs text-text-3">
              Growth continues after purchase: onboarding, satisfaction, referral, repeat purchase and dormant-lead recovery
            </p>
          </div>

          <button
            type="button"
            disabled
            title="No confirmed referral campaign launch endpoint is exposed yet."
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white opacity-50 shadow-xs"
          >
            <AppIcon name="link" size={14} /> Launch referral campaign
          </button>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadRetention} compact /> : null}

        {isLoading ? (
          <SkeletonKpiGrid />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Referral leads" value={opportunities.length} foot="Leads with referral source" icon="ti-refresh" tone="emerald" />
            <Metric label="Referral opportunities" value={opportunities.length} foot="Backend referral leads" icon="ti-user-plus" tone="blue" />
            <Metric label="Dormant leads" value={dormant.length} foot="Nurturing leads returned" icon="ti-moon" tone="amber" />
            <Metric label="CSAT" value="-" foot="No CSAT endpoint exposed" icon="ti-star" tone="purple" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Lifecycle title="30-day onboarding" copy="Requires a confirmed onboarding lifecycle endpoint." foot="Backend endpoint missing" icon="ti-user-check" tone="blue" />
          <Lifecycle title="60-day referral ask" copy="Referral lead data is available; referral-campaign launch is not." foot={pluralize(opportunities.length, 'referral lead')} icon="ti-user-plus" tone="emerald" />
          <Lifecycle title="Quarterly reactivation" copy="Read-only dormant/nurturing lead review is available." foot={pluralize(dormant.length, 'lead')} icon="ti-refresh" tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs lg:col-span-2">
            <h3 className="border-b border-border/80 pb-2 text-sm font-bold text-text">
              Referral opportunities
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-bold text-text-3">
                    <th className="px-3 py-2.5">Client</th>
                    <th className="px-3 py-2.5">Division</th>
                    <th className="px-3 py-2.5">Potential</th>
                    <th className="px-3 py-2.5">Next action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {isLoading ? (
                    <SkeletonTableBodyRows rows={5} columns={4} />
                  ) : opportunities.length === 0 ? (
                    <tr><td colSpan={4} className="px-3 py-3"><EmptyState title="No referral leads" description="No backend referral leads were returned." icon="ti-user-plus" compact /></td></tr>
                  ) : (
                    opportunities.map((row) => (
                      <tr key={row.id} className="hover:bg-surface-1">
                        <td className="px-3 py-2.5 font-bold text-text">{row.name}</td>
                        <td className="px-3 py-2.5 text-text-3">{row.division}</td>
                        <td className="px-3 py-2.5"><Potential value={row.potential} /></td>
                        <td className="px-3 py-2.5 text-text-3">{row.action}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <h3 className="border-b border-border/80 pb-2 text-sm font-bold text-text">
              Dormant lead reactivation
            </h3>

            <div className="space-y-2">
              {isLoading ? (
                <SkeletonList rows={4} />
              ) : dormant.length === 0 ? (
                <EmptyState title="No dormant leads" description="No dormant leads were returned." icon="ti-moon" compact />
              ) : (
                dormant.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-1 p-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-900">
                        {row.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-text">{row.name}</div>
                        <div className="truncate text-[10px] font-medium text-text-3">{row.meta}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      title="No confirmed reactivation endpoint is exposed yet."
                      className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-1 text-[10.5px] font-semibold text-text opacity-50"
                    >
                      Reactivate
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, foot, icon, tone }: { label: string; value: string | number; foot: string; icon: string; tone: string }) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
  }
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3.5 shadow-xs">
      <div className="min-w-0 space-y-1">
        <div className="truncate text-[11px] font-medium text-text-3">{label}</div>
        <div className="truncate text-xl font-extrabold tracking-tight text-text">{value}</div>
        <div className="truncate text-[10px] font-medium text-text-3">{foot}</div>
      </div>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tones[tone] || tones.blue}`}>
        <AppIcon name={icon.replace(/^ti-/, '')} size={14} />
      </div>
    </div>
  )
}

function Lifecycle({ title, copy, foot, icon, tone }: { title: string; copy: string; foot: string; icon: string; tone: string }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
  }
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-surface p-3.5 shadow-xs">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${tones[tone] || tones.blue}`}>
        <AppIcon name={icon.replace(/^ti-/, '')} size={14} />
      </div>
      <div>
        <h4 className="text-xs font-bold text-text">{title}</h4>
        <p className="mt-0.5 text-[11px] text-text-3">{copy}</p>
      </div>
      <div className="border-t border-border/60 pt-1 text-[10.5px] font-bold text-navy">{foot}</div>
    </div>
  )
}

function Potential({ value }: { value: string }) {
  const high = value.toLowerCase() === 'high'
  return (
    <span className={`rounded border px-2 py-0.5 text-[10.5px] font-bold ${high ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
      {value}
    </span>
  )
}
