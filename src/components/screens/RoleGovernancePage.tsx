import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppIcon } from '../../components/shared/AppIcon'
import type { ReactNode } from 'react'
import { EmptyState, ErrorState, SkeletonKpiGrid, SkeletonList, SkeletonTable, Topbar } from '../shared'
import { useAuth } from '../../context/AuthContext'
import { marketingService } from '../../services/api/marketingService'
import { parseApiError } from '../../services/api/apiClient'
import NoPermissionPage from '../layout/NoPermissionPage'
import { pluralize, pluralizeNoun } from '../../utils/formatters'
import {
  transformAuthorityLimits,
  transformPermissionsMap,
  type AuthorityLimitRow,
  type PermissionResourceRow,
} from '../../services/transformers/marketingTransformers'

type RoleTab = 'permissions' | 'authority' | 'framework' | 'backend'

const preferredActions = [
  'view',
  'list',
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'assign',
  'export',
  'submit',
  'view_own',
  'update_own',
  'list_own',
  'delete_own',
  'complete',
  'convert_to_client',
  'upload',
  'upload_own',
  'download',
  'record_payment',
  'submit_for_approval',
  'authorize',
  'process_batch',
  'make_payment',
  'update_status',
  'update_score',
  'submit_feedback',
  'set_business_hours',
  'add_item',
  'remove_item',
  'clear',
  'fund',
  'manage',
  'override',
  'force_delete',
  'exit',
]

const tabs: Array<{ key: RoleTab; label: string; icon: string }> = [
  { key: 'permissions', label: 'Permissions', icon: 'ti-shield-check' },
  { key: 'authority', label: 'Authority Limits', icon: 'ti-scale' },
  { key: 'framework', label: 'Role Framework', icon: 'ti-hierarchy-3' },
  { key: 'backend', label: 'Backend Notes', icon: 'ti-database' },
]

const frameworkGroups = [
  {
    title: 'Mandate',
    icon: 'ti-briefcase',
    items: ['Mission / Purpose', 'Job Description', 'Responsibilities', 'Reporting Structure', 'Decision Matrix'],
  },
  {
    title: 'Execution',
    icon: 'ti-list-check',
    items: ['SOPs', 'Task Templates', 'Daily Routine', 'Reports', 'Resources & Tools', 'Knowledge Base'],
  },
  {
    title: 'Performance',
    icon: 'ti-chart-bar',
    items: ['Targets', 'KPIs', 'Performance History', 'OKRs', 'Competencies', 'Success Playbook'],
  },
  {
    title: 'Governance',
    icon: 'ti-lock-check',
    items: ['Authority Limits', 'Permissions Matrix', 'Risk & Compliance', 'Training Requirements', 'Career Path', 'Succession Plan', 'Stakeholder Management'],
  },
]

function initials(value: string) {
  return value.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'RL'
}

function normalizeActionLabel(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function percent(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function StatusDot({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center justify-center text-emerald-600" title="Granted to this role">
        <AppIcon name="circle-check" size={18} color="#16a34a" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center justify-center text-text-3/40" title="Not granted">
      <span className="text-[12px] font-medium text-text-3/40">-</span>
    </span>
  )
}

export function RoleGovernancePage() {
  const [period, setPeriod] = useState('week')
  const [activeTab, setActiveTab] = useState<RoleTab>('permissions')
  const [search, setSearch] = useState('')
  const [activeAction, setActiveAction] = useState('all')
  const [permissionRows, setPermissionRows] = useState<PermissionResourceRow[]>([])
  const [authorityLimits, setAuthorityLimits] = useState<AuthorityLimitRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const { userRole, employeeDetails, permissions } = useAuth()

  async function loadRoleGovernance() {
    setIsLoading(true)
    setApiError('')
    try {
      const [permissionRes, authorityRes] = await Promise.all([
        marketingService.getPermissionsMap(),
        marketingService.getMyAuthorityLimits(),
      ])

      if (permissionRes.data) setPermissionRows(transformPermissionsMap(permissionRes.data))
      else {
        setPermissionRows([])
        setApiError(parseApiError(permissionRes.error || 'Could not load permissions map'))
      }

      if (authorityRes.data) setAuthorityLimits(transformAuthorityLimits(authorityRes.data))
      else if (authorityRes.error) setAuthorityLimits([])
    } catch (err) {
      setPermissionRows([])
      setAuthorityLimits([])
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoleGovernance()
  }, [])

  const roleName = userRole?.name || employeeDetails?.position || 'Current role'
  const roleMeta = [employeeDetails?.department_name, employeeDetails?.branch_name].filter(Boolean).join(' - ') || 'Authenticated role'

  const actionColumns = useMemo(() => {
    const discovered = Array.from(new Set(permissionRows.flatMap((row) => row.actions)))
    const ordered = preferredActions.filter((action) => discovered.includes(action))
    const extra = discovered.filter((action) => !preferredActions.includes(action)).sort()

    if (activeAction !== 'all') {
      return [activeAction]
    }

    return [...ordered, ...extra]
  }, [activeAction, permissionRows])

  const filteredPermissionRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return permissionRows.filter((row) => {
      const matchesSearch = !needle || normalizeActionLabel(row.resource).toLowerCase().includes(needle) || row.resource.toLowerCase().includes(needle)
      const matchesAction = activeAction === 'all' || row.actions.includes(activeAction)
      return matchesSearch && matchesAction
    })
  }, [activeAction, permissionRows, search])

  const permissionStats = useMemo(() => {
    let valid = 0
    let granted = 0
    permissionRows.forEach((row) => {
      const grantedActions = permissions[row.resource] || []
      row.actions.forEach((action) => {
        valid += 1
        if (grantedActions.includes(action)) granted += 1
      })
    })
    return {
      valid,
      granted,
      coverage: percent(granted, valid),
    }
  }, [permissionRows, permissions])

  const dataStatus = apiError ? 'Backend issue' : isLoading ? 'Syncing' : 'Live backend data'

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="role-governance" />
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden">
      <Topbar title="Role framework & permissions" period={period} onPeriodChange={setPeriod} />

      <div className="min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <div className="grid min-w-0 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <div className="min-w-0 border-b border-border p-4 lg:border-b-0 lg:border-r">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-sm font-extrabold text-white">
                  {initials(roleName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-extrabold text-text">{roleName}</h2>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Read-only
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-text-3">{roleMeta}</p>
                  <p className="mt-3 max-w-2xl text-xs leading-relaxed text-text-2">
                    A backend-backed view of what this authenticated role can access, where approval authority exists, and which role framework areas still need backend records.
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="min-w-0 bg-surface p-3">
                <SkeletonKpiGrid cards={4} />
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-2 gap-px bg-border sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <MetricTile label="Permission coverage" value={`${permissionStats.coverage}%`} foot={`${permissionStats.granted}/${permissionStats.valid} ${pluralizeNoun(permissionStats.valid, 'grant')}`} />
                <MetricTile label="Resources" value={permissionRows.length.toString()} foot="Backend modules" />
                <MetricTile label="Authority limits" value={authorityLimits.length.toString()} foot="Returned rows" />
                <MetricTile label="Data status" value={dataStatus} foot="No demo fallback" compact />
              </div>
            )}
          </div>
        </section>

        {apiError && <ErrorState message={apiError} onRetry={() => void loadRoleGovernance()} compact />}

        <div className="flex min-w-0 gap-1 overflow-x-auto border-b border-border pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'border border-border bg-surface text-text shadow-xs'
                  : 'text-text-3 hover:bg-surface hover:text-text'
              }`}
            >
              <AppIcon name={tab.icon.replace(/^ti-/, '')} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'permissions' && (
          <section className="min-w-0 space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex min-w-0 flex-col gap-3 border-b border-border/80 pb-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-text">Permissions matrix</h3>
                <p className="mt-0.5 text-[11px] text-text-3">Read-only grants from the backend permissions map and authenticated role permissions.</p>
              </div>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-64">
                  <AppIcon name="search" size={14} className="absolute left-3 top-2.5 text-text-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search modules..."
                    className="w-full rounded-lg border border-border bg-surface-1 py-2 pl-8 pr-3 text-xs font-medium text-text outline-none placeholder:text-text-3 focus:border-navy"
                  />
                </div>
              </div>
            </div>

            <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1">
              <ActionFilter label="All actions" active={activeAction === 'all'} onClick={() => setActiveAction('all')} />
              {actionColumns.map((action) => (
                <ActionFilter
                  key={action}
                  label={normalizeActionLabel(action)}
                  active={activeAction === action}
                  onClick={() => setActiveAction(action)}
                />
              ))}
            </div>

            {isLoading ? (
              <SkeletonTable rows={5} columns={actionColumns.length + 1} />
            ) : permissionRows.length === 0 ? (
              <EmptyState title="No permissions map" description="No permissions map was returned." icon="ti-shield-lock" compact />
            ) : filteredPermissionRows.length === 0 ? (
              <EmptyState title="No matching permissions" description="No permission resources match the current search or action filter." icon="ti-filter-off" compact />
            ) : (
              <div className="min-w-0 overflow-hidden rounded-xl border border-border">
                <div className="max-w-full overflow-x-auto">
                  <table className="min-w-[760px] w-full border-collapse text-left text-xs">
                    <thead className="bg-surface-1">
                      <tr className="border-b border-border font-bold text-text-3">
                        <th className="sticky left-0 z-10 min-w-56 bg-surface-1 px-3 py-2.5">Module</th>
                        {actionColumns.map((action) => (
                          <th key={action} className="px-3 py-2.5 text-center">{normalizeActionLabel(action)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-medium">
                      {filteredPermissionRows.map((row) => (
                        <tr key={row.resource} className="hover:bg-surface-1/70">
                          <td className="sticky left-0 z-10 min-w-56 bg-surface px-3 py-3 font-bold text-text">
                            <span className="block truncate">{normalizeActionLabel(row.resource)}</span>
                            <span className="mt-0.5 block truncate text-[10px] font-medium text-text-3">{row.resource}</span>
                          </td>
                          {actionColumns.map((action) => {
                            const validForResource = row.actions.includes(action)
                            const enabledForRole = permissions[row.resource]?.includes(action)
                            return (
                              <td key={action} className="px-3 py-3 text-center">
                                {validForResource ? <StatusDot active={Boolean(enabledForRole)} /> : <span className="text-text-3">-</span>}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'authority' && (
          <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-text">Approval limits & escalation</h3>
                <p className="mt-0.5 text-[11px] text-text-3">Authority rows returned for the authenticated role.</p>
              </div>
              <span className="rounded-md border border-border bg-surface-1 px-2 py-1 text-[10.5px] font-bold text-text-2">
                {pluralize(authorityLimits.length, 'limit')}
              </span>
            </div>

            {isLoading ? (
              <SkeletonList rows={4} />
            ) : authorityLimits.length === 0 ? (
              <EmptyState title="No authority limits" description="No authority limits were returned." icon="ti-scale" compact />
            ) : (
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {authorityLimits.map((limit) => (
                  <div key={limit.id} className="min-w-0 rounded-xl border border-border bg-surface-1 p-3">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-text">{limit.label}</div>
                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-[10.5px] font-semibold text-text-3">
                          <span className="rounded border border-border bg-surface px-2 py-0.5">{normalizeActionLabel(limit.resource)}</span>
                          <span className="rounded border border-border bg-surface px-2 py-0.5">{normalizeActionLabel(limit.action)}</span>
                        </div>
                      </div>
                      <div className="max-w-[45%] shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-right text-[11px] font-bold text-blue-900">
                        <span className="block truncate">{limit.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'framework' && (
          <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold text-text">Role framework</h3>
              <p className="mt-0.5 text-[11px] text-text-3">Framework coverage shown as structure only. Missing backend records are not filled with demo content.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {frameworkGroups.map((group) => (
                <div key={group.title} className="min-w-0 rounded-xl border border-border bg-surface-1 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
                      <AppIcon name={group.icon.replace(/^ti-/, '')} size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-text">{group.title}</div>
                      <div className="text-[10px] font-medium text-text-3">{pluralize(group.items.length, 'framework component')}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <div key={item} className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2">
                        <AppIcon name="circle" size={8} className="text-[8px] text-text-3" />
                        <span className="truncate text-[11px] font-semibold text-text-2">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'backend' && (
          <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold text-text">Backend notes</h3>
              <p className="mt-0.5 text-[11px] text-text-3">Current page behavior is intentionally limited to confirmed read-only role governance data.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <BackendNote icon="ti-plug-connected" title="Endpoints used" tone="ok">
                Permissions come from GET /api/v1/roles/permissions-map. Authority limits come from GET /api/v1/roles/me/authority-limits.
              </BackendNote>
              <BackendNote icon="ti-ban" title="Endpoints avoided" tone="warn">
                GET /api/v1/roles/me/description is not called because the backend can return 404 when no role-description record exists.
              </BackendNote>
              <BackendNote icon="ti-lock" title="Read-only grants" tone="neutral">
                Permission grants are displayed from auth context and the permissions map. This screen does not call unsupported role or permission write endpoints.
              </BackendNote>
              <BackendNote icon="ti-database-off" title="No demo fallback" tone="neutral">
                Empty backend responses render empty states. The UI does not invent purpose, job description, responsibilities, SOPs, KPIs, or training records.
              </BackendNote>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function MetricTile({ label, value, foot, compact = false }: { label: string; value: string; foot: string; compact?: boolean }) {
  return (
    <div className="min-w-0 bg-surface p-3">
      <div className="truncate text-[10px] font-bold uppercase text-text-3">{label}</div>
      <div className={`mt-1 truncate font-extrabold text-text ${compact ? 'text-sm' : 'text-xl'}`}>{value}</div>
      <div className="mt-0.5 truncate text-[10.5px] font-medium text-text-3">{foot}</div>
    </div>
  )
}

function ActionFilter({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold transition-all ${
        active
          ? 'border-navy bg-navy text-white'
          : 'border-border bg-surface text-text-2 hover:bg-surface-1'
      }`}
    >
      {label}
    </button>
  )
}

function BackendNote({ icon, title, tone, children }: { icon: string; title: string; tone: 'ok' | 'warn' | 'neutral'; children: ReactNode }) {
  const toneClass = tone === 'ok'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-border bg-surface-1 text-text-2'

  return (
    <div className={`min-w-0 rounded-xl border p-3 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <AppIcon name={icon.replace(/^ti-/, '')} size={18} />
        <div className="truncate text-xs font-bold">{title}</div>
      </div>
      <p className="mt-2 text-[11px] font-medium leading-relaxed">{children}</p>
    </div>
  )
}
