/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Activity, Lead, Campaign, ContentItem, Realtor } from '../../data/types'
import { pluralize } from '../../utils/formatters'

function pickArray(...values: any[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value
  }
  return []
}

function moneyLike(value: any, fallback = 'NGN 0') {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'number') return `NGN ${value.toLocaleString()}`
  return String(value)
}

const BACKEND_DIVISION_TO_UI: Record<string, string> = {
  real_estate: 're',
  realestate: 're',
  'real estate': 're',
  benji: 'ben',
  engineering: 'eng',
  surveying: 'sur',
  ict: 'ict',
  agriculture: 'agr',
}

function toUiDivision(value: any) {
  if (!value) return 're'
  const key = String(value).trim().toLowerCase()
  return BACKEND_DIVISION_TO_UI[key] || String(value)
}

function textLike(value: any, fallback = '') {
  if (value === undefined || value === null || value === '') return fallback
  return String(value)
}

function numberLike(value: any, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function dateKey(value: any) {
  if (!value) return ''
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

function formatShortDate(value: any, fallback = 'TBD') {
  const key = dateKey(value)
  if (!key) return fallback
  return new Date(`${key}T00:00:00`).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function startOfWeek(value?: string) {
  const base = value ? new Date(`${value}T00:00:00`) : new Date()
  const day = base.getDay()
  const offset = day === 0 ? -6 : 1 - day
  return addDays(base, offset)
}

function statusVariant(status: any) {
  const key = String(status || '').toLowerCase().replace(/\s+/g, '_')
  if (key.includes('publish') || key === 'done' || key === 'completed') return 'p-won'
  if (key.includes('review') || key.includes('approval')) return 'p-review'
  if (key.includes('overdue') || key.includes('blocked')) return 'p-over'
  if (key.includes('progress') || key.includes('production')) return 'p-prop'
  if (key.includes('brief') || key.includes('new') || key.includes('idea')) return 'p-new'
  if (key.includes('pause')) return 'p-pause'
  if (key.includes('active')) return 'p-active'
  return 'p-draft'
}

function normalizeLabel(value: any, fallback: string) {
  const raw = textLike(value, fallback).replace(/_/g, ' ').trim()
  return raw ? raw.replace(/\b\w/g, (char) => char.toUpperCase()) : fallback
}

function extractItems(source: any, keys: string[]) {
  for (const key of keys) {
    const value = source?.[key]
    if (Array.isArray(value)) return value
  }
  return []
}

export function transformBackendLeadActivity(activity: any): Activity {
  const type = activity.activity_type_display || activity.activity_type || activity.channel || activity.title || 'Activity'
  const outcome = activity.outcome_display || activity.outcome || ''
  const note = activity.note || activity.notes || activity.t || 'Activity logged'
  const author = activity.created_by_name || activity.actor || activity.owner || 'Team member'
  const created = activity.created_at || activity.m || 'Just now'
  const nextAction = activity.next_action || activity.nextAction || ''

  return {
    id: activity.id ? String(activity.id) : undefined,
    t: `${type}${outcome ? ` - ${outcome}` : ''}: ${note}${nextAction ? ` (Next: ${nextAction})` : ''}`,
    m: `${created}${author ? ` - ${author}` : ''}`,
    note,
    nextAction,
    nextFollowup: activity.next_follow_up_at || activity.nextFollowup || '',
  }
}

export function transformBackendLead(bLead: any): Lead {
  const fullName = [bLead.first_name, bLead.last_name].filter(Boolean).join(' ').trim()
    || bLead.name
    || bLead.full_name
    || 'Unnamed Lead'

  return {
    id: String(bLead.id || bLead.lead_id || bLead.uuid || fullName),
    name: fullName,
    phone: bLead.phone || bLead.phone_number || '',
    div: toUiDivision(bLead.division || bLead.div) as any,
    source: bLead.source_display || bLead.source || 'Direct',
    campaign: bLead.campaign || bLead.campaign_name || '-',
    budget: bLead.budget || bLead.budget_range || (bLead.budget_naira ? moneyLike(bLead.budget_naira) : '-'),
    stage: (bLead.stage || bLead.status || 'new') as any,
    assigned: bLead.assigned || bLead.assigned_to_name || bLead.assigned_user_name || 'Unassigned',
    color: bLead.color || '#DBEAFE',
    tc: bLead.tc || '#1E40AF',
    value: bLead.value || moneyLike(bLead.estimated_value || bLead.deal_value_naira, '-'),
    overdue: bLead.overdue || bLead.is_sla_breached || false,
    nextAction: bLead.next_action || '',
    nextFollowup: bLead.next_follow_up_at || '',
    activities: Array.isArray(bLead.activities)
      ? bLead.activities.map(transformBackendLeadActivity)
      : [],
  }
}

export function transformBackendCampaign(bCamp: any): Campaign {
  return {
    id: String(bCamp.id || bCamp.campaign_id || bCamp.uuid || bCamp.name || bCamp.title),
    div: toUiDivision(bCamp.division || bCamp.div) as any,
    name: bCamp.name || bCamp.title || 'Untitled Campaign',
    status: (bCamp.status || 'active') as any,
    budget: Number(bCamp.budget_naira || bCamp.budget || bCamp.approved_budget || bCamp.proposed_budget || 0),
    spent: Number(bCamp.spent_naira || bCamp.spent || bCamp.total_spend || 0),
    leads: bCamp.leads_count || bCamp.leads || bCamp.leads_generated || 0,
    cpl: moneyLike(bCamp.cost_per_lead || bCamp.cpl, 'NGN 0'),
    conv: bCamp.conversion_rate || bCamp.conv || '0%',
    days: bCamp.active_days || bCamp.days_remaining || bCamp.days || null,
    channels: Array.isArray(bCamp.channels) ? bCamp.channels.join(', ') : bCamp.channels || bCamp.channel || 'Digital',
    owner: bCamp.owner || bCamp.owner_name || bCamp.created_by_name || '',
    startDate: bCamp.start_date || '',
    endDate: bCamp.end_date || '',
  }
}

export function transformCampaignPanel(data: any) {
  const source = data?.data || data || {}
  const campaigns = pickArray(
    source.campaigns,
    source.items,
    source.results,
    source.panel?.campaigns,
    Array.isArray(source) ? source : null,
  ).map(transformBackendCampaign)

  const metrics = source.metrics || source.kpis || source.summary || source.panel?.metrics || {}
  const requests = pickArray(source.requests, source.campaign_requests, source.panel?.requests)

  return {
    campaigns,
    requests,
    metrics: {
      activeCampaigns: metrics.active_campaigns ?? metrics.activeCampaigns ?? campaigns.filter((c: Campaign) => c.status === 'active').length,
      totalCampaigns: metrics.total_campaigns ?? metrics.totalCampaigns ?? campaigns.length,
      approvedBudget: metrics.approved_budget ?? metrics.approvedBudget ?? campaigns.reduce((sum: number, c: Campaign) => sum + c.budget, 0),
      spent: metrics.spent ?? metrics.total_spend ?? campaigns.reduce((sum: number, c: Campaign) => sum + c.spent, 0),
      leadsGenerated: metrics.leads_generated ?? metrics.leadsGenerated ?? campaigns.reduce((sum: number, c: Campaign) => sum + Number(c.leads || 0), 0),
      attributedRevenue: metrics.attributed_revenue ?? metrics.attributedRevenue ?? metrics.revenue ?? 0,
      roas: metrics.roas ?? '0x',
    },
  }
}

export function transformCampaignWorkspace(data: any) {
  const source = data?.data || data || {}
  const campaign = source.campaign || source
  return {
    campaign: transformBackendCampaign(campaign),
    metrics: source.metrics || source.kpis || {},
    tasks: pickArray(source.tasks, source.campaign_tasks, campaign.tasks),
    assets: pickArray(source.assets, source.campaign_assets, campaign.assets),
    updates: pickArray(source.updates, source.campaign_updates, campaign.updates),
    expenses: pickArray(source.expenses, campaign.expenses),
    risks: pickArray(source.risks, campaign.risks),
    decisions: pickArray(source.decisions, campaign.decisions),
  }
}

export interface MarketingPipelineLead {
  id: string | number
  name: string
  source: string
  division: string
  divisionLabel: string
  stage: string
  stageLabel: string
  score: number
  priority: string
  owner: string
  value: number
  valueLabel: string
  overdue: boolean
  nextAction: string
  slaLabel: string
  ageDays: number
}

export interface MarketingPipelineStage {
  id: string
  label: string
  leads: MarketingPipelineLead[]
}

function pipelineRowName(row: any) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim()
    || row.lead
    || row.name
    || row.full_name
    || row.lead_name
    || row.deal_name
    || row.customer
    || 'Unnamed lead'
}

function pipelineRowStage(row: any) {
  return String(row.stage || row.status || row.stage_slug || row.slug || 'new')
}

export function transformPipelineLead(row: any): MarketingPipelineLead {
  const name = pipelineRowName(row)
  const stage = pipelineRowStage(row)
  const division = toUiDivision(row.division || row.div)
  const value = numberLike(row.value || row.estimated_value || row.deal_value_naira || row.budget_naira)

  return {
    id: row.id || row.lead_id || row.uuid || row.deal_id || name,
    name,
    source: textLike(row.source_display || row.source || row.channel || row.lead_source, 'Unknown source'),
    division,
    divisionLabel: textLike(row.division_display || row.division_label, normalizeLabel(division, 'Division')),
    stage,
    stageLabel: textLike(row.stage_label || row.status_display, normalizeLabel(stage, 'Stage')),
    score: numberLike(row.score || row.lead_score),
    priority: textLike(row.priority_display || row.priority, 'Unscored'),
    owner: textLike(row.owner || row.assigned || row.assigned_to_name || row.assigned_user_name || row.owner_name, 'Unassigned'),
    value,
    valueLabel: row.value_label || row.value_display || moneyLike(value, 'NGN 0'),
    overdue: Boolean(row.overdue || row.is_overdue || row.is_sla_breached || row.sla_status === 'breached'),
    nextAction: textLike(row.next_action || row.nextAction, 'No next action recorded'),
    slaLabel: textLike(row.sla_label || row.sla_status, 'No SLA'),
    ageDays: numberLike(row.age_days || row.age),
  }
}

function normalizePipelineSource(data: any) {
  if (Array.isArray(data)) return { rows: data }
  const payload = data?.data
  if (Array.isArray(payload)) return { rows: payload }
  if (payload && typeof payload === 'object') return payload
  return data || {}
}

// Flatten stage data whether the backend sends an object keyed by stage
// ({ new: [...] }) or an array of stage objects ({ slug, leads/deals: [...] }).
function flattenGroupedStages(grouped: any): any[] {
  if (!grouped || typeof grouped !== 'object') return []
  if (Array.isArray(grouped)) {
    return grouped.flatMap((stage: any) => {
      if (!stage || typeof stage !== 'object') return []
      const stageKey = stage.stage || stage.slug || stage.name || stage.id
      const stageLeads = extractItems(stage, ['leads', 'deals', 'items', 'rows'])
      if (!stageLeads.length) return []
      return stageLeads.map((item: any) => ({
        ...item,
        stage: item.stage || item.stage_slug || stageKey || item.status,
      }))
    })
  }
  return Object.entries(grouped).flatMap(([stage, value]) =>
    Array.isArray(value) ? value.map((item: any) => ({ ...item, stage: item.stage || item.stage_slug || stage })) : [],
  )
}

export function transformLeadPipeline(data: any) {
  const source = normalizePipelineSource(data)
  const stageLabels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal: 'Proposal sent',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
  }

  let rows = extractItems(source, ['rows', 'leads', 'items', 'results', 'deals'])
  if (rows.length === 0) rows = extractItems(source.pipeline || {}, ['rows', 'leads', 'items', 'results', 'deals'])
  if (rows.length === 0) rows = extractItems(source.data || {}, ['rows', 'leads', 'items', 'results', 'deals'])

  const grouped = source.stages || source.stage_groups || source.columns || source.pipeline?.stages || {}
  if (rows.length === 0) {
    rows = flattenGroupedStages(grouped)
  }

  // Stage ordering: explicit list, else derived from grouped keys, else the 7 defaults.
  const rawOrdered = pickArray(source.stage_order, source.stages_order, source.pipeline?.stage_order)
  let stageIds: string[] = rawOrdered
    .map((stage: any) => (typeof stage === 'string' ? stage : stage?.slug || stage?.name || (stage?.id !== undefined ? String(stage.id) : '')))
    .filter(Boolean)
  if (stageIds.length === 0 && typeof grouped === 'object' && !Array.isArray(grouped)) {
    stageIds = Object.keys(grouped)
  }
  if (stageIds.length === 0 && Array.isArray(grouped)) {
    stageIds = grouped
      .map((stage: any) => stage?.slug || stage?.name || stage?.stage || (stage?.id !== undefined ? String(stage.id) : ''))
      .filter(Boolean)
  }
  const fallbackStages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  if (stageIds.length === 0) stageIds = fallbackStages

  const leads = rows.map(transformPipelineLead)

  const stageLabelFor = (stage: string) => {
    const meta = Array.isArray(grouped)
      ? grouped.find((item: any) => String(item?.slug || item?.name || item?.stage || item?.id) === stage)
      : null
    const label = meta?.display_name || meta?.label || meta?.name || source.stage_labels?.[stage]
    return textLike(label, stageLabels[stage] || normalizeLabel(stage, 'Stage'))
  }

  const stages: MarketingPipelineStage[] = stageIds.map((stage) => ({
    id: stage,
    label: stageLabelFor(stage),
    leads: leads.filter((lead) => lead.stage === stage),
  }))

  Array.from(new Set(leads.map((lead) => lead.stage).filter((stage) => !stageIds.includes(stage)))).forEach((stage) => {
    stages.push({
      id: stage,
      label: normalizeLabel(stage, 'Stage'),
      leads: leads.filter((lead) => lead.stage === stage),
    })
  })

  const metrics = source.metrics || source.kpis || source.summary || {}
  const totalLeads = numberLike(metrics.total_leads ?? metrics.totalLeads ?? metrics.total ?? source.count, leads.length)
  const wonCount = numberLike(
    metrics.won_leads ?? metrics.wonCount ?? metrics.closed_count ?? metrics.total_closed,
    leads.filter((lead) => lead.stage === 'won').length,
  )
  const overdueCount = numberLike(metrics.overdue ?? metrics.sla_breaches, leads.filter((lead) => lead.overdue).length)
  const pipelineValue = numberLike(
    metrics.pipeline_value ?? metrics.pipelineValue ?? metrics.total_value,
    leads.reduce((sum, lead) => sum + lead.value, 0),
  )
  const conversionRate = metrics.conversion_rate ?? metrics.conversionRate ?? metrics.conversion_pct
    ?? (totalLeads ? `${parseFloat(((wonCount / totalLeads) * 100).toFixed(1))}%` : '0%')

  return {
    stages,
    leads,
    metrics: {
      totalLeads,
      overdueCount,
      pipelineValue,
      pipelineValueLabel: moneyLike(pipelineValue, 'NGN 0'),
      conversionRate: String(conversionRate),
    },
  }
}

type PillStatusVariant = 'p-new' | 'p-contact' | 'p-qual' | 'p-prop' | 'p-neg' | 'p-won' | 'p-lost' | 'p-active' | 'p-draft' | 'p-pause' | 'p-over' | 'p-review'

export interface MarketingOption {
  value: string
  label: string
}

export interface MarketingCalendarItem {
  id?: string | number
  title: string
  format: string
  platform: string
  division: string
  divisionLabel: string
  owner: string
  status: string
  statusLabel: string
  statusVariant: PillStatusVariant
  dueDate: string
  dueLabel: string
  dayKey: string
  isOverdue: boolean
}

export function transformCalendarItem(row: any): MarketingCalendarItem {
  const dueDate = dateKey(row.due_date || row.production_deadline || row.scheduled_at || row.published_at || row.date)
  const status = textLike(row.status, 'briefed')
  const division = toUiDivision(row.division || row.div)
  return {
    id: row.id || row.item_id || row.calendar_item_id,
    title: textLike(row.title || row.name, 'Untitled content item'),
    format: textLike(row.format || row.asset_type || row.type, 'Other'),
    platform: textLike(row.platform || row.channel, 'Multiple'),
    division,
    divisionLabel: textLike(row.division_display || row.division_label, normalizeLabel(division, 'Division')),
    owner: textLike(row.owner_name || row.owner || row.assigned_creator || row.assigned_creator_name, 'Unassigned'),
    status,
    statusLabel: textLike(row.status_display || row.status_label, normalizeLabel(status, 'Status')),
    statusVariant: statusVariant(status) as PillStatusVariant,
    dueDate,
    dueLabel: formatShortDate(dueDate),
    dayKey: dateKey(row.scheduled_at || row.published_at || row.due_date || row.production_deadline || row.date),
    isOverdue: Boolean(row.is_overdue || row.overdue || status.toLowerCase() === 'overdue'),
  }
}

export function transformContentCalendar(data: any, weekStart?: string) {
  const source = data?.data || data || {}
  const metadata = source.metadata || {}
  let rows = extractItems(source, ['items', 'results', 'rows', 'briefs', 'calendar_items', 'content_items'])
  if (rows.length === 0) rows = extractItems(source.calendar || {}, ['items', 'results', 'rows', 'briefs'])
  if (rows.length === 0 && Array.isArray(source.days)) {
    rows = source.days.flatMap((day: any) =>
      pickArray(day.items, day.content, day.briefs).map((item: any) => ({
        ...item,
        date: item.date || day.date || day.day,
      })),
    )
  }

  const items = rows.map(transformCalendarItem)
  const firstDay = startOfWeek(source.week_start || source.period?.start || weekStart)
  const backendDays = Array.isArray(source.days) ? source.days : []
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(firstDay, index)
    const key = date.toISOString().slice(0, 10)
    const backendDay = backendDays.find((day: any) => dateKey(day.date || day.day) === key) || {}
    return {
      key,
      num: date.toLocaleDateString('en-NG', { day: '2-digit' }),
      name: textLike(backendDay.weekday, date.toLocaleDateString('en-NG', { weekday: 'short' })),
      isToday: Boolean(backendDay.is_today),
      items: items.filter((item) => item.dayKey === key),
    }
  })

  const publishedCount = items.filter((item) => item.status.toLowerCase().includes('publish') || item.status.toLowerCase() === 'done').length
  const overdueCount = items.filter((item) => item.isOverdue).length
  const kpis = source.kpis || source.summary || source.metrics || {}
  const total = numberLike(kpis.total ?? source.count, items.length)
  const target = numberLike(kpis.target ?? source.target, total)
  const optionsFrom = (key: string, fallback: MarketingOption[]) => {
    const options = metadata[key]
    return Array.isArray(options)
      ? options.map((option: any) => ({
        value: textLike(option.value),
        label: textLike(option.label || option.value, 'Option'),
      })).filter((option: MarketingOption) => option.value)
      : fallback
  }

  return {
    weekStart: firstDay.toISOString().slice(0, 10),
    weekEnd: addDays(firstDay, 6).toISOString().slice(0, 10),
    label: textLike(source.label, ''),
    days,
    items,
    summary: {
      total,
      publishedCount: numberLike(kpis.published, publishedCount),
      scheduledCount: numberLike(kpis.scheduled),
      inProgressCount: numberLike(kpis.in_progress ?? kpis.inProgress),
      target,
      overdueCount: numberLike(kpis.overdue, overdueCount),
      publishedLabel: textLike(kpis.published_label, `${publishedCount} / ${target || total} published`),
    },
    metadata: {
      statuses: optionsFrom('statuses', []),
      formats: optionsFrom('formats', []),
      platforms: optionsFrom('platforms', []),
      divisions: optionsFrom('divisions', []),
      funnelStages: optionsFrom('funnel_stages', []),
    },
  }
}

export interface MarketingMediaAsset {
  id?: string | number
  title: string
  assetType: string
  division: string
  divisionLabel: string
  sizeLabel: string
  fileUrl: string
  thumbnailUrl: string
  owner: string
  status: string
  description: string
  icon: string
  bg: string
}

export function transformMediaAsset(row: any): MarketingMediaAsset {
  const assetType = textLike(row.asset_type || row.type || row.mime_type, 'other').toLowerCase()
  const division = toUiDivision(row.division || row.div)
  const fileSize = numberLike(row.file_size_bytes || row.size_bytes)
  const typeIcon = assetType.includes('video')
    ? 'ti-video'
    : assetType.includes('image') || assetType.includes('photo')
      ? 'ti-photo'
      : assetType.includes('audio')
        ? 'ti-music'
        : 'ti-file-text'
  const typeBg = assetType.includes('video')
    ? 'bg-[#1E3A8A]'
    : assetType.includes('image') || assetType.includes('photo')
      ? 'bg-[#047857]'
      : assetType.includes('audio')
        ? 'bg-[#7C3AED]'
        : 'bg-[#D97706]'

  return {
    id: row.id || row.asset_id || row.media_asset_id,
    title: textLike(row.title || row.name, 'Untitled asset'),
    assetType,
    division,
    divisionLabel: textLike(row.division_display || row.division_label, normalizeLabel(division, 'Division')),
    sizeLabel: row.file_size_display || row.size || (fileSize ? `${parseFloat((fileSize / 1000000).toFixed(1))} MB` : 'Size not recorded'),
    fileUrl: textLike(row.file_url || row.url || row.external_url),
    thumbnailUrl: textLike(row.thumbnail_url || row.thumbnail),
    owner: textLike(row.owner_name || row.owner, 'Unassigned'),
    status: textLike(row.status, 'active'),
    description: textLike(row.description),
    icon: row.icon || typeIcon,
    bg: row.bg || typeBg,
  }
}

export function transformMediaLibrary(data: any) {
  const source = data?.data || data || {}
  const metadata = source.metadata || {}
  const rows = extractItems(source, ['assets', 'items', 'results', 'rows', 'media_assets'])
  const assets = rows.map(transformMediaAsset)
  const summary = source.summary || source.metrics || {}
  const totalAssets = numberLike(summary.total_assets ?? summary.count ?? source.count, assets.length)
  const optionsFrom = (key: string) => {
    const options = metadata[key]
    return Array.isArray(options)
      ? options.map((option: any) => ({
        value: textLike(option.value),
        label: textLike(option.label || option.value, 'Option'),
      })).filter((option: MarketingOption) => option.value)
      : []
  }
  const typeCounts = Array.isArray(summary.type_counts)
    ? summary.type_counts.map((item: any) => ({
      value: textLike(item.asset_type || item.value),
      label: textLike(item.label || item.asset_type, 'Type'),
      count: numberLike(item.count),
    })).filter((item: { value: string }) => item.value)
    : []

  return {
    assets,
    summary: {
      totalAssets,
      activeAssets: numberLike(summary.active_assets),
      archivedAssets: numberLike(summary.archived_assets),
      totalSizeBytes: numberLike(summary.total_size_bytes),
      storageUsed: textLike(summary.total_size_display || summary.storage_used || summary.storageUsed || source.storage_used, ''),
      typeCounts,
    },
    metadata: {
      assetTypes: optionsFrom('asset_types'),
      statuses: optionsFrom('statuses'),
      divisions: optionsFrom('divisions'),
    },
    dataNotes: Array.isArray(source.data_notes) ? source.data_notes.map((note: any) => String(note)) : [],
  }
}

function itemId(row: any) {
  return row.id || row.partner_id || row.task_id || row.report_id || row.commission_id || row.placement_id || row.inquiry_id || row.name || row.title
}

function initialsFrom(value: any) {
  const text = textLike(value, 'NA')
  return text.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function percentLabel(value: any) {
  if (value === undefined || value === null || value === '') return '0%'
  const text = String(value)
  return text.includes('%') ? text : `${text}%`
}

function arrayFromSource(source: any, keys: string[]) {
  return extractItems(source, keys)
}

export interface OperationsMetric {
  key: string
  label: string
  value: string | number
  foot?: string
}

export interface EmailAudienceOption {
  id: string
  label: string
  count?: number
}

export interface EmailCampaignRow {
  id?: string | number
  name: string
  segment: string
  date: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  status: string
}

export interface PartnerOperationsRow {
  id?: string | number
  init: string
  name: string
  category: string
  categoryLabel: string
  status: string
  phone: string
  email: string
  meta: string
  valueLabel: string
}

export interface TraditionalMediaRow {
  id?: string | number
  name: string
  placementType: string
  vendor: string
  location: string
  ownership: string
  amountLabel: string
  startDate: string
  startDateValue: string
  endDate: string
  endDateValue: string
  status: string
  proofUrl: string
  daysLabel: string
  daysClass: string
  notes: string
}

export interface PartnerTaskRow {
  id?: string | number
  partnerId?: number
  partnerName: string
  partnerType: string
  campaignId?: number
  title: string
  objective: string
  dueDate: string
  feeLabel: string
  proofRequirement: string
  trackingUrl: string
  status: string
  reach: number
  leadCount: number
}

export interface PartnerReportRow {
  id?: string | number
  taskId?: number
  taskTitle: string
  partnerName: string
  reach: number
  leadCount: number
  proofUrl: string
  note: string
  status: string
}

export interface PartnerCommissionRow {
  id?: string | number
  partnerId?: number
  partnerName: string
  leadId?: number
  amountBasisLabel: string
  commissionRate: string
  commissionDueLabel: string
  status: string
  paidLabel: string
  note: string
}

export interface PartnerPortalSession {
  partner?: PartnerOperationsRow
  tasks: PartnerTaskRow[]
  metrics: OperationsMetric[]
}

export interface ServiceOrderHandoffRow {
  id?: string | number
  orderNumber: string
  name: string
  meta: string
  amountLabel: string
  status: string
  paymentStatus: string
  validUntil: string
  steps: { label: string; done?: boolean; active?: boolean }[]
}

export function transformPartnerDashboard(data: any) {
  const source = data?.data || data || {}
  const cards = arrayFromSource(source, ['kpi_cards', 'cards'])

  return {
    metrics: cards.slice(0, 3).map((card: any, index: number) => ({
      key: textLike(card.key, `metric_${index}`),
      label: textLike(card.label || card.title, 'Metric'),
      value: card.value ?? 0,
      foot: textLike(card.foot || card.subtitle || card.description),
    })) as OperationsMetric[],
  }
}

export function transformPartnerRows(data: any) {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['partners', 'items', 'results', 'rows', 'directory'])
  return rows.map((row: any): PartnerOperationsRow => {
    const name = textLike(row.name || row.partner || row.agency_name || row.contact_person, 'Unnamed partner')
    const category = textLike(row.category || row.partner_type || row.type, 'partner')
    const closed = row.closed || row.referrals_closed || row.closed_value || row.revenue || row.total_revenue
    const commission = row.commission_rate || row.commission_rate_pct
    const phone = textLike(row.phone || row.phone_number)
    return {
      id: itemId(row),
      init: initialsFrom(name),
      name,
      category,
      categoryLabel: textLike(row.category_display || row.partner_type_display, normalizeLabel(category, 'Partner')),
      status: textLike(row.status, 'pending'),
      phone,
      email: textLike(row.email),
      meta: [
        row.registered_since || row.since || row.created_at ? `Since ${formatShortDate(row.registered_since || row.since || row.created_at)}` : '',
        commission ? `Commission: ${commission}${String(commission).includes('%') ? '' : '%'}` : '',
        phone,
      ].filter(Boolean).join(' - '),
      valueLabel: closed === undefined || closed === null || closed === '' ? '-' : moneyLike(closed, 'NGN 0'),
    }
  })
}

export function transformEmailAudiences(data: any) {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['audiences', 'groups', 'items', 'results', 'rows'])
  if (rows.length) {
    return rows.map((row: any, index: number): EmailAudienceOption => {
      const rawId = row.id || row.key || row.slug || row.value || row.name || row.label || `audience_${index}`
      return {
        id: textLike(rawId, `audience_${index}`),
        label: textLike(row.label || row.name || row.title, normalizeLabel(rawId, 'Audience')),
        count: row.count === undefined ? undefined : numberLike(row.count),
      }
    })
  }

  return Object.entries(source)
    .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
    .map(([key, value]) => ({
      id: key,
      label: normalizeLabel(key, 'Audience'),
      count: typeof value === 'number' ? value : undefined,
    }))
}

export function transformEmailCampaigns(data: any) {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['campaigns', 'items', 'results', 'rows'])
  return rows.map((row: any): EmailCampaignRow => {
    const sent = numberLike(row.sent ?? row.sent_count ?? row.total_sent)
    const delivered = numberLike(row.delivered ?? row.delivered_count, sent)
    const opened = numberLike(row.opened ?? row.opened_count ?? row.opens)
    const clicked = numberLike(row.clicked ?? row.clicked_count ?? row.clicks)
    return {
      id: itemId(row),
      name: textLike(row.name || row.title || row.subject, 'Untitled campaign'),
      segment: textLike(row.segment || row.audience || row.audience_group || row.audience_label, 'Audience not recorded'),
      date: formatShortDate(row.sent_at || row.scheduled_at || row.created_at || row.date, '-'),
      sent,
      delivered,
      opened,
      clicked,
      status: textLike(row.status, 'draft'),
    }
  })
}

export function transformEmailMetrics(campaigns: EmailCampaignRow[]): OperationsMetric[] {
  const sent = campaigns.reduce((sum, row) => sum + row.sent, 0)
  const delivered = campaigns.reduce((sum, row) => sum + row.delivered, 0)
  const opened = campaigns.reduce((sum, row) => sum + row.opened, 0)
  const clicked = campaigns.reduce((sum, row) => sum + row.clicked, 0)
  const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0
  const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0
  const clickRate = delivered > 0 ? Math.round((clicked / delivered) * 100) : 0
  return [
    { key: 'sent', label: 'Emails sent', value: sent.toLocaleString(), foot: 'Backend campaign rows' },
    { key: 'delivery', label: 'Delivery rate', value: `${deliveryRate}%`, foot: 'Delivered / sent' },
    { key: 'open', label: 'Open rate', value: `${openRate}%`, foot: 'Opened / delivered' },
    { key: 'click', label: 'Click rate', value: `${clickRate}%`, foot: 'Clicked / delivered' },
  ]
}

function daysUntilLabel(endDate: any, status: any) {
  const key = dateKey(endDate)
  if (!key) return { label: normalizeLabel(status, 'Unknown'), cls: 'bg-surface-1 text-text-3 border-border' }
  const today = new Date()
  const end = new Date(`${key}T00:00:00`)
  const diff = Math.ceil((end.getTime() - new Date(today.toISOString().slice(0, 10)).getTime()) / 86400000)
  if (diff < 0) return { label: `Expired ${Math.abs(diff)}d`, cls: 'bg-rose-50 text-rose-800 border-rose-200' }
  if (diff <= 14) return { label: pluralize(diff, 'day'), cls: 'bg-amber-50 text-amber-800 border-amber-200' }
  return { label: pluralize(diff, 'day'), cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
}

export function transformTraditionalMediaDashboard(data: any) {
  const source = data?.data || data || {}
  const cards = arrayFromSource(source, ['kpi_cards', 'cards'])
  return cards.slice(0, 4).map((card: any, index: number): OperationsMetric => ({
    key: textLike(card.key, `metric_${index}`),
    label: textLike(card.label || card.title, 'Metric'),
    value: card.value ?? 0,
    foot: textLike(card.foot || card.subtitle || card.description),
  }))
}

export function transformTraditionalMediaRows(data: any) {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['placements', 'items', 'results', 'rows'])
  return rows.map((row: any): TraditionalMediaRow => {
    const days = daysUntilLabel(row.end_date || row.expiry_date || row.expiry, row.status)
    return {
      id: itemId(row),
      name: textLike(row.name || row.title, 'Untitled placement'),
      placementType: textLike(row.placement_type || row.type, 'media'),
      vendor: textLike(row.vendor, 'Vendor not recorded'),
      location: textLike(row.location, 'Location not recorded'),
      ownership: textLike(row.ownership, 'rented'),
      amountLabel: moneyLike(row.amount_paid || row.amount || row.cost, 'NGN 0'),
      startDate: formatShortDate(row.start_date, '-'),
      startDateValue: dateKey(row.start_date),
      endDate: formatShortDate(row.end_date || row.expiry_date || row.expiry, '-'),
      endDateValue: dateKey(row.end_date || row.expiry_date || row.expiry),
      status: textLike(row.status, 'active'),
      proofUrl: textLike(row.proof_url || row.proof),
      daysLabel: days.label,
      daysClass: days.cls,
      notes: textLike(row.notes),
    }
  })
}

export function transformPartnerTasks(data: any) {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['tasks', 'items', 'results', 'rows'])
  return rows.map((row: any): PartnerTaskRow => ({
    id: itemId(row),
    partnerId: row.partner_id ? numberLike(row.partner_id) : undefined,
    partnerName: textLike(row.partner_name || row.partner || row.name, 'Partner not recorded'),
    partnerType: textLike(row.partner_type || row.category, 'external_partner'),
    campaignId: row.campaign_id ? numberLike(row.campaign_id) : undefined,
    title: textLike(row.title, 'Untitled task'),
    objective: textLike(row.objective || row.description),
    dueDate: formatShortDate(row.due_date, 'No due date'),
    feeLabel: moneyLike(row.fee || row.amount, 'NGN 0'),
    proofRequirement: textLike(row.proof_requirement || row.proof, 'Proof not recorded'),
    trackingUrl: textLike(row.tracking_url),
    status: textLike(row.status, 'assigned'),
    reach: numberLike(row.reach),
    leadCount: numberLike(row.lead_count || row.leads),
  }))
}

export function transformPartnerReports(data: any) {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['reports', 'items', 'results', 'rows'])
  return rows.map((row: any): PartnerReportRow => ({
    id: itemId(row),
    taskId: row.task_id ? numberLike(row.task_id) : undefined,
    taskTitle: textLike(row.task_title || row.title || row.task, 'Partner report'),
    partnerName: textLike(row.partner_name || row.partner, 'Partner not recorded'),
    reach: numberLike(row.reach),
    leadCount: numberLike(row.lead_count || row.leads),
    proofUrl: textLike(row.proof_url || row.proof),
    note: textLike(row.note || row.comment),
    status: textLike(row.status, 'submitted'),
  }))
}

export function transformPartnerCommissions(data: any) {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['commissions', 'items', 'results', 'rows'])
  return rows.map((row: any): PartnerCommissionRow => ({
    id: itemId(row),
    partnerId: row.partner_id ? numberLike(row.partner_id) : undefined,
    partnerName: textLike(row.partner_name || row.partner || row.name, 'Partner not recorded'),
    leadId: row.lead_id ? numberLike(row.lead_id) : undefined,
    amountBasisLabel: moneyLike(row.amount_basis || row.basis, 'NGN 0'),
    commissionRate: percentLabel(row.commission_rate || row.rate || 0),
    commissionDueLabel: moneyLike(row.commission_due || row.due || row.amount, 'NGN 0'),
    status: textLike(row.status, 'pending'),
    paidLabel: moneyLike(row.paid || row.amount_paid, 'NGN 0'),
    note: textLike(row.note),
  }))
}

export function transformPartnerPortalSession(data: any): PartnerPortalSession {
  const source = data?.data || data || {}
  const partnerRows = transformPartnerRows({ items: [source.partner || source.profile || source] })
  const tasks = transformPartnerTasks(source.tasks ? { tasks: source.tasks } : source)
  const metrics = transformPartnerDashboard(source.dashboard || source.summary || source).metrics
  return {
    partner: partnerRows[0],
    tasks,
    metrics,
  }
}

export function transformServiceOrders(data: any) {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['items', 'orders', 'results', 'rows'])
  return rows.map((row: any): ServiceOrderHandoffRow => {
    const orderStatus = textLike(row.order_status, 'pending')
    const paymentStatus = textLike(row.payment_status, 'pending')
    const paymentDone = /paid|confirmed|complete/i.test(paymentStatus)
    const complete = /complete|completed|delivered|closed/i.test(orderStatus)
    const inProgress = /progress|active|processing|approved/i.test(orderStatus)
    return {
      id: itemId(row),
      orderNumber: textLike(row.order_number || row.id, 'Order'),
      name: textLike(row.client_name || row.customer_name || row.service?.name || row.description, 'Service order'),
      meta: [
        row.order_number || row.id ? `Order ${row.order_number || row.id}` : '',
        moneyLike(row.amount, ''),
        row.assigned_to_id ? `Assigned: ${row.assigned_to_id}` : '',
        row.valid_until ? `Valid until ${formatShortDate(row.valid_until)}` : '',
      ].filter(Boolean).join(' - '),
      amountLabel: moneyLike(row.amount, 'NGN 0'),
      status: orderStatus,
      paymentStatus,
      validUntil: formatShortDate(row.valid_until, '-'),
      steps: [
        { label: 'Payment confirmed', done: paymentDone },
        { label: 'Documentation', active: paymentDone && !inProgress && !complete },
        { label: 'Allocation / Service Order', done: inProgress || complete, active: !paymentDone },
        { label: 'Operations delivery', done: complete, active: inProgress && !complete },
        { label: 'Customer onboarding', active: complete },
      ],
    }
  })
}

export interface AnalyticsCard {
  key: string
  label: string
  value: string | number
  foot?: string
  delta?: string
}

export interface AnalyticsBar {
  label: string
  value: number
  color: string
}

export interface AnalyticsTargetRow {
  metric: string
  target: string
  actual: string
  pct: string
  color: string
  valueColor: string
}

export function transformMarketingAnalytics(data: any) {
  const source = data?.data || data || {}
  const cards = arrayFromSource(source, ['kpi_cards', 'cards'])
  const charts = source.charts || source.breakdowns || {}
  const chartFrom = (keys: string[], fallbackColor: string) => {
    const rows = keys.reduce<any[]>((found, key) => found.length ? found : arrayFromSource(charts, [key]), [])
    return rows.map((row: any, index: number): AnalyticsBar => ({
      label: textLike(row.label || row.name || row.source || row.division || row.week, `Item ${index + 1}`),
      value: numberLike(row.value ?? row.count ?? row.total ?? row.actual),
      color: textLike(row.color || row.col, fallbackColor),
    }))
  }
  const targetRows = arrayFromSource(source, ['targets_vs_actual', 'target_rows', 'targets', 'rows'])

  return {
    cards: cards.slice(0, 4).map((card: any, index: number): AnalyticsCard => ({
      key: textLike(card.key, `card_${index}`),
      label: textLike(card.label || card.title, 'Metric'),
      value: card.value ?? 0,
      foot: textLike(card.foot || card.subtitle),
      delta: textLike(card.delta || card.change),
    })),
    charts: {
      leadsBySource: chartFrom(['leads_by_source', 'sources', 'source_breakdown'], '#1E3A8A'),
      leadsByDivision: chartFrom(['leads_by_division', 'divisions', 'division_breakdown'], '#047857'),
      contentOutput: chartFrom(['content_output', 'weekly_content', 'content_by_week'], '#B45309'),
    },
    targetRows: targetRows.map((row: any): AnalyticsTargetRow => {
      const pct = numberLike(row.pct ?? row.percent ?? row.progress)
      const color = pct >= 90 ? 'bg-emerald-600' : pct >= 70 ? 'bg-amber-600' : 'bg-rose-600'
      const valueColor = pct >= 90 ? 'text-emerald-700' : pct >= 70 ? 'text-amber-800' : 'text-rose-700'
      return {
        metric: textLike(row.metric || row.label || row.name, 'Metric'),
        target: textLike(row.target, '-'),
        actual: textLike(row.actual, '-'),
        pct: percentLabel(row.pct ?? row.percent ?? row.progress),
        color: textLike(row.color || row.col, color),
        valueColor: textLike(row.value_color || row.valCol, valueColor),
      }
    }),
  }
}

export interface CsrcInquiryRow {
  id?: string | number
  leadName: string
  issue: string
  meta: string
  source: string
  channel: string
  priority: string
  status: string
  assignedAgent: string
  isMissed: boolean
  responseTime: string
  createdAt: string
}

export function transformCsrcInquiry(row: any): CsrcInquiryRow {
  const createdAt = row.created_at || row.createdAt
  const responseMinutes = row.response_time_minutes ?? row.responseTimeMinutes
  const source = textLike(row.source, 'unknown')
  const channel = textLike(row.channel, source)
  return {
    id: itemId(row),
    leadName: textLike(row.lead_name || row.name || row.customer || row.full_name, 'Unnamed customer'),
    issue: textLike(row.notes || row.issue || row.inquiry_type, 'No inquiry notes recorded'),
    meta: [
      formatShortDate(createdAt, 'Date not recorded'),
      textLike(row.assigned_agent, 'Unassigned'),
      source,
    ].filter(Boolean).join(' - '),
    source,
    channel,
    priority: textLike(row.priority, 'medium'),
    status: textLike(row.status, 'new'),
    assignedAgent: textLike(row.assigned_agent, 'Unassigned'),
    isMissed: Boolean(row.is_missed || row.isMissed),
    responseTime: responseMinutes === undefined || responseMinutes === null ? '-' : `${responseMinutes} min`,
    createdAt: textLike(createdAt),
  }
}

export function transformCsrcSupport(data: any) {
  const source = data?.data || data || {}
  const inquiries = arrayFromSource(source, ['inquiries', 'items', 'results', 'rows']).map(transformCsrcInquiry)
  return {
    summary: {
      total: numberLike(source.total ?? source.summary?.total, inquiries.length),
      newCount: numberLike(source.new_count ?? source.summary?.new_count, inquiries.filter((item: CsrcInquiryRow) => item.status === 'new').length),
      pendingFollowups: numberLike(source.pending_followups ?? source.summary?.pending_followups),
      avgResponseTime: numberLike(source.avg_response_time ?? source.summary?.avg_response_time),
    },
    inquiries,
  }
}

export function transformWhatsAppInquiries(data: any) {
  const support = transformCsrcSupport(data)
  return {
    ...support,
    inquiries: support.inquiries.filter((item) =>
      `${item.source} ${item.channel}`.toLowerCase().includes('whatsapp'),
    ),
  }
}

export interface SalesPlaybookObjection {
  id: string | number
  title: string
  text: string
}

export interface SalesPlaybookGuide {
  id?: string | number
  badge: string
  title: string
  objective: string
  openingScript: string
  questions: string[]
  proofToUse: string
  primaryCta: string
  exitCriteria: string
  objections: SalesPlaybookObjection[]
}

function firstRecord(data: any) {
  if (data?.data && !Array.isArray(data.data)) return data.data
  if (Array.isArray(data?.items)) return data.items[0]
  if (Array.isArray(data?.results)) return data.results[0]
  if (Array.isArray(data?.rows)) return data.rows[0]
  return data || {}
}

export function transformSalesPlaybook(data: any, filters: { division?: string; stage?: string; persona?: string } = {}): SalesPlaybookGuide {
  const row = firstRecord(data)
  const objections = pickArray(row.objections, row.objection_library, row.responses).map((obj: any, index: number) => ({
    id: itemId(obj) || index,
    title: textLike(obj.objection || obj.title || obj.name, 'Unspecified objection'),
    text: textLike(obj.response || obj.text || obj.answer || obj.copy, 'No response guidance recorded.'),
  }))
  const questions = pickArray(row.questions, row.discovery_questions, row.qualification_questions)
    .map((question: any) => textLike(question))
    .filter(Boolean)

  return {
    id: row.id || row.playbook_id,
    badge: [
      textLike(row.division_display || row.division || filters.division, 'Division'),
      textLike(row.stage_display || row.stage || filters.stage, 'Stage'),
      textLike(row.persona_display || row.persona || filters.persona, 'Persona'),
    ].filter(Boolean).join(' - '),
    title: textLike(row.title || row.name, 'No active backend playbook'),
    objective: textLike(row.objective || row.description, 'No objective recorded for this filter combination.'),
    openingScript: textLike(row.opening_script, 'No opening script recorded.'),
    questions,
    proofToUse: textLike(row.proof_to_use || row.proof, 'No proof guidance recorded.'),
    primaryCta: textLike(row.primary_cta || row.cta, 'No call to action recorded.'),
    exitCriteria: textLike(row.exit_criteria, 'No exit criteria recorded.'),
    objections,
  }
}

export interface ContentStudioMetric {
  label: string
  value: string | number
  sub: string
  tone: string
  icon: string
}

export interface ContentStudioCard {
  id: string | number
  title: string
  meta: string
  action: string
  leads: string | number
  status: string
}

export interface ContentStudioColumn {
  stage: string
  cards: ContentStudioCard[]
}

export interface ContentStudioIntelRow {
  id: string | number
  content: string
  funnel: string
  cta: string
  leads: string | number
  revenue: string
}

const CONTENT_STAGES = [
  { key: 'ideas', label: 'Ideas' },
  { key: 'briefed', label: 'Briefed' },
  { key: 'in_production', label: 'In production' },
  { key: 'review', label: 'Review' },
  { key: 'published', label: 'Published' },
]

function normalizeContentStage(status: any) {
  const key = String(status || '').toLowerCase().replace(/[\s-]+/g, '_')
  if (key.includes('publish') || key === 'live') return 'published'
  if (key.includes('review') || key.includes('approval')) return 'review'
  if (key.includes('production') || key.includes('progress')) return 'in_production'
  if (key.includes('brief')) return 'briefed'
  return 'ideas'
}

function transformContentStudioCard(row: any): ContentStudioCard {
  const status = normalizeContentStage(row.status)
  const cta = textLike(row.call_to_action || row.primary_cta || row.cta || row.external_url, 'No CTA')
  return {
    id: itemId(row),
    title: textLike(row.title, 'Untitled content'),
    meta: [
      textLike(row.author_name || row.owner_name || row.owner || row.platform),
      textLike(row.category || row.funnel_stage || row.content_type),
    ].filter(Boolean).join(' - ') || 'No owner',
    action: cta,
    leads: numberLike(row.leads ?? row.content_leads ?? row.attributed_leads, 0),
    status,
  }
}

export function transformContentStudio(data: any) {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['items', 'results', 'content', 'rows']).map(transformContentStudioCard)
  const columns = CONTENT_STAGES.map((stage) => ({
    stage: stage.label,
    cards: rows.filter((row: ContentStudioCard) => row.status === stage.key),
  }))
  const published = rows.filter((row: ContentStudioCard) => row.status === 'published').length
  const leads = rows.reduce((sum: number, row: ContentStudioCard) => sum + numberLike(row.leads), 0)
  const reviewOrReady = rows.filter((row: ContentStudioCard) => row.status === 'review' || row.status === 'published').length
  const intentRows = rows.filter((row: ContentStudioCard) => /intent|evaluation|proposal/i.test(row.meta)).length

  return {
    metrics: [
      { label: 'Published', value: published, sub: 'Backend content rows', tone: 'emerald', icon: 'ti-photo' },
      { label: 'Content leads', value: leads, sub: 'Attributed inquiries', tone: 'blue', icon: 'ti-users' },
      { label: 'Revenue influenced', value: moneyLike(source.revenue_influenced ?? source.summary?.revenue_influenced), sub: 'Backend attribution', tone: 'amber', icon: 'ti-currency-naira' },
      { label: 'Intent-stage share', value: rows.length ? `${Math.round((intentRows / rows.length) * 100)}%` : '0%', sub: 'Intent/evaluation content', tone: 'purple', icon: 'ti-filter' },
      { label: 'Brief compliance', value: rows.length ? `${Math.round((reviewOrReady / rows.length) * 100)}%` : '0%', sub: 'Review/published content', tone: 'rose', icon: 'ti-clipboard-check' },
    ] as ContentStudioMetric[],
    columns,
    intelRows: rows.map((row: ContentStudioCard) => ({
      id: row.id,
      content: row.title,
      funnel: row.meta,
      cta: row.action,
      leads: row.leads,
      revenue: 'NGN 0',
    })) as ContentStudioIntelRow[],
  }
}

export interface CoachingProgram {
  id: string | number
  name: string
  provider: string
  topic: string
  dateMeta: string
  status: string
  targetAudience: string
  score: number
}

export function transformCoachingPrograms(data: any): CoachingProgram[] {
  const source = data?.data || data || {}
  return arrayFromSource(source, ['items', 'results', 'programs', 'rows']).map((row: any, index: number) => {
    const start = row.start_date || row.startDate
    const end = row.end_date || row.endDate
    return {
      id: itemId(row) || index,
      name: textLike(row.program_name || row.name || row.title, 'Untitled coaching program'),
      provider: textLike(row.provider, 'Internal'),
      topic: textLike(row.description, 'No coaching description recorded'),
      dateMeta: [formatShortDate(start), formatShortDate(end)].filter(Boolean).join(' - '),
      status: textLike(row.status, 'pending'),
      targetAudience: textLike(row.target_audience, 'Team'),
      score: numberLike(row.progress_score ?? row.completion_pct ?? row.score, row.status === 'completed' ? 100 : 0),
    }
  })
}

export interface RetentionLeadRow {
  id: string | number
  initials: string
  name: string
  division: string
  potential: string
  action: string
  meta: string
}

export function transformRetentionLeads(data: any): RetentionLeadRow[] {
  const source = data?.data || data || {}
  return arrayFromSource(source, ['items', 'results', 'leads', 'rows']).map((row: any, index: number) => {
    const name = textLike(row.full_name || row.name || row.lead, 'Unnamed lead')
    return {
      id: itemId(row) || index,
      initials: name.split(/\s+/).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || 'LD',
      name,
      division: textLike(row.division_display || row.division, 'No division'),
      potential: numberLike(row.score, 0) >= 70 ? 'High' : 'Medium',
      action: textLike(row.next_action, 'No backend next action recorded'),
      meta: [
        textLike(row.source_display || row.source, 'Source unknown'),
        moneyLike(row.estimated_value ?? row.value ?? row.budget_range, 'NGN 0'),
        textLike(row.status_display || row.status, 'No status'),
      ].join(' - '),
    }
  })
}

export function transformBackendContentItem(bContent: any): ContentItem {
  return {
    title: bContent.title || 'Untitled Brief',
    fmt: bContent.format || bContent.fmt || 'Graphic',
    platform: bContent.channel || bContent.platform || 'Instagram',
    div: bContent.division || bContent.div || 're',
    owner: bContent.assigned_creator || bContent.owner || 'Design Team',
    status: bContent.status || 'idea',
    due: bContent.production_deadline || bContent.due || 'Tomorrow',
  }
}

export function transformBackendRealtor(bRealtor: any): Realtor {
  return {
    init: bRealtor.contact_person
      ? bRealtor.contact_person.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
      : 'RP',
    bg: '#DBEAFE',
    tc: '#1E40AF',
    name: bRealtor.contact_person || bRealtor.name || 'Unnamed Partner',
    since: bRealtor.registered_since || bRealtor.since || '2024',
    comm: bRealtor.commission_earned || bRealtor.comm || '15%',
    phone: bRealtor.phone || '08031234567',
    referrals: bRealtor.referrals_count ? String(bRealtor.referrals_count) : '0',
    status: bRealtor.status || 'Active',
  }
}

export interface ApprovalCenterRow {
  id?: string | number
  title: string
  description: string
  meta: string
  status: string
  actionType: string
  stepLabel: string
  createdBy: string
  createdAt: string
}

export function transformApprovalRequests(data: any): ApprovalCenterRow[] {
  const source = data?.data || data || {}
  return arrayFromSource(source, ['items', 'results', 'requests', 'rows']).map((row: any, index: number) => ({
    id: itemId(row) || row.approval_request_id || index,
    title: textLike(row.title || row.action_title, 'Approval request'),
    description: textLike(row.description || row.summary),
    meta: [
      textLike(row.action_type_display || row.action_type, 'Approval'),
      row.created_by_name ? `Requested by ${row.created_by_name}` : '',
      formatShortDate(row.created_at, ''),
    ].filter(Boolean).join(' - '),
    status: textLike(row.status_display || row.status, 'pending'),
    actionType: textLike(row.action_type || row.action_type_display, 'approval'),
    stepLabel: textLike(row.pending_step_name || row.pending_step_required_level_display || row.flow_name, 'Approval step'),
    createdBy: textLike(row.created_by_name, 'Requester not recorded'),
    createdAt: formatShortDate(row.created_at, '-'),
  }))
}

export interface AuditLogRow {
  id?: string | number
  time: string
  type: string
  status: string
  action: string
  actor: string
  ipAddress: string
}

export function transformAuditLogs(data: any): AuditLogRow[] {
  const source = data?.data || data || {}
  return arrayFromSource(source, ['items', 'results', 'logs', 'rows']).map((row: any, index: number) => ({
    id: itemId(row) || index,
    time: formatShortDate(row.created_at || row.time || row.timestamp, '-'),
    type: textLike(row.audit_type_display || row.audit_type || row.type, 'Audit'),
    status: textLike(row.audit_status_display || row.audit_status || row.status, 'Recorded'),
    action: textLike(row.activity || row.action || row.description, 'Audit activity'),
    actor: textLike(row.user?.full_name || row.user?.email || row.actor || row.created_by_name, 'System'),
    ipAddress: textLike(row.ip_address, '-'),
  }))
}

export interface PermissionResourceRow {
  resource: string
  actions: string[]
}

export function transformPermissionsMap(data: any): PermissionResourceRow[] {
  const source = data?.data || data || {}
  const map = source.permissions_map || source.permissions || source
  if (!map || Array.isArray(map) || typeof map !== 'object') return []
  return Object.entries(map).map(([resource, actions]) => ({
    resource,
    actions: Array.isArray(actions) ? actions.map((action) => String(action)) : [],
  }))
}

export interface AuthorityLimitRow {
  id: string
  label: string
  resource: string
  action: string
  value: string
}

export function transformAuthorityLimits(data: any): AuthorityLimitRow[] {
  const source = data?.data || data || {}
  const rows = arrayFromSource(source, ['items', 'limits', 'authority_limits', 'rows'])
  return rows.map((row: any, index: number) => ({
    id: textLike(row.id || `${row.resource || 'resource'}_${row.action || index}`, `limit_${index}`),
    label: textLike(row.label || row.name || row.title, normalizeLabel(row.action || row.resource, 'Authority limit')),
    resource: textLike(row.resource, 'resource'),
    action: textLike(row.action, 'action'),
    value: textLike(row.limit_display || row.value_display || row.amount_display || row.limit || row.value, 'No limit value returned'),
  }))
}

export interface MeetingRow {
  id?: string | number
  title: string
  agenda: string
  date: string
  dateValue: string
  time: string
  timeValue: string
  duration: string
  status: string
  locationType: string
  location: string
  organizer: string
  attendees: string
  attendeeCount: number
  notes: string
  fileUrl: string
  meetingType: string
  facilitator: string
  recorder: string
  preRead: string
  expectedOutcome: string
  actions: MeetingActionRow[]
  decisions: MeetingDecisionRow[]
}

export interface MeetingActionRow {
  id?: string | number
  meetingId?: string | number
  meetingTitle: string
  title: string
  description: string
  owner: string
  dueDate: string
  dueDateValue: string
  status: string
  priority: string
}

export interface MeetingDecisionRow {
  id?: string | number
  meetingId?: string | number
  meetingTitle: string
  decision: string
  owner: string
  approver: string
  reason: string
  decisionDate: string
  decisionDateValue: string
}

export function transformMeetings(data: any): MeetingRow[] {
  const source = data?.data || data || {}
  return arrayFromSource(source, ['items', 'results', 'meetings', 'rows']).map((row: any, index: number) => {
    const id = itemId(row) || row.meeting_id || index
    const title = textLike(row.title, 'Untitled meeting')
    const rawActions = Array.isArray(row.actions)
      ? row.actions
      : Array.isArray(row.action_items)
        ? row.action_items
        : Array.isArray(row.meeting_actions)
          ? row.meeting_actions
          : []
    const rawDecisions = Array.isArray(row.decisions)
      ? row.decisions
      : Array.isArray(row.meeting_decisions)
        ? row.meeting_decisions
        : []

    return {
      id,
      title,
      agenda: textLike(row.agenda, 'No agenda returned'),
      date: formatShortDate(row.meeting_date || row.date, '-'),
      dateValue: dateKey(row.meeting_date || row.date),
      time: textLike(row.meeting_time || row.time, '-'),
      timeValue: textLike(row.meeting_time || row.time, ''),
      duration: textLike(row.duration_display, row.duration_minutes ? `${row.duration_minutes} mins` : '-'),
      status: textLike(row.status_display || row.status, 'Scheduled'),
      locationType: textLike(row.location_type_display || row.location_type, 'Location'),
      location: textLike(row.location, 'Location not recorded'),
      organizer: textLike(row.facilitator || row.organizer_name || row.created_by_name, 'Organizer not recorded'),
      attendees: Array.isArray(row.attendees)
        ? row.attendees.map((attendee: any) => textLike(attendee.full_name || attendee.email || attendee.name, '')).filter(Boolean).join(', ')
        : textLike(row.attendees, ''),
      attendeeCount: numberLike(row.attendee_count || row.attendees?.length),
      notes: textLike(row.notes, ''),
      fileUrl: textLike(row.file_url, ''),
      meetingType: textLike(row.meeting_type_display || row.meeting_type, 'General marketing'),
      facilitator: textLike(row.facilitator, ''),
      recorder: textLike(row.recorder, ''),
      preRead: textLike(row.pre_read, ''),
      expectedOutcome: textLike(row.expected_outcome, ''),
      actions: rawActions.map((action: any) => ({
        id: itemId(action) || action.action_id,
        meetingId: id,
        meetingTitle: title,
        title: textLike(action.title || action.name, 'Untitled action'),
        description: textLike(action.description, ''),
        owner: textLike(action.owner_name || action.owner || action.assigned_to_name, 'Unassigned'),
        dueDate: formatShortDate(action.due_date || action.deadline, '-'),
        dueDateValue: dateKey(action.due_date || action.deadline),
        status: textLike(action.status_display || action.status, 'Open'),
        priority: textLike(action.priority_display || action.priority, 'Medium'),
      })),
      decisions: rawDecisions.map((decision: any) => ({
        id: itemId(decision) || decision.decision_id,
        meetingId: id,
        meetingTitle: title,
        decision: textLike(decision.decision || decision.title || decision.summary, 'Decision not recorded'),
        owner: textLike(decision.owner, 'Owner not recorded'),
        approver: textLike(decision.approver, 'Approver not recorded'),
        reason: textLike(decision.reason, ''),
        decisionDate: formatShortDate(decision.decision_date || decision.created_at, '-'),
        decisionDateValue: dateKey(decision.decision_date || decision.created_at),
      })),
    }
  })
}
