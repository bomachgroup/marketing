import { useEffect, useMemo, useState } from 'react'
import { AppIcon } from '../../components/shared/AppIcon'
import { BusyLabel, EmptyState, ErrorState, SkeletonList, Topbar } from '../shared'
import { useToast } from '../../context/ToastContext'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import { transformApprovalRequests, type ApprovalCenterRow } from '../../services/transformers/marketingTransformers'
import NoPermissionPage from '../layout/NoPermissionPage'

function statusClass(status: string) {
  const key = status.toLowerCase()
  if (key.includes('approve')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (key.includes('reject') || key.includes('cancel')) return 'bg-rose-50 text-rose-800 border-rose-200'
  if (key.includes('pending')) return 'bg-purple-50 text-purple-900 border-purple-200'
  return 'bg-surface-1 text-text-3 border-border'
}

function iconForAction(type: string) {
  const key = type.toLowerCase()
  if (key.includes('campaign')) return 'speakerphone'
  if (key.includes('media')) return 'layout-board'
  if (key.includes('partner') || key.includes('commission')) return 'user-check'
  if (key.includes('content')) return 'photo'
  return 'checkup-list'
}

export function ApprovalsPage() {
  const [period, setPeriod] = useState('week')
  const [approvals, setApprovals] = useState<ApprovalCenterRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const { showToast } = useToast()

  async function loadApprovals() {
    setIsLoading(true)
    setApiError('')
    try {
      const res = await marketingService.getApprovals({ limit: 100 })
      if (res.data) setApprovals(transformApprovalRequests(res.data))
      else {
        setApprovals([])
        setApiError(parseApiError(res.error || 'Could not load approval requests'))
      }
    } catch (err) {
      setApprovals([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadApprovals()
  }, [])

  const pendingCount = useMemo(
    () => approvals.filter((item) => item.status.toLowerCase().includes('pending')).length,
    [approvals],
  )

  async function decide(item: ApprovalCenterRow, status: 'approved' | 'rejected') {
    if (!item.id) {
      showToast('This approval request has no backend ID.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.submitApprovalDecision(item.id, {
        status,
        comment: `${status === 'approved' ? 'Approved' : 'Rejected'} from approval center.`,
      })
      if (!res.data) {
        showToast(parseApiError(res.error || `Could not ${status === 'approved' ? 'approve' : 'reject'} request`), 'error')
        return
      }

      showToast(`Approval request ${status}.`, 'success')
      await loadApprovals()
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="approvals" />
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Approval center" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-text">Marketing Approval Center</h2>
            <p className="mt-0.5 text-xs text-text-3">Campaigns, content, media spend, partner fees, discounts and commission payments</p>
          </div>

          <span className="rounded border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10.5px] font-bold text-purple-900">
            {pendingCount} pending
          </span>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadApprovals} compact /> : null}

        <div className="space-y-3">
          {isLoading ? (
            <SkeletonList rows={6} avatar />
          ) : approvals.length === 0 ? (
            <EmptyState title="No approval requests" description="No approval requests were returned." icon="ti-checkup-list" />
          ) : approvals.map((item) => {
            const isPending = item.status.toLowerCase().includes('pending')
            return (
              <div
                key={String(item.id || item.title)}
                className={`flex items-center justify-between gap-4 rounded-2xl border bg-surface p-3.5 shadow-xs transition-all ${
                  item.status.toLowerCase().includes('approve') ? 'border-l-4 border-l-emerald-600 border-border' : 'border-border'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-900">
                    <AppIcon name={iconForAction(item.actionType)} size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-bold leading-snug text-text">{item.title}</h3>
                    <div className="mt-0.5 truncate text-[10.5px] font-medium text-text-3">{item.meta}</div>
                    {item.stepLabel && <div className="mt-0.5 truncate text-[10.5px] font-medium text-text-3">Step: {item.stepLabel}</div>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <span className={`rounded border px-2.5 py-1 text-[10.5px] font-bold ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => void decide(item, 'approved')}
                        disabled={isSaving || !item.id}
                        className="rounded-lg bg-emerald-700 px-3.5 py-1 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-800 active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? <BusyLabel>Approving...</BusyLabel> : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void decide(item, 'rejected')}
                        disabled={isSaving || !item.id}
                        className="rounded-lg bg-rose-700 px-3.5 py-1 text-xs font-bold text-white shadow-xs transition-all hover:bg-rose-800 active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? <BusyLabel>Rejecting...</BusyLabel> : 'Reject'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
