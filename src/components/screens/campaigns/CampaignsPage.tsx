import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BusyLabel, EmptyState, ErrorState, Modal, SkeletonCardGrid, SkeletonKpiGrid, SkeletonList, Topbar, Select } from '../../shared'
import { useToast } from '../../../context/ToastContext'
import { marketingService } from '../../../services/api/marketingService'
import { teamService } from '../../../services/api/teamService'
import { parseApiError } from '../../../services/api/apiClient'
import { transformCampaignPanel, transformCampaignWorkspace } from '../../../services/transformers/marketingTransformers'
import type { Campaign } from '../../../data/types'
import { AppIcon } from '../../shared/AppIcon'

type WorkspaceState = ReturnType<typeof transformCampaignWorkspace> | null
type BackendRecord = Record<string, unknown>
type SelectOption = [string, string]

function formatMoney(value: unknown) {
  const numberValue = Number(value || 0)
  if (!Number.isFinite(numberValue)) return String(value || 'NGN 0')
  if (numberValue >= 1000000) return `NGN ${(numberValue / 1000000).toFixed(1)}M`
  return `NGN ${numberValue.toLocaleString()}`
}

function normalizeStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function textOf(value: unknown, fallback: string) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return fallback
}

function idOf(item: BackendRecord) {
  const id = item.id || item.campaign_id || item.request_id || item.task_id
  return typeof id === 'string' || typeof id === 'number' ? id : undefined
}

function recordOf(value: unknown): BackendRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as BackendRecord : {}
}

function listFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const data = recordOf(value)
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  return []
}

function optionId(item: BackendRecord) {
  const id = item.id ?? item.employee_id ?? item.department_id
  return typeof id === 'string' || typeof id === 'number' ? String(id) : ''
}

function employeeOptionLabel(item: BackendRecord) {
  const directName = textOf(item.full_name || item.name || item.employee_name, '')
  if (directName && !directName.includes('@')) return directName
  const joinedName = [item.first_name, item.middle_name, item.last_name, item.surname]
    .map((part) => textOf(part, ''))
    .filter(Boolean)
    .join(' ')
  return joinedName || directName || 'Employee'
}

function departmentOptionLabel(item: BackendRecord) {
  return textOf(item.name || item.department_name || item.title, 'Department')
}

export function CampaignsPage() {
  const [period, setPeriod] = useState('week')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [divFilter, setDivFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('portfolio')
  const [panel, setPanel] = useState(() => transformCampaignPanel({}))
  const [requests, setRequests] = useState<BackendRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [workspaceCampaign, setWorkspaceCampaign] = useState<Campaign | null>(null)
  const [workspace, setWorkspace] = useState<WorkspaceState>(null)
  const [workspaceError, setWorkspaceError] = useState('')
  const [workspaceAction, setWorkspaceAction] = useState('task')
  const [taskTitle, setTaskTitle] = useState('')
  const [updateText, setUpdateText] = useState('')
  const [expenseForm, setExpenseForm] = useState({ vendor: '', amount: '' })
  const [assetForm, setAssetForm] = useState({ name: '', type: 'creative' })
  const [decisionText, setDecisionText] = useState('')
  const [riskForm, setRiskForm] = useState({ title: '', severity: 'medium', ownerId: '', mitigation: '' })
  const [postAnalysisForm, setPostAnalysisForm] = useState({ conclusion: '', worked: '', failed: '', nextActions: '', markCompleted: false })
  const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<SelectOption[]>([])
  const { showToast } = useToast()

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    channel: 'Meta Ads',
    description: '',
    status: 'draft',
    impressions: '0',
    ctr: '',
    roi: '',
    budgetAllocated: '1000000',
    budgetSpent: '0',
    startDate: '',
    endDate: '',
  })
  const [requestForm, setRequestForm] = useState({
    title: '',
    division: 're',
    department: '',
    branchId: '',
    neededBy: '',
    priority: 'medium',
    proposedBudget: '500000',
    audience: '',
    product: '',
    problem: '',
    expectedOutcome: '',
    context: '',
  })

  const tabs = [
    { id: 'portfolio', label: 'Campaign portfolio' },
    { id: 'requests', label: 'Requests & intake' },
    { id: 'workspace', label: 'Workspace activity' },
  ]

  const filteredCampaigns = useMemo(() => {
    const q = search.toLowerCase()
    return panel.campaigns.filter((campaign) => {
      if (statusFilter !== 'all' && campaign.status !== statusFilter) return false
      if (divFilter !== 'all' && campaign.div !== divFilter) return false
      if (!q) return true
      return [campaign.name, campaign.owner, campaign.channels, campaign.status, campaign.div]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [panel.campaigns, search, statusFilter, divFilter])

  async function loadCampaignPanel() {
    setIsLoading(true)
    try {
      const res = await marketingService.getCampaignPanel({
        search,
        status: statusFilter,
        division: divFilter,
        limit: 100,
      })
      if (res.data) {
        setPanel(transformCampaignPanel(res.data))
      } else if (res.error) {
        showToast(parseApiError(res.error), 'error')
      }

      const reqRes = await marketingService.getCampaignRequests()
      if (reqRes.data) {
        const rawRequests = reqRes.data.items || reqRes.data.results || reqRes.data.requests || reqRes.data || []
        setRequests(Array.isArray(rawRequests) ? rawRequests : [])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadCampaignPanel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      const [employeeRes, departmentRes] = await Promise.all([
        teamService.listEmployees({ is_active: true, limit: 200 }),
        teamService.listDepartments({ limit: 200 }),
      ])
      if (cancelled) return
      if (employeeRes.data) {
        setEmployeeOptions(
          listFrom(employeeRes.data)
            .map((item) => recordOf(item))
            .map((item) => [optionId(item), employeeOptionLabel(item)] as SelectOption)
            .filter(([value]) => value)
        )
      }
      if (departmentRes.data) {
        setDepartmentOptions(
          listFrom(departmentRes.data)
            .map((item) => recordOf(item))
            .map((item) => [departmentOptionLabel(item), departmentOptionLabel(item)] as SelectOption)
            .filter(([value]) => value)
        )
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleRefreshWithFilters() {
    await loadCampaignPanel()
  }

  async function handleCreateCampaign() {
    if (!newCampaign.name.trim()) {
      showToast('Please enter a campaign name', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.createCampaign({
        name: newCampaign.name.trim(),
        channel: newCampaign.channel.trim(),
        description: newCampaign.description.trim() || null,
        status: newCampaign.status,
        impressions: Number(newCampaign.impressions || 0),
        ctr: newCampaign.ctr ? Number(newCampaign.ctr) : undefined,
        roi: newCampaign.roi ? Number(newCampaign.roi) : undefined,
        budget_allocated: Number(newCampaign.budgetAllocated || 0),
        budget_spent: Number(newCampaign.budgetSpent || 0),
        start_date: newCampaign.startDate || null,
        end_date: newCampaign.endDate || null,
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not create campaign'), 'error')
        return
      }

      showToast(`Campaign "${newCampaign.name}" created.`, 'success')
      setShowNewModal(false)
      setNewCampaign({
        name: '',
        channel: 'Meta Ads',
        description: '',
        status: 'draft',
        impressions: '0',
        ctr: '',
        roi: '',
        budgetAllocated: '1000000',
        budgetSpent: '0',
        startDate: '',
        endDate: '',
      })
      await loadCampaignPanel()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmitRequest() {
    if (!requestForm.title.trim() || !requestForm.problem.trim()) {
      showToast('Please enter a request title and business rationale', 'error')
      return
    }

    setIsSaving(true)
    try {
      const res = await marketingService.createCampaignRequest({
        title: requestForm.title.trim(),
        division: requestForm.division,
        department: requestForm.department || undefined,
        branch_id: requestForm.branchId ? Number(requestForm.branchId) : null,
        needed_by: requestForm.neededBy || null,
        priority: requestForm.priority,
        proposed_budget: Number(requestForm.proposedBudget || 0),
        audience: requestForm.audience.trim(),
        product: requestForm.product.trim(),
        problem: requestForm.problem.trim(),
        expected_outcome: requestForm.expectedOutcome.trim(),
        context: requestForm.context.trim(),
      })
      if (!res.data) {
        showToast(parseApiError(res.error || 'Could not submit campaign request'), 'error')
        return
      }

      showToast(`Campaign request "${requestForm.title}" submitted.`, 'success')
      setShowRequestModal(false)
      setRequestForm({
        title: '',
        division: 're',
        department: '',
        branchId: '',
        neededBy: '',
        priority: 'medium',
        proposedBudget: '500000',
        audience: '',
        product: '',
        problem: '',
        expectedOutcome: '',
        context: '',
      })
      await loadCampaignPanel()
    } finally {
      setIsSaving(false)
    }
  }

  async function openWorkspace(campaign: Campaign) {
    if (!campaign.id) {
      showToast('This campaign has no ID yet.', 'error')
      return
    }

    setWorkspaceCampaign(campaign)
    setWorkspace(null)
    setWorkspaceError('')
    const res = await marketingService.getCampaignWorkspace(campaign.id)
    if (res.data) {
      setWorkspace(transformCampaignWorkspace(res.data))
    } else {
      setWorkspaceError(parseApiError(res.error || 'Could not load campaign workspace'))
    }
  }

  async function refreshWorkspace() {
    if (!workspaceCampaign?.id) return
    const res = await marketingService.getCampaignWorkspace(workspaceCampaign.id)
    if (res.data) setWorkspace(transformCampaignWorkspace(res.data))
  }

  async function handleTaskStatus(task: BackendRecord, status: string) {
    const taskId = idOf(task)
    if (!taskId) {
      showToast('This task has no ID yet.', 'error')
      return
    }
    const res = await marketingService.updateCampaignTask(taskId, { status })
    if (res.data) {
      showToast('Campaign task updated.', 'success')
      await refreshWorkspace()
    } else {
      showToast(parseApiError(res.error || 'Could not update task'), 'error')
    }
  }

  async function handleWorkspaceAction() {
    if (!workspaceCampaign?.id) return

    setIsSaving(true)
    try {
      let res
      if (workspaceAction === 'task') {
        if (!taskTitle.trim()) {
          showToast('Please enter a task title', 'error')
          return
        }
        res = await marketingService.createCampaignTask(workspaceCampaign.id, {
          title: taskTitle.trim(),
          status: 'todo',
          priority: 'medium',
        })
      } else if (workspaceAction === 'update') {
        if (!updateText.trim()) {
          showToast('Please enter an update', 'error')
          return
        }
        res = await marketingService.createCampaignUpdate(workspaceCampaign.id, {
          text: updateText.trim(),
          update_type: 'progress',
        })
      } else if (workspaceAction === 'expense') {
        if (!expenseForm.vendor.trim() || !expenseForm.amount.trim()) {
          showToast('Please enter expense vendor and amount', 'error')
          return
        }
        res = await marketingService.createCampaignExpense(workspaceCampaign.id, {
          vendor: expenseForm.vendor.trim(),
          amount: Number(expenseForm.amount),
          category: 'other',
          status: 'requested',
        })
      } else if (workspaceAction === 'asset') {
        if (!assetForm.name.trim()) {
          showToast('Please enter asset name', 'error')
          return
        }
        res = await marketingService.createCampaignAsset(workspaceCampaign.id, {
          name: assetForm.name.trim(),
          asset_type: assetForm.type,
          status: 'briefed',
        })
      } else if (workspaceAction === 'risk') {
        if (!riskForm.title.trim()) {
          showToast('Please enter a risk title', 'error')
          return
        }
        res = await marketingService.createCampaignRisk(workspaceCampaign.id, {
          title: riskForm.title.trim(),
          severity: riskForm.severity,
          owner_id: riskForm.ownerId ? Number(riskForm.ownerId) : null,
          mitigation: riskForm.mitigation.trim() || null,
          status: 'open',
        })
      } else if (workspaceAction === 'post-analysis') {
        if (!postAnalysisForm.conclusion.trim()) {
          showToast('Please enter a conclusion', 'error')
          return
        }
        res = await marketingService.saveCampaignPostAnalysis(workspaceCampaign.id, {
          conclusion: postAnalysisForm.conclusion.trim(),
          worked: postAnalysisForm.worked.trim() || null,
          failed: postAnalysisForm.failed.trim() || null,
          next_actions: postAnalysisForm.nextActions.trim() || null,
          mark_campaign_completed: postAnalysisForm.markCompleted,
        })
      } else {
        if (!decisionText.trim()) {
          showToast('Please enter a decision', 'error')
          return
        }
        res = await marketingService.createCampaignDecision(workspaceCampaign.id, {
          decision: decisionText.trim(),
        })
      }

      if (!res?.data) {
        showToast(parseApiError(res?.error || 'Could not save workspace item'), 'error')
        return
      }

      showToast('Campaign workspace updated.', 'success')
      setTaskTitle('')
      setUpdateText('')
      setExpenseForm({ vendor: '', amount: '' })
      setAssetForm({ name: '', type: 'creative' })
      setDecisionText('')
      setRiskForm({ title: '', severity: 'medium', ownerId: '', mitigation: '' })
      setPostAnalysisForm({ conclusion: '', worked: '', failed: '', nextActions: '', markCompleted: false })
      await refreshWorkspace()
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePauseResume(campaign: Campaign) {
    if (!campaign.id) {
      showToast('This campaign has no ID yet.', 'error')
      return
    }
    const nextStatus = campaign.status === 'paused' ? 'active' : 'paused'
    const res = await marketingService.updateCampaign(campaign.id, { status: nextStatus })
    if (res.data) {
      showToast(`Campaign ${nextStatus === 'paused' ? 'paused' : 'resumed'}.`, 'success')
      await loadCampaignPanel()
    } else {
      showToast(parseApiError(res.error || 'Could not update campaign'), 'error')
    }
  }

  const [isExporting, setIsExporting] = useState(false)

  async function handleExportPanel() {
    setIsExporting(true)
    try {
      const res = await marketingService.exportCampaignPanel()
      if (res.error) {
        showToast(parseApiError(res.error), 'error')
        return
      }
      showToast('Campaign panel exported.', 'success')
    } catch (err) {
      showToast(parseApiError(err instanceof Error ? err.message : err), 'error')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-0">
      <Topbar title="Campaign operating system" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-5">
        {isLoading ? (
          <SkeletonKpiGrid cards={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Active campaigns" value={panel.metrics.activeCampaigns} sub={`Across ${panel.metrics.totalCampaigns} total`} />
            <MetricCard label="Approved budget" value={formatMoney(panel.metrics.approvedBudget)} sub={`${formatMoney(panel.metrics.spent)} spent`} />
            <MetricCard label="Leads generated" value={panel.metrics.leadsGenerated} sub="All campaign sources" />
            <MetricCard label="Attributed revenue" value={formatMoney(panel.metrics.attributedRevenue)} sub={`${panel.metrics.roas} ROAS`} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-2xl p-3 shadow-xs">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:min-w-[280px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns, owners, channel"
              className="h-8 min-w-0 flex-1 rounded-xl border border-border bg-surface-1 px-3 text-xs text-text placeholder:text-text-3 focus:outline-none focus:border-navy sm:min-w-[200px]"
            />
            <Select
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'planned', label: 'Planned' },
                { value: 'draft', label: 'Draft' },
                { value: 'paused', label: 'Paused' },
                { value: 'completed', label: 'Completed' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              size="sm"
            />
            <Select
              options={[
                { value: 'all', label: 'All divisions' },
                { value: 're', label: 'Real Estate' },
                { value: 'ben', label: 'Benji' },
                { value: 'eng', label: 'Engineering' },
                { value: 'sur', label: 'Surveying' },
              ]}
              value={divFilter}
              onChange={setDivFilter}
              size="sm"
            />
            <button type="button" onClick={handleRefreshWithFilters} disabled={isLoading} className="h-8 px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-1 disabled:opacity-50">
              {isLoading ? <BusyLabel>Applying...</BusyLabel> : 'Apply'}
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportPanel}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 transition-all active:scale-95 disabled:opacity-60"
            >
              {isExporting ? <BusyLabel>Exporting...</BusyLabel> : <><AppIcon name="download" size={14} /> Export</>}
            </button>
            <button type="button" onClick={() => setShowRequestModal(true)} className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 transition-all active:scale-95">
              <AppIcon name="mail" size={14} /> Campaign request
            </button>
            <button type="button" onClick={() => setShowNewModal(true)} className="flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-navy-dark transition-all active:scale-95">
              <AppIcon name="plus" size={14} /> New campaign
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-border/80 pb-2">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${activeTab === tab.id ? 'bg-navy text-white shadow-xs' : 'text-text-3 hover:text-text hover:bg-surface-1'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="lg:col-span-2">
                <SkeletonCardGrid cards={4} className="grid grid-cols-1 gap-4 lg:grid-cols-2" />
              </div>
            ) : filteredCampaigns.length === 0 && (
              <div className="lg:col-span-2">
                <EmptyState title="No campaigns found" description="No campaigns matched the current filters." icon="ti-speakerphone" />
              </div>
            )}
            {!isLoading && filteredCampaigns.map((campaign) => (
              <CampaignCard key={String(campaign.id || campaign.name)} campaign={campaign} onOpen={() => openWorkspace(campaign)} onPauseResume={() => handlePauseResume(campaign)} />
            ))}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-text border-b border-border/80 pb-2">Campaign requests</h3>
            {isLoading ? (
              <SkeletonList rows={4} />
            ) : requests.length === 0 ? (
              <EmptyState title="No campaign requests" description="No campaign requests were returned." icon="ti-mail" compact />
            ) : (
              <div className="space-y-2">
                {requests.map((request) => (
                  <div key={String(idOf(request) || request.title)} className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-1 p-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text truncate">{textOf(request.title || request.name, 'Untitled request')}</div>
                      <div className="text-[10.5px] font-medium text-text-3 truncate">{textOf(request.division || request.department, 'Marketing')} - {normalizeStatus(textOf(request.status, 'pending'))}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-purple-50 text-purple-900 border border-purple-200">{formatMoney(request.proposed_budget || request.budget || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'workspace' && (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-xs text-text-3 font-medium">
            Open a campaign workspace from the portfolio to view tasks, assets, expenses, updates and decisions.
          </div>
        )}
      </div>

      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Create New Campaign" size="lg">
        <fieldset disabled={isSaving} className="space-y-4 disabled:cursor-wait disabled:opacity-70">
          <Field label="Campaign Name" value={newCampaign.name} onChange={(value) => setNewCampaign({ ...newCampaign, name: value })} placeholder="e.g. Bethel City Q3 Diaspora Blitz" />
          <TextAreaField label="Description" value={newCampaign.description} onChange={(value) => setNewCampaign({ ...newCampaign, description: value })} placeholder="Campaign objective, audience, and operating context" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Channel" value={newCampaign.channel} onChange={(value) => setNewCampaign({ ...newCampaign, channel: value })} placeholder="e.g. Meta Ads" />
            <SelectField label="Status" value={newCampaign.status} onChange={(value) => setNewCampaign({ ...newCampaign, status: value })} options={[['draft', 'Draft'], ['planned', 'Planned'], ['active', 'Active'], ['paused', 'Paused'], ['completed', 'Completed']]} />
            <Field label="Approved Budget (NGN)" type="number" value={newCampaign.budgetAllocated} onChange={(value) => setNewCampaign({ ...newCampaign, budgetAllocated: value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Field label="Budget spent (NGN)" type="number" value={newCampaign.budgetSpent} onChange={(value) => setNewCampaign({ ...newCampaign, budgetSpent: value })} />
            <Field label="Impressions" type="number" value={newCampaign.impressions} onChange={(value) => setNewCampaign({ ...newCampaign, impressions: value })} />
            <Field label="CTR" type="number" value={newCampaign.ctr} onChange={(value) => setNewCampaign({ ...newCampaign, ctr: value })} />
            <Field label="ROI" type="number" value={newCampaign.roi} onChange={(value) => setNewCampaign({ ...newCampaign, roi: value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Start date" type="date" value={newCampaign.startDate} onChange={(value) => setNewCampaign({ ...newCampaign, startDate: value })} />
            <Field label="End date" type="date" value={newCampaign.endDate} onChange={(value) => setNewCampaign({ ...newCampaign, endDate: value })} />
          </div>
          <ModalActions onCancel={() => setShowNewModal(false)} onSave={handleCreateCampaign} saving={isSaving} saveLabel="Create Campaign" />
        </fieldset>
      </Modal>

      <Modal open={showRequestModal} onClose={() => setShowRequestModal(false)} title="Submit Campaign Intake Request">
        <fieldset disabled={isSaving} className="space-y-4 disabled:cursor-wait disabled:opacity-70">
          <Field label="Request Title" value={requestForm.title} onChange={(value) => setRequestForm({ ...requestForm, title: value })} placeholder="e.g. Q4 Independence Promo Video Campaign" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SelectField label="Division" value={requestForm.division} onChange={(value) => setRequestForm({ ...requestForm, division: value })} options={[['re', 'Real Estate'], ['ben', 'Benji'], ['eng', 'Engineering']]} />
            <SelectField label="Department" value={requestForm.department} onChange={(value) => setRequestForm({ ...requestForm, department: value })} options={[['', 'Not selected'], ...departmentOptions]} />
            <Field label="Branch ID" type="number" value={requestForm.branchId} onChange={(value) => setRequestForm({ ...requestForm, branchId: value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Needed by" type="date" value={requestForm.neededBy} onChange={(value) => setRequestForm({ ...requestForm, neededBy: value })} />
            <SelectField label="Priority" value={requestForm.priority} onChange={(value) => setRequestForm({ ...requestForm, priority: value })} options={[['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']]} />
            <Field label="Requested Budget (NGN)" type="number" value={requestForm.proposedBudget} onChange={(value) => setRequestForm({ ...requestForm, proposedBudget: value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Audience" value={requestForm.audience} onChange={(value) => setRequestForm({ ...requestForm, audience: value })} />
            <Field label="Product" value={requestForm.product} onChange={(value) => setRequestForm({ ...requestForm, product: value })} />
          </div>
          <TextAreaField label="Problem" value={requestForm.problem} onChange={(value) => setRequestForm({ ...requestForm, problem: value })} placeholder="Explain the problem or opportunity this campaign should address" />
          <TextAreaField label="Expected outcome" value={requestForm.expectedOutcome} onChange={(value) => setRequestForm({ ...requestForm, expectedOutcome: value })} placeholder="Qualified leads, sales conversion, awareness, retention, or revenue goal" />
          <TextAreaField label="Context" value={requestForm.context} onChange={(value) => setRequestForm({ ...requestForm, context: value })} placeholder="Any useful background, timing, dependencies, or constraints" />
          <ModalActions onCancel={() => setShowRequestModal(false)} onSave={handleSubmitRequest} saving={isSaving} saveLabel="Submit Request" />
        </fieldset>
      </Modal>

      <Modal open={!!workspaceCampaign} onClose={() => setWorkspaceCampaign(null)} title={workspaceCampaign?.name || 'Campaign Workspace'} size="lg">
        {workspaceError && <ErrorState message={workspaceError} compact />}
        {!workspace && !workspaceError && (
          <div className="space-y-4">
            <SkeletonKpiGrid cards={3} />
            <SkeletonList rows={5} />
          </div>
        )}
        {workspace && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Budget Spent" value={formatMoney(workspace.campaign.spent)} sub={`${workspace.campaign.budget ? Math.round((workspace.campaign.spent / workspace.campaign.budget) * 100) : 0}% of ${formatMoney(workspace.campaign.budget)}`} />
              <MetricCard label="Leads Generated" value={workspace.campaign.leads} sub={workspace.campaign.cpl} />
              <MetricCard label="Status" value={normalizeStatus(workspace.campaign.status)} sub={workspace.campaign.owner || 'Owner pending'} />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-text">Campaign tasks</div>
              {workspace.tasks.length === 0 && <EmptyState title="No workspace tasks" description="No tasks were returned for this workspace." icon="ti-list-check" compact />}
              {workspace.tasks.map((task) => (
                <div key={String(idOf(task) || task.title)} className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-surface-1 text-xs">
                  <span className="font-semibold text-text">{task.title || task.name || 'Untitled task'}</span>
                  <button type="button" onClick={() => handleTaskStatus(task, 'done')} className="px-2.5 py-1 rounded-lg border border-border bg-surface text-[10.5px] font-bold text-text hover:bg-surface-2">
                    Mark done
                  </button>
                </div>
              ))}
            </div>

            <fieldset disabled={isSaving} className="rounded-xl border border-border bg-surface-1 p-3 space-y-3 disabled:cursor-wait disabled:opacity-70">
              <div className="flex items-center gap-2">
                <SelectField label="Add workspace item" value={workspaceAction} onChange={setWorkspaceAction} options={[['task', 'Task'], ['update', 'Update'], ['expense', 'Expense'], ['asset', 'Asset'], ['risk', 'Risk'], ['decision', 'Decision'], ['post-analysis', 'Post analysis']]} />
              </div>
              {workspaceAction === 'task' && <Field label="Task title" value={taskTitle} onChange={setTaskTitle} />}
              {workspaceAction === 'update' && <TextAreaField label="Progress update" value={updateText} onChange={setUpdateText} />}
              {workspaceAction === 'expense' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Vendor" value={expenseForm.vendor} onChange={(value) => setExpenseForm({ ...expenseForm, vendor: value })} />
                  <Field label="Amount (NGN)" type="number" value={expenseForm.amount} onChange={(value) => setExpenseForm({ ...expenseForm, amount: value })} />
                </div>
              )}
              {workspaceAction === 'asset' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Asset name" value={assetForm.name} onChange={(value) => setAssetForm({ ...assetForm, name: value })} />
                  <SelectField label="Asset type" value={assetForm.type} onChange={(value) => setAssetForm({ ...assetForm, type: value })} options={[['creative', 'Creative'], ['copy', 'Copy'], ['media', 'Media'], ['other', 'Other']]} />
                </div>
              )}
              {workspaceAction === 'decision' && <TextAreaField label="Decision" value={decisionText} onChange={setDecisionText} />}
              {workspaceAction === 'risk' && (
                <div className="space-y-3">
                  <Field label="Risk title" value={riskForm.title} onChange={(value) => setRiskForm({ ...riskForm, title: value })} />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <SelectField label="Severity" value={riskForm.severity} onChange={(value) => setRiskForm({ ...riskForm, severity: value })} options={[['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']]} />
                    <SelectField label="Owner" value={riskForm.ownerId} onChange={(value) => setRiskForm({ ...riskForm, ownerId: value })} options={[['', 'Unassigned'], ...employeeOptions]} />
                  </div>
                  <TextAreaField label="Mitigation" value={riskForm.mitigation} onChange={(value) => setRiskForm({ ...riskForm, mitigation: value })} />
                </div>
              )}
              {workspaceAction === 'post-analysis' && (
                <div className="space-y-3">
                  <TextAreaField label="Conclusion" value={postAnalysisForm.conclusion} onChange={(value) => setPostAnalysisForm({ ...postAnalysisForm, conclusion: value })} />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextAreaField label="What worked" value={postAnalysisForm.worked} onChange={(value) => setPostAnalysisForm({ ...postAnalysisForm, worked: value })} />
                    <TextAreaField label="What failed" value={postAnalysisForm.failed} onChange={(value) => setPostAnalysisForm({ ...postAnalysisForm, failed: value })} />
                  </div>
                  <TextAreaField label="Next actions" value={postAnalysisForm.nextActions} onChange={(value) => setPostAnalysisForm({ ...postAnalysisForm, nextActions: value })} />
                  <label className="flex items-center gap-2 text-xs font-bold text-text-2">
                    <input type="checkbox" checked={postAnalysisForm.markCompleted} onChange={(event) => setPostAnalysisForm({ ...postAnalysisForm, markCompleted: event.target.checked })} className="h-4 w-4 rounded border-border accent-navy" />
                    Mark campaign completed
                  </label>
                </div>
              )}
              <button type="button" onClick={handleWorkspaceAction} disabled={isSaving} className="px-4 py-2 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
                {isSaving ? <BusyLabel>Saving...</BusyLabel> : 'Save workspace item'}
              </button>
            </fieldset>
          </div>
        )}
      </Modal>
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: ReactNode; sub: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
      <div className="text-xs text-text-3 font-medium mb-1">{label}</div>
      <div className="text-2xl font-extrabold text-text tracking-tight">{value}</div>
      <div className="text-xs text-text-3 font-medium mt-1">{sub}</div>
    </div>
  )
}

function CampaignCard({ campaign, onOpen, onPauseResume }: { campaign: Campaign; onOpen: () => void; onPauseResume: () => void }) {
  const spentPct = campaign.budget ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100)) : 0
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-2.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`pill d-${campaign.div} whitespace-nowrap shrink-0`}>{campaign.div}</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> {normalizeStatus(campaign.status)}
            </span>
          </div>
          <h3 className="text-sm font-bold text-text">{campaign.name}</h3>
          <p className="text-[10.5px] font-medium text-text-3 mt-0.5">
            Owner: {campaign.owner || 'Unassigned'} {campaign.startDate || campaign.endDate ? `- ${campaign.startDate || 'TBD'} to ${campaign.endDate || 'TBD'}` : ''}
          </p>
        </div>
        <button type="button" onClick={onOpen} className="px-3 py-1 text-xs font-semibold text-text border border-border rounded-lg bg-surface hover:bg-surface-1 shrink-0">
          Open
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-left p-3 bg-surface-1 rounded-xl border border-border/60">
        <SmallMetric label="Leads" value={campaign.leads} />
        <SmallMetric label="CPL" value={campaign.cpl} />
        <SmallMetric label="Conv." value={campaign.conv} />
        <SmallMetric label="Days" value={campaign.days ?? '-'} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-text-3">{formatMoney(campaign.spent)} spent</span>
          <span className="text-text-3">{spentPct}% of {formatMoney(campaign.budget)}</span>
        </div>
        <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-navy rounded-full" style={{ width: `${spentPct}%` }} />
        </div>
      </div>

      <div className="text-[11px] font-medium text-text-3 flex items-center gap-1 pt-1">
        <AppIcon name="home" size={14} /> {campaign.channels}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border/60">
        <button type="button" onClick={onOpen} className="flex-1 py-1.5 text-xs font-semibold text-white bg-navy rounded-xl hover:bg-navy-dark transition-all flex items-center justify-center gap-1">
          <AppIcon name="layout-grid" size={14} /> Workspace
        </button>
        <button type="button" onClick={onPauseResume} className="px-3 py-1.5 text-xs font-semibold text-text border border-border bg-surface rounded-xl hover:bg-surface-1 transition-all flex items-center gap-1">
          <AppIcon name="player-pause" size={14} /> {campaign.status === 'paused' ? 'Resume' : 'Pause'}
        </button>
      </div>
    </div>
  )
}

function SmallMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-text-3">{label}</div>
      <div className="text-sm font-extrabold text-text mt-0.5">{value}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-text-2 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy" />
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-text-2 mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs text-text outline-none focus:border-navy resize-none" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="block text-xs font-bold text-text-2 mb-1">{label}</label>
      <Select
        options={options.map(([val, lbl]) => ({ value: val, label: lbl }))}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  )
}

function ModalActions({ onCancel, onSave, saving, saveLabel }: { onCancel: () => void; onSave: () => void; saving: boolean; saveLabel: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-border">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-text hover:bg-surface-1">Cancel</button>
      <button type="button" onClick={onSave} disabled={saving} className="px-4 py-2 rounded-xl bg-navy text-xs font-bold text-white shadow-xs hover:bg-navy-dark disabled:opacity-50">
        {saving ? <BusyLabel>Saving...</BusyLabel> : saveLabel}
      </button>
    </div>
  )
}
