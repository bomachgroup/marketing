import { useEffect, useState } from 'react'
import { EmptyState, ErrorState, Modal, SkeletonDetail, SkeletonKpiGrid, SkeletonList, Topbar } from '../../shared'
import { parseApiError } from '../../../services/api/apiClient'
import { teamService } from '../../../services/api/teamService'
import { transformTeamDirectory, type TeamDirectoryData, type TeamDirectoryMember } from '../../../services/transformers/teamTransformers'
import { pluralize } from '../../../utils/formatters'

type EmployeeDetail = Record<string, unknown>

function isRecord(value: unknown): value is EmployeeDetail {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function textFrom(value: unknown, fallback = '-') {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return fallback
}

function countPermissions(value: unknown) {
  if (!isRecord(value)) return '0 grants'
  const total = Object.values(value).reduce<number>((sum, actions) => sum + (Array.isArray(actions) ? actions.length : 0), 0)
  return `${total} ${total === 1 ? 'grant' : 'grants'}`
}

function branchScope(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return 'All permitted branches'
  const names = value
    .map((branch) => isRecord(branch) ? textFrom(branch.name ?? branch.branch_name ?? branch.title, '') : '')
    .filter(Boolean)
  return names.length ? names.join(', ') : `${value.length} scoped ${value.length === 1 ? 'branch' : 'branches'}`
}

export function TeamDirectoryPage() {
  const [period, setPeriod] = useState('week')
  const [directory, setDirectory] = useState<TeamDirectoryData>(() => transformTeamDirectory({}, {}, {}))
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [apiError, setApiError] = useState('')
  const [selectedMember, setSelectedMember] = useState<TeamDirectoryMember | null>(null)
  const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetail | null>(null)

  async function loadDirectory() {
    setIsLoading(true)
    setApiError('')
    try {
      const [employeeRes, departmentRes, unitRes] = await Promise.all([
        teamService.listEmployees({ limit: 100 }),
        teamService.listDepartments({ limit: 100 }),
        teamService.listUnits({ limit: 100 }),
      ])

      const errors = [employeeRes.error, departmentRes.error, unitRes.error].filter(Boolean)
      if (errors.length > 0) {
        setApiError(parseApiError(errors.join(' ')))
      }

      setDirectory(transformTeamDirectory(employeeRes.data, departmentRes.data, unitRes.data))
    } catch (err) {
      setDirectory(transformTeamDirectory({}, {}, {}))
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadDirectory())
  }, [])

  const { members, summary } = directory

  async function openEmployeeDetail(member: TeamDirectoryMember) {
    setSelectedMember(member)
    setEmployeeDetail(null)
    setIsLoadingDetail(true)
    try {
      const res = await teamService.getEmployee(member.id)
      if (res.data) {
        setEmployeeDetail(isRecord(res.data) ? res.data : { data: res.data })
      } else if (res.error) {
        setApiError(parseApiError(res.error))
      }
    } catch (err) {
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoadingDetail(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="Team directory" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        {apiError ? <ErrorState message={apiError} onRetry={loadDirectory} compact /> : null}

        {isLoading ? (
          <SkeletonKpiGrid cards={3} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard label="Total team members" value={summary.totalMembers} />
            <SummaryCard label="Active employees" value={summary.activeMembers} accent="text-emerald-600" />
            <SummaryCard label="Departments" value={summary.departments} sub={pluralize(summary.units, 'unit')} />
          </div>
        )}

        {isLoading ? (
          <SkeletonList rows={9} avatar />
        ) : members.length === 0 ? (
          <EmptyState title="No team members" description="No backend team members were returned." icon="ti-users" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <button
                type="button"
                key={member.id}
                onClick={() => openEmployeeDetail(member)}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/80 bg-surface p-3.5 text-left shadow-xs transition-all hover:border-navy hover:bg-surface-1"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${member.avatarClass}`}>
                  {member.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <h4 className="truncate text-xs font-bold text-text">{member.name}</h4>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        member.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={member.statusLabel}
                    />
                  </div>
                  <div className="truncate text-[11px] font-semibold text-text-3">{member.role}</div>
                  <div className="mt-0.5 truncate text-[10.5px] font-medium text-text-3">{member.meta}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal open={Boolean(selectedMember)} onClose={() => setSelectedMember(null)} title={selectedMember?.name || 'Employee Detail'}>
        {selectedMember && (
          <div className="space-y-3 text-xs">
            {isLoadingDetail ? (
              <SkeletonDetail />
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selectedMember.avatarClass}`}>
                    {selectedMember.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-text">{selectedMember.name}</div>
                    <div className="truncate text-[11px] font-semibold text-text-3">{selectedMember.role}</div>
                  </div>
                </div>
                <DetailRow label="User ID" value={String(selectedMember.id)} />
                <DetailRow label="Role ID" value={textFrom(employeeDetail?.id)} />
                <DetailRow label="Assigned Role" value={textFrom(employeeDetail?.name, selectedMember.role)} />
                <DetailRow label="Branch Scope" value={branchScope(employeeDetail?.branches)} />
                <DetailRow label="Permission Coverage" value={countPermissions(employeeDetail?.permissions)} />
                <DetailRow label="Status" value={selectedMember.statusLabel} />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function SummaryCard({ label, value, sub, accent = 'text-text' }: { label: string; value: number; sub?: string; accent?: string }) {
  return (
    <div className="space-y-1 rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <div className="text-xs font-medium text-text-3">{label}</div>
      <div className={`text-2xl font-extrabold tracking-tight ${accent}`}>{value}</div>
      {sub && <div className="text-xs font-medium text-text-3">{sub}</div>}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2">
      <span className="font-bold text-text-3">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-text">{value}</span>
    </div>
  )
}
