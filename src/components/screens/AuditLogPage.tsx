import { useEffect, useState } from 'react'
import { EmptyState, ErrorState, SkeletonTable, Topbar, Select } from '../shared'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import { transformAuditLogs, type AuditLogRow } from '../../services/transformers/marketingTransformers'
import { AppIcon } from '../../components/shared/AppIcon'
import NoPermissionPage from '../layout/NoPermissionPage'

function typeClass(type: string) {
  const key = type.toLowerCase()
  if (key.includes('lead')) return 'bg-blue-50 text-blue-900 border-blue-200'
  if (key.includes('approval')) return 'bg-purple-50 text-purple-900 border-purple-200'
  if (key.includes('partner')) return 'bg-amber-50 text-amber-800 border-amber-200'
  if (key.includes('system') || key.includes('auth')) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  return 'bg-surface-1 text-text-3 border-border'
}

export function AuditLogPage() {
  const [period, setPeriod] = useState('week')
  const [search, setSearch] = useState('')
  const [auditType, setAuditType] = useState('all')
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  async function loadLogs() {
    setIsLoading(true)
    setApiError('')
    try {
      const res = await marketingService.getAuditLogs({
        limit: 100,
        search,
        audit_type: auditType,
      })
      if (res.data) setLogs(transformAuditLogs(res.data))
      else {
        setLogs([])
        setApiError(parseApiError(res.error || 'Could not load audit logs'))
      }
    } catch (err) {
      setLogs([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, auditType])

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="audit-log" />
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Activity & audit log" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-text">Department Activity & Audit Log</h2>
            <p className="mt-0.5 text-xs text-text-3">
              A permanent record of changes, approvals, assignments, exports, messages, lead movements and partner actions
            </p>
          </div>

          <button
            type="button"
            disabled
            title="No confirmed audit export endpoint is available."
            className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text opacity-50 shadow-xs"
          >
            <AppIcon name="download" size={14} /> Export audit
          </button>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={loadLogs} compact /> : null}

        <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity..."
              className="w-full max-w-lg rounded-xl border border-border bg-surface p-2 text-xs text-text outline-none placeholder:text-text-3 focus:border-navy"
            />

            <Select
              options={[
                { value: 'all', label: 'All types' },
                { value: 'lead', label: 'Lead' },
                { value: 'system', label: 'System' },
                { value: 'approval', label: 'Approval' },
                { value: 'partner', label: 'Partner' },
              ]}
              value={auditType}
              onChange={setAuditType}
              size="sm"
            />
          </div>

          {isLoading ? (
            <SkeletonTable rows={7} columns={5} />
          ) : logs.length === 0 ? (
            <EmptyState title="No audit logs" description="No audit logs were returned for the selected filters." icon="ti-history" compact />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-bold text-text-3">
                    <th className="px-3 py-2.5">Time</th>
                    <th className="px-3 py-2.5 text-center">Type</th>
                    <th className="px-3 py-2.5">Activity</th>
                    <th className="px-3 py-2.5">Actor</th>
                    <th className="px-3 py-2.5">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {logs.map((log) => (
                    <tr key={String(log.id || `${log.time}-${log.action}`)} className="hover:bg-surface-1">
                      <td className="whitespace-nowrap px-3 py-2.5 text-text-3">{log.time}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`rounded border px-2 py-0.5 text-[10.5px] font-bold ${typeClass(log.type)}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-text">{log.action}</td>
                      <td className="px-3 py-2.5 text-text-3">{log.actor}</td>
                      <td className="px-3 py-2.5 text-text-3">{log.ipAddress}</td>
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
