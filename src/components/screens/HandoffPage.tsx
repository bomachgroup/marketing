import { useEffect, useMemo, useState } from 'react'
import { EmptyState, ErrorState, InlineState, SkeletonKpiGrid, SkeletonList, Topbar } from '../shared'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import { transformServiceOrders, type ServiceOrderHandoffRow } from '../../services/transformers/marketingTransformers'
import { AppIcon } from '../../components/shared/AppIcon'

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (key.includes('complete') || key.includes('paid') || key.includes('delivered')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (key.includes('pending') || key.includes('progress') || key.includes('active')) return 'bg-blue-50 text-blue-900 border-blue-200'
  if (key.includes('cancel') || key.includes('expired') || key.includes('failed')) return 'bg-rose-50 text-rose-800 border-rose-200'
  return 'bg-surface-1 text-text-3 border-border'
}

export function HandoffPage() {
  const [period, setPeriod] = useState('week')
  const [handoffs, setHandoffs] = useState<ServiceOrderHandoffRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  async function loadHandoffs() {
    setIsLoading(true)
    setApiError('')
    try {
      const res = await marketingService.getServiceOrders({ limit: 50 })
      if (res.data) setHandoffs(transformServiceOrders(res.data))
      else {
        setHandoffs([])
        setApiError(parseApiError(res.error || 'Could not load service orders'))
      }
    } catch (err) {
      setHandoffs([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHandoffs()
  }, [])

  const metrics = useMemo(() => {
    const documentation = handoffs.filter((handoff) => handoff.steps[1]?.active).length
    const delivery = handoffs.filter((handoff) => handoff.steps[3]?.active).length
    const onboarded = handoffs.filter((handoff) => handoff.steps[4]?.active).length
    return [
      { label: 'Active handoffs', value: handoffs.length, foot: 'Service orders in view', icon: 'ti-arrows-exchange' },
      { label: 'Documentation queue', value: documentation, foot: 'Payment confirmed, not yet allocated', icon: 'ti-file-text' },
      { label: 'Allocation / service queue', value: delivery, foot: 'Ready for operational action', icon: 'ti-target' },
      { label: 'Onboarded', value: onboarded, foot: 'Completed customer journey', icon: 'ti-user-check' },
    ]
  }, [handoffs])

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Sales & allocation handoff" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-text">Sales to Documentation to Allocation to Service Handoff</h2>
            <p className="text-xs text-text-3 mt-0.5">
              Read-only service-order view. No confirmed sales handoff workflow endpoint is available.
            </p>
          </div>

          <button
            type="button"
            disabled
            title="No confirmed handoff creation endpoint is available for the current UI."
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-navy text-xs font-semibold text-white shadow-xs opacity-50 cursor-not-allowed shrink-0"
          >
            <AppIcon name="plus" size={14} /> New handoff
          </button>
        </div>

        <InlineState type="warning" message="Showing service orders as read-only operational handoffs. Create, client-file, and stage-completion workflows are disabled until a confirmed handoff endpoint is available." />

        {apiError ? <ErrorState message={apiError} onRetry={loadHandoffs} compact /> : null}

        {isLoading ? (
          <SkeletonKpiGrid />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-surface border border-border rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="text-[11px] text-text-3 font-medium">{metric.label}</div>
                  <div className="text-xl font-extrabold text-text tracking-tight">{metric.value}</div>
                  <div className="text-[10px] text-text-3 font-medium">{metric.foot}</div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
                  <AppIcon name={metric.icon.replace(/^ti-/, '')} size={18} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <SkeletonList rows={5} />
          ) : handoffs.length === 0 ? (
            <EmptyState title="No service orders" description="No service orders were returned." icon="ti-arrows-exchange" />
          ) : handoffs.map((handoff) => (
            <div key={String(handoff.id || handoff.orderNumber)} className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text truncate">{handoff.name}</h3>
                  <div className="text-[10.5px] font-medium text-text-3 mt-0.5">{handoff.meta}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${statusClass(handoff.paymentStatus)}`}>
                    {handoff.paymentStatus}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${statusClass(handoff.status)}`}>
                    {handoff.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {handoff.steps.map((step) => (
                  <div
                    key={step.label}
                    className={`p-2 rounded-xl border text-center text-[10.5px] font-bold transition-all ${
                      step.done
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : step.active
                        ? 'bg-blue-50 text-blue-900 border-blue-300 ring-2 ring-blue-400/20'
                        : 'bg-surface-1 text-text-3 border-border/60'
                    }`}
                  >
                    {step.done ? `Done: ${step.label}` : step.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled
                  title="No confirmed handoff stage update endpoint is available."
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-navy text-xs font-bold text-white shadow-xs opacity-50 cursor-not-allowed"
                >
                  <AppIcon name="arrow-right" size={14} /> Complete current stage
                </button>
                <button
                  type="button"
                  disabled
                  title="No confirmed client file route is available for service orders."
                  className="px-3.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text opacity-50 cursor-not-allowed"
                >
                  Open client file
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
