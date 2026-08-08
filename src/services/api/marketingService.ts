import { apiFormRequest, apiRequest } from './apiClient'

export interface BackendLeadCreate {
  full_name: string
  phone: string
  email?: string | null
  division: string
  source: 'referral' | 'website' | 'social_media' | 'advertisement' | 'direct_contact' | 'direct' | 'other' | string
  campaign_id?: number | null
  referral_partner_id?: number | null
  branch_id?: number | null
  notes?: string
  assigned_to_id?: number | null
  budget_range?: string | null
  estimated_value?: number | string
  status?: string | null
  next_action?: string | null
  next_follow_up_at?: string | null
}

export interface BackendLeadActivityCreate {
  activity_type: string
  note: string
  outcome?: string
  next_follow_up_at?: string | null
  next_action?: string
  to_status?: string
}

export interface BackendLeadActivityUpdate {
  activity_type?: string
  outcome?: string
  note?: string
  next_follow_up_at?: string | null
  next_action?: string
  from_status?: string
  to_status?: string
}

export interface BackendLeadAssign {
  assigned_to_id?: number | null
}

export interface BackendCampaignCreate {
  name: string
  channel?: string
  channels?: string
  description?: string | null
  status?: string
  impressions?: number
  ctr?: number | string
  roi?: number | string
  budget_allocated?: number | string
  budget_naira?: number
  budget_spent?: number | string
  start_date?: string | null
  end_date?: string | null
  division?: string
  target_leads?: number
}

export interface BackendCampaignRequestCreate {
  title: string
  problem: string
  department?: string
  division?: string
  branch_id?: number | null
  needed_by?: string | null
  priority?: string
  proposed_budget?: number | string
  audience?: string
  product?: string
  expected_outcome?: string
  context?: string
}

export interface BackendCampaignRequestUpdate extends Partial<BackendCampaignRequestCreate> {
  status?: string
  review_note?: string
}

export interface BackendCampaignRequestConvert {
  channel?: string
  status?: string
  start_date?: string | null
  end_date?: string | null
}

export interface BackendCampaignTaskCreate {
  title: string
  description?: string
  owner_id?: number | null
  owner_name?: string
  due_date?: string | null
  status?: string
  priority?: string
}

export type BackendCampaignTaskUpdate = Partial<BackendCampaignTaskCreate>

export interface BackendCampaignUpdateCreate {
  text: string
  update_type?: string
  update_date?: string | null
  blocker?: string
  next_action?: string
}

export interface BackendCampaignExpenseCreate {
  vendor: string
  amount: number | string
  expense_date?: string | null
  category?: string
  description?: string
  status?: string
  reference?: string
}

export interface BackendCampaignAssetCreate {
  name: string
  asset_type?: string
  owner_id?: number | null
  owner_name?: string
  due_date?: string | null
  status?: string
  description?: string
  specifications?: string
  approval_notes?: string
  content_id?: number | null
}

export interface BackendCampaignDecisionCreate {
  decision: string
  decision_date?: string | null
  owner?: string
  approver?: string
  reason?: string
}

export interface BackendContentBriefCreate {
  title: string
  format?: string
  platform?: string
  division?: string | null
  branch_id?: number | null
  owner_id?: number | null
  owner_name?: string | null
  status?: string
  due_date?: string | null
  scheduled_at?: string | null
  published_at?: string | null
  campaign_id?: number | null
  content_id?: number | null
  funnel_stage?: string | null
  description?: string | null
  call_to_action?: string | null
  specifications?: string | null
  approval_notes?: string | null
  sort_order?: number
}

export type BackendContentBriefUpdate = Partial<BackendContentBriefCreate>

export interface BackendContentCreate {
  title: string
  platform: string
  content_type?: string
  status?: string
  body?: string
  excerpt?: string
  featured_image?: string | null
  views?: number
  likes?: number
  shares?: number
  comments?: number
  author_id?: number | null
  published_date?: string | null
  scheduled_date?: string | null
  slug?: string
  external_url?: string
  meta_description?: string
  keywords?: string
  tags?: string
  category?: string
  is_featured?: boolean
  allow_comments?: boolean
}

export type BackendContentUpdate = Partial<BackendContentCreate>

export interface BackendContentPublish {
  content_id?: number | null
  body?: string | null
  excerpt?: string | null
  featured_image?: string | null
  external_url?: string | null
  meta_description?: string | null
  keywords?: string | null
  tags?: string | null
  category?: string | null
  published_at?: string | null
}

export interface BackendMediaLibraryAssetCreate {
  title: string
  asset_type?: string
  file_url: string
  thumbnail_url?: string | null
  mime_type?: string | null
  file_size_bytes?: number
  division?: string | null
  branch_id?: number | null
  owner_id?: number | null
  owner_name?: string | null
  campaign_id?: number | null
  campaign_asset_id?: number | null
  calendar_item_id?: number | null
  content_id?: number | null
  tags?: string | null
  description?: string | null
  status?: string
}

export type BackendMediaLibraryAssetUpdate = Partial<BackendMediaLibraryAssetCreate>

export interface BackendCampaignRiskCreate {
  record_type?: string
  severity?: string
  title: string
  owner_id?: number | null
  owner_name?: string | null
  due_date?: string | null
  mitigation?: string | null
  impact?: string | null
  approver?: string | null
  status?: string
}

export type BackendCampaignRiskUpdate = Partial<BackendCampaignRiskCreate>

export interface BackendCampaignPostAnalysis {
  conclusion: string
  worked?: string | null
  failed?: string | null
  lessons?: string | null
  next_actions?: string | null
  reusable_assets?: string | null
  analysis_date?: string | null
  approver?: string | null
  mark_campaign_completed?: boolean
}

export interface BackendRealtorCreate {
  agency_name: string
  contact_person: string
  phone: string
  email?: string
  territory?: string
  commission_rate_pct?: number
}

export interface BackendPartnerInvitationCreate {
  partner_id?: number | null
  name?: string | null
  email: string
  phone?: string | null
  category?: string | null
  status?: string | null
  invite_url_base?: string | null
}

export interface BackendEmailManualRecipient {
  email: string
  name?: string | null
}

export interface BackendEmailAudienceRequest {
  audience_groups?: string[]
  filters?: Record<string, unknown> | null
  manual_recipients?: BackendEmailManualRecipient[] | null
}

export interface BackendEmailSendRequest extends BackendEmailAudienceRequest {
  subject: string
  body: string
}

export interface BackendPartnerTaskCreate {
  partner_id: number
  campaign_id?: number | null
  partner_type?: string
  title: string
  objective?: string | null
  due_date?: string | null
  fee?: number | string
  proof_requirement?: string | null
  tracking_url?: string | null
  status?: string
}

export type BackendPartnerTaskUpdate = Partial<BackendPartnerTaskCreate>

export interface BackendPartnerReportReview {
  status: string
  review_note?: string | null
}

export interface BackendPartnerCommissionCreate {
  partner_id: number
  lead_id?: number | null
  amount_basis?: number | string
  commission_rate?: number | string
  commission_due?: number | string | null
  note?: string | null
}

export interface BackendPartnerCommissionUpdate {
  note?: string | null
  payment_reference?: string | null
}

export interface BackendPartnerReferredLeadCreate {
  partner_id?: number | null
  full_name: string
  phone: string
  email?: string | null
  division?: string
  campaign_id?: number | null
  branch_id?: number | null
  assigned_to_id?: number | null
  budget_range?: string | null
  estimated_value?: number | string
  notes?: string | null
  tags?: string[] | null
  next_action?: string | null
}

export interface BackendPartnerReportCreate {
  task_id: number
  reach?: number
  lead_count?: number
  proof_url?: string | null
  note?: string | null
}

export interface BackendTraditionalMediaPlacementCreate {
  placement_type: string
  name: string
  vendor?: string | null
  location?: string | null
  ownership?: string
  amount_paid?: number | string
  start_date?: string | null
  end_date: string
  status?: string
  proof_url?: string | null
  campaign_id?: number | null
  branch_id?: number | null
  division?: string | null
  notes?: string | null
}

export type BackendTraditionalMediaPlacementUpdate = Partial<BackendTraditionalMediaPlacementCreate>

export interface BackendInquiryCreate {
  lead_name: string
  email?: string | null
  phone: string
  source?: string | null
  inquiry_type?: string | null
  priority?: string | null
  channel?: string | null
  branch_id?: number | null
  assigned_agent_id?: number | null
  notes?: string | null
}

export type BackendInquiryUpdate = Partial<BackendInquiryCreate> & {
  status?: string | null
}

export interface BackendInquiryAssign {
  agent_id: number
}

export interface BackendInquiryStatusUpdate {
  status: string
}

export interface BackendFollowUpCreate {
  inquiry_id: number
  agent_id?: number | null
  action: string
  scheduled_at: string
  schedule_type?: string | null
  notes?: string | null
}

export interface BackendFollowUpUpdate {
  action?: string | null
  scheduled_at?: string | null
  status?: string | null
  notes?: string | null
}

export interface BackendSalesPlaybookCreate {
  title: string
  division: string
  stage: string
  persona: string
  objective?: string | null
  opening_script?: string | null
  questions?: string[] | null
  proof_to_use?: string | null
  primary_cta?: string | null
  exit_criteria?: string | null
  status?: string | null
  branch_id?: number | null
  sort_order?: number | null
}

export type BackendSalesPlaybookUpdate = Partial<BackendSalesPlaybookCreate>

export interface BackendSalesPlaybookObjectionCreate {
  objection: string
  response: string
  sort_order?: number | null
  is_active?: boolean | null
}

export type BackendSalesPlaybookObjectionUpdate = Partial<BackendSalesPlaybookObjectionCreate>

export interface BackendTrainingProgramCreate {
  program_name: string
  provider: string
  description: string
  start_date: string
  end_date: string
  cost: number | string
  target_audience: string
  status?: string
}

export type BackendTrainingProgramUpdate = Partial<BackendTrainingProgramCreate>

export interface BackendApprovalDecision {
  status: 'approved' | 'rejected'
  comment?: string | null
  comments?: string | null
}

export interface BackendApprovalRequestCreate {
  flow_id: number
  title: string
  description: string
  metadata?: Record<string, unknown> | null
}

export interface BackendMeetingCreate {
  title: string
  agenda: string
  meeting_date: string
  meeting_time: string
  duration_minutes: number
  status?: string
  location_type?: string
  location?: string | null
  attendee_ids?: number[]
  notes?: string | null
  file_url?: string | null
}

export type BackendMeetingUpdate = Partial<BackendMeetingCreate>

export interface BackendMarketingMeetingCreate extends BackendMeetingCreate {
  campaign_id?: number | string | null
  meeting_type?: string
  facilitator?: string | null
  recorder?: string | null
  pre_read?: string | null
  expected_outcome?: string | null
}

export type BackendMarketingMeetingUpdate = Partial<BackendMarketingMeetingCreate>

export interface BackendMarketingMeetingActionCreate {
  title: string
  description?: string | null
  owner_id?: number | string | null
  owner_name?: string | null
  due_date?: string | null
  status?: string
  priority?: string
}

export type BackendMarketingMeetingActionUpdate = Partial<BackendMarketingMeetingActionCreate>

export interface BackendMarketingMeetingDecisionCreate {
  decision: string
  campaign_id?: number | string | null
  decision_date?: string | null
  owner?: string | null
  approver?: string | null
  reason?: string | null
}

export type MarketingMeetingParams = QueryParams & {
  status?: string
  campaign_id?: number | string
  meeting_type?: string
  date_from?: string
  date_to?: string
  search?: string
  my_meetings?: boolean
  limit?: number
}

export type RevenueDateParams = QueryParams & {
  date?: string
  branch_id?: number | string
}

export type RevenuePeriodParams = QueryParams & {
  period_start?: string
  period_end?: string
  branch_id?: number | string
  division?: string
  source?: string
  campaign_id?: number | string
}

export type LeadPipelineParams = QueryParams & {
  division?: string
  assigned_to_id?: number | string
  branch_id?: number | string
  search?: string
  priority?: string
  sla?: string
  date_from?: string
  date_to?: string
}

export type ContentCalendarParams = QueryParams & {
  week_start?: string
  date_from?: string
  date_to?: string
  status?: string
  platform?: string
  division?: string
  owner_id?: number | string
  campaign_id?: number | string
  branch_id?: number | string
  search?: string
}

export type ContentListParams = QueryParams & {
  status?: string
  content_type?: string
  platform?: string
  author_id?: number | string
  is_featured?: boolean
  search?: string
  limit?: number
  offset?: number
}

export type MediaLibraryParams = QueryParams & {
  asset_type?: string
  division?: string
  campaign_id?: number | string
  content_id?: number | string
  calendar_item_id?: number | string
  branch_id?: number | string
  owner_id?: number | string
  status?: string
  search?: string
  limit?: number
}

export type PartnerOperationsPeriodParams = QueryParams & {
  period_start?: string
  period_end?: string
  branch_id?: number | string
  campaign_id?: number | string
}

export type PartnerDirectoryParams = QueryParams & {
  status?: string
  category?: string
  search?: string
  branch_id?: number | string
  campaign_id?: number | string
  limit?: number
}

export type PartnerTaskParams = QueryParams & {
  partner_id?: number | string
  status?: string
  partner_type?: string
  campaign_id?: number | string
  limit?: number
}

export type PartnerReportParams = QueryParams & {
  partner_id?: number | string
  task_id?: number | string
  status?: string
  limit?: number
}

export type PartnerCommissionParams = QueryParams & {
  partner_id?: number | string
  status?: string
  limit?: number
}

export type TraditionalMediaParams = QueryParams & {
  placement_type?: string
  ownership?: string
  status?: string
  expiry_filter?: string
  campaign_id?: number | string
  branch_id?: number | string
  division?: string
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
}

export type EmailCampaignParams = QueryParams & {
  status?: string
  search?: string
  limit?: number
}

export type ServiceOrderParams = QueryParams & {
  order_status?: string
  payment_status?: string
  client_id?: number | string
  limit?: number
  offset?: number
}

export type MarketingAnalyticsParams = QueryParams & {
  period_start?: string
  period_end?: string
  branch_id?: number | string
  division?: string
  campaign_id?: number | string
}

export type CsrcInquiryParams = QueryParams & {
  branch_id?: number | string
  source?: string
  priority?: string
  status?: string
  date_from?: string
  date_to?: string
}

export type SalesPlaybookParams = QueryParams & {
  division?: string
  stage?: string
  persona?: string
  status?: string
  branch_id?: number | string
  search?: string
  limit?: number
}

export type CurrentSalesPlaybookParams = QueryParams & {
  division: string
  stage: string
  persona: string
  branch_id?: number | string
}

export type TrainingProgramParams = QueryParams & {
  search?: string
  program_name?: string
  provider?: string
  status?: string
  target_audience?: string
  start_date_from?: string
  start_date_to?: string
  end_date_from?: string
  end_date_to?: string
  min_cost?: number | string
  max_cost?: number | string
  limit?: number
  offset?: number
}

export interface DailyActionUpdate {
  title?: string | null
  description?: string | null
  owner_id?: number | null
  severity?: string | null
  due_at?: string | null
  sort_order?: number | null
}

export interface DailyActionComplete {
  completion_note?: string | null
}

export interface OpenDailyExecutionDay {
  date?: null
  branch_id?: number | null
  force_rebuild?: boolean | null
}

export interface DailyActionTemplateCreate {
  title: string
  description?: string | null
  default_owner_id?: number | null
  branch_id?: number | null
  severity?: string | null
  is_active?: boolean | null
  sort_order?: number | null
}

export type DailyActionTemplateUpdate = Partial<DailyActionTemplateCreate>

export interface TurnaroundPlanCreate {
  name: string
  start_date: string
  end_date?: string | null
  branch_id?: number | null
  primary_owner_id?: number | null
}

export type TurnaroundPlanUpdate = Partial<TurnaroundPlanCreate> & {
  status?: string | null
}

export interface TurnaroundActionUpdate {
  phase?: string | null
  title?: string | null
  owner_text?: string | null
  owner_id?: number | null
  week_start?: number | null
  week_end?: number | null
  status?: string | null
  sort_order?: number | null
}

export interface TurnaroundActionComplete {
  completion_note?: string | null
}

export interface RevenueKeyResultUpdate {
  title?: string | null
  target_value?: number | string | null
  actual_value?: number | string | null
  unit?: string | null
  progress_mode?: string | null
  source_metric_key?: string | null
  linked_employee_target_id?: number | null
  linked_kpi_record_id?: number | null
  status?: string | null
  weight?: number | string | null
  sort_order?: number | null
}

export interface ComplianceRecordCreate {
  full_name: string
  email_address: string
  phone_number: string
  department_id: number
  compliance_type: string
  reference_number: string | null
  date_of_issue: string
  expiry_date: string
  issuing_authority: string
  status: string
  description?: string | null
  contact_person: string | null
  contact_email: string | null
  cost: number | string | null
  priority_level: string | null
  documents: string[]
}

export type ComplianceRecordUpdate = Partial<ComplianceRecordCreate>

type QueryParams = Record<string, string | number | boolean | null | undefined>
type JsonPayload = Record<string, unknown>

const LEAD_DIVISION_TO_BACKEND: Record<string, string> = {
  re: 'real_estate',
  real_estate: 'real_estate',
  realestate: 'real_estate',
  'real estate': 'real_estate',
  ben: 'benji',
  benji: 'benji',
  eng: 'engineering',
  engineering: 'engineering',
  sur: 'surveying',
  surveying: 'surveying',
  ict: 'ict',
  agr: 'agriculture',
  agriculture: 'agriculture',
}

const LEAD_SOURCE_TO_BACKEND: Record<string, string> = {
  referral: 'referral',
  website: 'website',
  direct: 'other',
  direct_contact: 'other',
  whatsapp: 'other',
  social_media: 'other',
  advertisement: 'other',
  ads: 'other',
  other: 'other',
}

function normalizeChoice(value: unknown, map: Record<string, string>) {
  if (typeof value !== 'string') return value
  const key = value.trim().toLowerCase()
  return map[key] || value
}

function normalizeLeadPayload<T extends JsonPayload>(payload: T): T {
  return {
    ...payload,
    ...(payload.division ? { division: normalizeChoice(payload.division, LEAD_DIVISION_TO_BACKEND) } : {}),
    ...(payload.source ? { source: normalizeChoice(payload.source, LEAD_SOURCE_TO_BACKEND) } : {}),
  }
}

function normalizeDivisionPayload<T extends JsonPayload>(payload: T): T {
  return {
    ...payload,
    ...(payload.division ? { division: normalizeChoice(payload.division, LEAD_DIVISION_TO_BACKEND) } : {}),
  }
}

function normalizeCampaignCreatePayload(payload: BackendCampaignCreate): JsonPayload {
  const normalized = normalizeDivisionPayload(payload as unknown as JsonPayload)
  const body: JsonPayload = {
    name: normalized.name,
    channel: normalized.channel || normalized.channels,
    description: normalized.description || undefined,
    status: normalized.status || 'draft',
    impressions: normalized.impressions,
    ctr: normalized.ctr,
    roi: normalized.roi,
    budget_allocated: normalized.budget_allocated ?? normalized.budget_naira,
    budget_spent: normalized.budget_spent,
    start_date: normalized.start_date || null,
    end_date: normalized.end_date || null,
  }

  Object.keys(body).forEach((key) => {
    if (body[key] === undefined || body[key] === '') delete body[key]
  })

  return body
}

function normalizeDivisionParams<T extends QueryParams>(params?: T): T | undefined {
  if (!params) return params
  return {
    ...params,
    ...(params.division ? { division: normalizeChoice(params.division, LEAD_DIVISION_TO_BACKEND) } : {}),
  }
}

function toQuery(params?: QueryParams) {
  if (!params) return ''
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      query.set(key, String(value))
    }
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

export const marketingService = {
  // --- LEADS & 360 JOURNAL ---
  getLeads: async (params?: {
    limit?: number
    offset?: number
    status?: string
    stage?: string
    division?: string
    source?: string
    campaign_id?: number | string
    assigned_to_id?: number | string
    branch_id?: number | string
    priority?: string
    sla?: string
    search?: string
    date_from?: string
    date_to?: string
  }) => {
    const { stage, ...rest } = params || {}
    return apiRequest(`/api/v1/leads${toQuery(normalizeDivisionParams({ ...rest, status: rest.status || stage }))}`)
  },

  getLeadDetail: async (leadId: string | number) => {
    return apiRequest(`/api/v1/leads/${leadId}`)
  },

  getLeadPipeline: async (params?: LeadPipelineParams) => {
    return apiRequest(`/api/v1/leads/pipeline${toQuery(normalizeDivisionParams(params))}`)
  },

  getLeadPipelineDetail: async (leadId: string | number) => {
    return apiRequest(`/api/v1/leads/pipeline/${leadId}`)
  },

  createLead: async (payload: BackendLeadCreate) => {
    return apiRequest('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify(normalizeLeadPayload(payload as unknown as JsonPayload)),
    })
  },

  updateLeadStage: async (leadId: string | number, stage: string) => {
    return apiRequest(`/api/v1/leads/${leadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: stage }),
    })
  },

  assignLead: async (leadId: string | number, payload: BackendLeadAssign) => {
    return apiRequest(`/api/v1/leads/${leadId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  updateLead: async (leadId: string | number, payload: JsonPayload) => {
    return apiRequest(`/api/v1/leads/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify(normalizeLeadPayload(payload)),
    })
  },

  getLeadActivities: async (
    leadId: string | number,
    params?: { limit?: number; offset?: number; activity_type?: string; outcome?: string; date_from?: string; date_to?: string },
  ) => {
    return apiRequest(`/api/v1/leads/${leadId}/activities${toQuery(params)}`)
  },

  logLeadActivity: async (leadId: string | number, payload: BackendLeadActivityCreate) => {
    return apiRequest(`/api/v1/leads/${leadId}/activities`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateLeadActivity: async (leadId: string | number, activityId: string | number, payload: BackendLeadActivityUpdate) => {
    return apiRequest(`/api/v1/leads/${leadId}/activities/${activityId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  // --- CAMPAIGNS ---
  getCampaigns: async (params?: { limit?: number; offset?: number; status?: string }) => {
    return apiRequest(`/api/v1/marketing-campaigns${toQuery(params)}`)
  },

  createCampaign: async (payload: BackendCampaignCreate) => {
    return apiRequest('/api/v1/marketing-campaigns', {
      method: 'POST',
      body: JSON.stringify(normalizeCampaignCreatePayload(payload)),
    })
  },

  updateCampaign: async (campaignId: string | number, payload: JsonPayload) => {
    return apiRequest(`/api/v1/marketing-campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(normalizeDivisionPayload(payload)),
    })
  },

  getCampaignPanel: async (params?: {
    period_start?: string
    period_end?: string
    status?: string
    channel?: string
    division?: string
    branch_id?: string | number
    search?: string
    limit?: number
  }) => {
    return apiRequest(`/api/v1/marketing-campaigns/panel${toQuery(normalizeDivisionParams(params))}`)
  },

  exportCampaignPanel: async (params?: { status?: string; channel?: string; division?: string; search?: string }) => {
    return apiRequest(`/api/v1/marketing-campaigns/panel/export${toQuery(normalizeDivisionParams(params))}`)
  },

  getCampaignRequests: async (params?: { status?: string; search?: string }) => {
    return apiRequest(`/api/v1/marketing-campaigns/requests${toQuery(params)}`)
  },

  createCampaignRequest: async (payload: BackendCampaignRequestCreate) => {
    return apiRequest('/api/v1/marketing-campaigns/requests', {
      method: 'POST',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  updateCampaignRequest: async (requestId: string | number, payload: BackendCampaignRequestUpdate) => {
    return apiRequest(`/api/v1/marketing-campaigns/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  convertCampaignRequest: async (requestId: string | number, payload: BackendCampaignRequestConvert) => {
    return apiRequest(`/api/v1/marketing-campaigns/requests/${requestId}/convert`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getCampaignWorkspace: async (campaignId: string | number) => {
    return apiRequest(`/api/v1/marketing-campaigns/${campaignId}/workspace`)
  },

  createCampaignTask: async (campaignId: string | number, payload: BackendCampaignTaskCreate) => {
    return apiRequest(`/api/v1/marketing-campaigns/${campaignId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateCampaignTask: async (taskId: string | number, payload: BackendCampaignTaskUpdate) => {
    return apiRequest(`/api/v1/marketing-campaigns/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  createCampaignUpdate: async (campaignId: string | number, payload: BackendCampaignUpdateCreate) => {
    return apiRequest(`/api/v1/marketing-campaigns/${campaignId}/updates`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  createCampaignExpense: async (campaignId: string | number, payload: BackendCampaignExpenseCreate) => {
    return apiRequest(`/api/v1/marketing-campaigns/${campaignId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  createCampaignAsset: async (campaignId: string | number, payload: BackendCampaignAssetCreate) => {
    return apiRequest(`/api/v1/marketing-campaigns/${campaignId}/assets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateCampaignAsset: async (assetId: string | number, payload: Partial<BackendCampaignAssetCreate>) => {
    return apiRequest(`/api/v1/marketing-campaigns/assets/${assetId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  createCampaignRisk: async (campaignId: string | number, payload: BackendCampaignRiskCreate) => {
    return apiRequest(`/api/v1/marketing-campaigns/${campaignId}/risks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateCampaignRisk: async (riskId: string | number, payload: BackendCampaignRiskUpdate) => {
    return apiRequest(`/api/v1/marketing-campaigns/risks/${riskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  createCampaignDecision: async (campaignId: string | number, payload: BackendCampaignDecisionCreate) => {
    return apiRequest(`/api/v1/marketing-campaigns/${campaignId}/decisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  saveCampaignPostAnalysis: async (campaignId: string | number, payload: BackendCampaignPostAnalysis) => {
    return apiRequest(`/api/v1/marketing-campaigns/${campaignId}/post-analysis`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  pauseCampaign: async (campaignId: string | number) => {
    return marketingService.updateCampaign(campaignId, { status: 'paused' })
  },

  resumeCampaign: async (campaignId: string | number) => {
    return marketingService.updateCampaign(campaignId, { status: 'active' })
  },

  // --- SALES PIPELINE ---
  getPipelineSummary: async (params?: { period?: number }) => {
    return apiRequest(`/api/v1/pipeline/reports${toQuery(params)}`)
  },

  getLeadSummary: async () => {
    return apiRequest('/api/v1/leads/summary')
  },

  movePipelineStage: async (leadId: string | number, newStage: string) => {
    return marketingService.updateLeadStage(leadId, newStage)
  },

  // --- CONTENT CALENDAR & MEDIA LIBRARY ---
  getContentBriefs: async (params?: ContentCalendarParams) => {
    return apiRequest(`/api/v1/content/calendar${toQuery(normalizeDivisionParams(params))}`)
  },

  createContentBrief: async (payload: BackendContentBriefCreate) => {
    return apiRequest('/api/v1/content/calendar/briefs', {
      method: 'POST',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  updateContentBrief: async (itemId: string | number, payload: BackendContentBriefUpdate) => {
    return apiRequest(`/api/v1/content/calendar/briefs/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  publishContentBrief: async (itemId: string | number, payload: BackendContentPublish = {}) => {
    return apiRequest(`/api/v1/content/calendar/briefs/${itemId}/publish`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  exportContentCalendar: async (params?: ContentCalendarParams) => {
    return apiRequest(`/api/v1/content/calendar/export${toQuery(normalizeDivisionParams(params))}`)
  },

  getMediaAssets: async (params?: MediaLibraryParams) => {
    return apiRequest(`/api/v1/content/media-library${toQuery(normalizeDivisionParams(params))}`)
  },

  createMediaAsset: async (payload: BackendMediaLibraryAssetCreate) => {
    return apiRequest('/api/v1/content/media-library/assets', {
      method: 'POST',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  getMediaAsset: async (assetId: string | number) => {
    return apiRequest(`/api/v1/content/media-library/assets/${assetId}`)
  },

  updateMediaAsset: async (assetId: string | number, payload: BackendMediaLibraryAssetUpdate) => {
    return apiRequest(`/api/v1/content/media-library/assets/${assetId}`, {
      method: 'PATCH',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  exportMediaLibrary: async (params?: Omit<MediaLibraryParams, 'limit'>) => {
    return apiRequest(`/api/v1/content/media-library/export${toQuery(normalizeDivisionParams(params))}`)
  },

  getContentItems: async (params?: ContentListParams) => {
    return apiRequest(`/api/v1/content${toQuery(params)}`)
  },

  createContentItem: async (payload: BackendContentCreate) => {
    return apiRequest('/api/v1/content', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getContentItem: async (contentId: string | number) => {
    return apiRequest(`/api/v1/content/${contentId}`)
  },

  updateContentItem: async (contentId: string | number, payload: BackendContentUpdate) => {
    return apiRequest(`/api/v1/content/${contentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  getUpcomingContent: async () => {
    return apiRequest('/api/v1/content/scheduled/upcoming')
  },

  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.set('file', file)
    return apiFormRequest<{ url: string }>('/api/v1/others/upload-file', formData)
  },

  // --- OPERATIONS: PARTNERS, MEDIA, ANALYTICS & CSRC ---
  getEmailAudiences: async (params?: { branch_id?: number | string }) => {
    return apiRequest(`/api/v1/marketing/email/audiences${toQuery(params)}`)
  },

  previewEmailCampaign: async (payload: BackendEmailAudienceRequest) => {
    return apiRequest('/api/v1/marketing/email/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  sendEmailCampaign: async (payload: BackendEmailSendRequest) => {
    return apiRequest('/api/v1/marketing/email/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getEmailCampaigns: async (params?: EmailCampaignParams) => {
    return apiRequest(`/api/v1/marketing/email/campaigns${toQuery(params)}`)
  },

  getEmailCampaign: async (campaignId: string | number) => {
    return apiRequest(`/api/v1/marketing/email/campaigns/${campaignId}`)
  },

  getPartnerOperationsDashboard: async (params?: PartnerOperationsPeriodParams) => {
    return apiRequest(`/api/v1/marketing/partners/dashboard${toQuery(params)}`)
  },

  getPartnerDirectory: async (params?: PartnerDirectoryParams) => {
    return apiRequest(`/api/v1/marketing/partners/directory${toQuery(params)}`)
  },

  getRealtors: async (params?: PartnerDirectoryParams) => {
    return marketingService.getPartnerDirectory(params)
  },

  inviteMarketingPartner: async (payload: BackendPartnerInvitationCreate) => {
    return apiRequest('/api/v1/marketing/partners/invitations', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  createRealtor: async (payload: BackendRealtorCreate) => {
    return marketingService.inviteMarketingPartner({
      name: payload.contact_person || payload.agency_name,
      email: payload.email || '',
      phone: payload.phone,
      category: 'real_estate',
      status: 'pending',
    })
  },

  getPartnerTasks: async (params?: PartnerTaskParams) => {
    return apiRequest(`/api/v1/marketing/partners/tasks${toQuery(params)}`)
  },

  createPartnerTask: async (payload: BackendPartnerTaskCreate) => {
    return apiRequest('/api/v1/marketing/partners/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  assignPartnerTask: async (payload: BackendPartnerTaskCreate) => {
    return marketingService.createPartnerTask(payload)
  },

  updatePartnerTask: async (taskId: string | number, payload: BackendPartnerTaskUpdate) => {
    return apiRequest(`/api/v1/marketing/partners/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  getPartnerReports: async (params?: PartnerReportParams) => {
    return apiRequest(`/api/v1/marketing/partners/reports${toQuery(params)}`)
  },

  reviewPartnerReport: async (reportId: string | number, payload: BackendPartnerReportReview) => {
    return apiRequest(`/api/v1/marketing/partners/reports/${reportId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  getPartnerCommissions: async (params?: PartnerCommissionParams) => {
    return apiRequest(`/api/v1/marketing/partners/commissions${toQuery(params)}`)
  },

  createPartnerCommission: async (payload: BackendPartnerCommissionCreate) => {
    return apiRequest('/api/v1/marketing/partners/commissions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  approvePartnerCommission: async (commissionId: string | number, payload: BackendPartnerCommissionUpdate = {}) => {
    return apiRequest(`/api/v1/marketing/partners/commissions/${commissionId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  markPartnerCommissionPaid: async (commissionId: string | number, payload: BackendPartnerCommissionUpdate = {}) => {
    return apiRequest(`/api/v1/marketing/partners/commissions/${commissionId}/mark-paid`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  createPartnerReferredLead: async (payload: BackendPartnerReferredLeadCreate) => {
    return apiRequest('/api/v1/marketing/partners/referred-leads', {
      method: 'POST',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  getPartnerPortalSession: async () => {
    return apiRequest('/api/v1/marketing/partner-portal/session')
  },

  createPartnerPortalLead: async (payload: BackendPartnerReferredLeadCreate) => {
    return apiRequest('/api/v1/marketing/partner-portal/leads', {
      method: 'POST',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  submitPartnerPortalReport: async (payload: BackendPartnerReportCreate) => {
    return apiRequest('/api/v1/marketing/partner-portal/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getTraditionalMediaDashboard: async (params?: TraditionalMediaParams) => {
    return apiRequest(`/api/v1/marketing/traditional-media/dashboard${toQuery(normalizeDivisionParams(params))}`)
  },

  getTraditionalMediaPlacements: async (params?: TraditionalMediaParams) => {
    return apiRequest(`/api/v1/marketing/traditional-media/placements${toQuery(normalizeDivisionParams(params))}`)
  },

  createTraditionalMediaPlacement: async (payload: BackendTraditionalMediaPlacementCreate) => {
    return apiRequest('/api/v1/marketing/traditional-media/placements', {
      method: 'POST',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  exportTraditionalMediaPlacements: async (params?: Omit<TraditionalMediaParams, 'limit'>) => {
    return apiRequest(`/api/v1/marketing/traditional-media/placements/export${toQuery(normalizeDivisionParams(params))}`)
  },

  getTraditionalMediaPlacement: async (placementId: string | number) => {
    return apiRequest(`/api/v1/marketing/traditional-media/placements/${placementId}`)
  },

  updateTraditionalMediaPlacement: async (placementId: string | number, payload: BackendTraditionalMediaPlacementUpdate) => {
    return apiRequest(`/api/v1/marketing/traditional-media/placements/${placementId}`, {
      method: 'PATCH',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  getServiceOrders: async (params?: ServiceOrderParams) => {
    return apiRequest(`/api/v1/orders${toQuery(params)}`)
  },

  getServiceOrder: async (orderId: string | number) => {
    return apiRequest(`/api/v1/orders/${orderId}`)
  },

  getMarketingAnalytics: async (params?: MarketingAnalyticsParams) => {
    return apiRequest(`/api/v1/marketing/analytics${toQuery(normalizeDivisionParams(params))}`)
  },

  getCsrcInquiries: async (params?: CsrcInquiryParams) => {
    return apiRequest(`/api/v1/csrc/inquiries${toQuery(params)}`)
  },

  createCsrcInquiry: async (payload: BackendInquiryCreate) => {
    return apiRequest('/api/v1/csrc/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateCsrcInquiry: async (inquiryId: string | number, payload: BackendInquiryUpdate) => {
    return apiRequest(`/api/v1/csrc/inquiries/${inquiryId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  assignCsrcInquiry: async (inquiryId: string | number, payload: BackendInquiryAssign) => {
    return apiRequest(`/api/v1/csrc/inquiries/${inquiryId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateCsrcInquiryStatus: async (inquiryId: string | number, payload: BackendInquiryStatusUpdate) => {
    return apiRequest(`/api/v1/csrc/inquiries/${inquiryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  getMissedCsrcInquiries: async () => {
    return apiRequest('/api/v1/csrc/inquiries/missed')
  },

  getCsrcFollowups: async (params?: { tab?: string }) => {
    return apiRequest(`/api/v1/csrc/followups${toQuery(params)}`)
  },

  createCsrcFollowup: async (payload: BackendFollowUpCreate) => {
    return apiRequest('/api/v1/csrc/followups', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateCsrcFollowup: async (followupId: string | number, payload: BackendFollowUpUpdate) => {
    return apiRequest(`/api/v1/csrc/followups/${followupId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  // --- ENABLEMENT & GROWTH ---
  getCurrentSalesPlaybook: async (params: CurrentSalesPlaybookParams) => {
    return apiRequest(`/api/v1/revenue-execution/playbooks/current${toQuery(normalizeDivisionParams(params))}`)
  },

  getSalesPlaybooks: async (params?: SalesPlaybookParams) => {
    return apiRequest(`/api/v1/revenue-execution/playbooks${toQuery(normalizeDivisionParams(params))}`)
  },

  createSalesPlaybook: async (payload: BackendSalesPlaybookCreate) => {
    return apiRequest('/api/v1/revenue-execution/playbooks', {
      method: 'POST',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  updateSalesPlaybook: async (playbookId: string | number, payload: BackendSalesPlaybookUpdate) => {
    return apiRequest(`/api/v1/revenue-execution/playbooks/${playbookId}`, {
      method: 'PUT',
      body: JSON.stringify(normalizeDivisionPayload(payload as unknown as JsonPayload)),
    })
  },

  archiveSalesPlaybook: async (playbookId: string | number) => {
    return apiRequest(`/api/v1/revenue-execution/playbooks/${playbookId}`, {
      method: 'DELETE',
    })
  },

  createSalesPlaybookObjection: async (playbookId: string | number, payload: BackendSalesPlaybookObjectionCreate) => {
    return apiRequest(`/api/v1/revenue-execution/playbooks/${playbookId}/objections`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateSalesPlaybookObjection: async (objectionId: string | number, payload: BackendSalesPlaybookObjectionUpdate) => {
    return apiRequest(`/api/v1/revenue-execution/playbooks/objections/${objectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  deactivateSalesPlaybookObjection: async (objectionId: string | number) => {
    return apiRequest(`/api/v1/revenue-execution/playbooks/objections/${objectionId}`, {
      method: 'DELETE',
    })
  },

  getTrainingPrograms: async (params?: TrainingProgramParams) => {
    return apiRequest(`/api/v1/training-programs/${toQuery(params)}`)
  },

  createTrainingProgram: async (payload: BackendTrainingProgramCreate) => {
    return apiRequest('/api/v1/training-programs/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getTrainingProgram: async (programId: string | number) => {
    return apiRequest(`/api/v1/training-programs/${programId}`)
  },

  updateTrainingProgram: async (programId: string | number, payload: BackendTrainingProgramUpdate) => {
    return apiRequest(`/api/v1/training-programs/${programId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  updateTrainingProgramStatus: async (programId: string | number, status: string) => {
    return apiRequest(`/api/v1/training-programs/${programId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  deleteTrainingProgram: async (programId: string | number) => {
    return apiRequest(`/api/v1/training-programs/${programId}`, {
      method: 'DELETE',
    })
  },

  // --- REVENUE EXECUTION & COMMAND CENTER ---
  getRevenueCommandMetrics: async (params?: RevenueDateParams & { period_start?: string; period_end?: string }) => {
    return apiRequest(`/api/v1/revenue-execution/command-center${toQuery(params)}`)
  },

  getDailyExecutionRecords: async (params?: { branch_id?: number | string }) => {
    return apiRequest(`/api/v1/revenue-execution/days/today${toQuery(params)}`)
  },

  getDailyExecutionDay: async (dayDate: string, params?: { branch_id?: number | string }) => {
    return apiRequest(`/api/v1/revenue-execution/days/${dayDate}${toQuery(params)}`)
  },

  openDailyExecutionDay: async (payload: OpenDailyExecutionDay = {}) => {
    return apiRequest('/api/v1/revenue-execution/days/open', {
      method: 'POST',
      body: JSON.stringify({
        date: payload.date ?? null,
        branch_id: payload.branch_id ?? null,
        force_rebuild: payload.force_rebuild ?? false,
      }),
    })
  },

  listDailyActionTemplates: async (params?: { branch_id?: number | string; is_active?: boolean }) => {
    return apiRequest(`/api/v1/revenue-execution/action-templates${toQuery(params)}`)
  },

  createDailyActionTemplate: async (payload: DailyActionTemplateCreate) => {
    return apiRequest('/api/v1/revenue-execution/action-templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateDailyActionTemplate: async (templateId: string | number, payload: DailyActionTemplateUpdate) => {
    return apiRequest(`/api/v1/revenue-execution/action-templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  deleteDailyActionTemplate: async (templateId: string | number) => {
    return apiRequest(`/api/v1/revenue-execution/action-templates/${templateId}`, {
      method: 'DELETE',
    })
  },

  getRevenueExecutionSummary: async (params?: RevenueDateParams) => {
    return apiRequest(`/api/v1/revenue-execution/summary${toQuery(params)}`)
  },

  updateDailyAction: async (actionId: string | number, payload: DailyActionUpdate) => {
    return apiRequest(`/api/v1/revenue-execution/actions/${actionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  completeDailyAction: async (actionId: string | number, payload: DailyActionComplete = {}) => {
    return apiRequest(`/api/v1/revenue-execution/actions/${actionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  reopenDailyAction: async (actionId: string | number) => {
    return apiRequest(`/api/v1/revenue-execution/actions/${actionId}/reopen`, {
      method: 'POST',
    })
  },

  getFunnelLeaks: async (params?: RevenuePeriodParams) => {
    return apiRequest(`/api/v1/revenue-execution/funnel-audit${toQuery(params)}`)
  },

  getFunnelSummary: async () => {
    return apiRequest('/api/v1/funnel/summary')
  },

  getFunnelConversionBreakdown: async () => {
    return apiRequest('/api/v1/funnel/conversion-breakdown')
  },

  getFunnelDropOffAlerts: async (params?: { threshold?: number }) => {
    return apiRequest(`/api/v1/funnel/drop-off-alerts${toQuery(params)}`)
  },

  getFunnelLeadActivityLog: async (params?: { stage?: string; status?: string; search?: string; limit?: number; offset?: number }) => {
    return apiRequest(`/api/v1/funnel/leads/activity-log${toQuery(params)}`)
  },

  getSpeedToLeadQueue: async (params?: { branch_id?: number | string; limit?: number }) => {
    return apiRequest(`/api/v1/revenue-execution/speed-to-lead-queue${toQuery(params)}`)
  },

  getActivityScorecard: async (params?: RevenueDateParams) => {
    return apiRequest(`/api/v1/revenue-execution/activity-scorecard${toQuery(params)}`)
  },

  getRevenueOkrs: async (params?: {
    period_start?: string
    period_end?: string
    branch_id?: number | string
    status?: string
  }) => {
    return apiRequest(`/api/v1/revenue-execution/okrs${toQuery(params)}`)
  },

  updateRevenueKeyResult: async (keyResultId: string | number, payload: RevenueKeyResultUpdate) => {
    return apiRequest(`/api/v1/revenue-execution/okrs/key-results/${keyResultId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  updateRevenueObjective: async (objectiveId: string | number, payload: JsonPayload) => {
    return apiRequest(`/api/v1/revenue-execution/okrs/${objectiveId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  getRevenueTargetsSummary: async (params?: {
    period_start?: string
    period_end?: string
    period?: string
    role_id?: number | string
    branch_id?: number | string
  }) => {
    return apiRequest(`/api/v1/revenue-execution/targets/summary${toQuery(params)}`)
  },

  getDashboardStats: async () => {
    return apiRequest('/api/v1/stats/dashboard')
  },

  getServiceStats: async () => {
    return apiRequest('/api/v1/stats')
  },

  getRevenueForecast: async (params?: RevenuePeriodParams & { scenario?: string }) => {
    return apiRequest(`/api/v1/revenue-execution/forecast${toQuery(params)}`)
  },

  exportRevenueForecast: async (params?: RevenuePeriodParams & { scenario?: string }) => {
    return apiRequest(`/api/v1/revenue-execution/forecast/export${toQuery(params)}`)
  },

  getLeadControl: async (params?: {
    filter?: string
    search?: string
    branch_id?: number | string
    division?: string
    assigned_to_id?: number | string
    limit?: number
  }) => {
    return apiRequest(`/api/v1/revenue-execution/lead-control${toQuery(params)}`)
  },

  autoAssignLeads: async (params?: { branch_id?: number | string; limit?: number }) => {
    return apiRequest(`/api/v1/revenue-execution/lead-control/auto-assign${toQuery(params)}`, {
      method: 'POST',
    })
  },

  repairLeadNextActions: async (params?: { branch_id?: number | string; limit?: number }) => {
    return apiRequest(`/api/v1/revenue-execution/lead-control/repair-next-actions${toQuery(params)}`, {
      method: 'POST',
    })
  },

  getTurnaroundPlans: async (params?: { status?: string; branch_id?: number | string }) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/plans${toQuery(params)}`)
  },

  getActiveTurnaroundPlan: async (params?: { branch_id?: number | string }) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/plans/active${toQuery(params)}`)
  },

  getTurnaroundPlan: async (planId: string | number) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/plans/${planId}`)
  },

  createTurnaroundPlan: async (payload: TurnaroundPlanCreate) => {
    return apiRequest('/api/v1/revenue-execution/turnaround/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateTurnaroundPlan: async (planId: string | number, payload: TurnaroundPlanUpdate) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  activateTurnaroundPlan: async (planId: string | number) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/plans/${planId}/activate`, {
      method: 'POST',
    })
  },

  closeTurnaroundPlan: async (planId: string | number) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/plans/${planId}/close`, {
      method: 'POST',
    })
  },

  updateTurnaroundAction: async (actionId: string | number, payload: TurnaroundActionUpdate) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/actions/${actionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  completeTurnaroundAction: async (actionId: string | number, payload: TurnaroundActionComplete = {}) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/actions/${actionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  reopenTurnaroundAction: async (actionId: string | number) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/actions/${actionId}/reopen`, {
      method: 'POST',
    })
  },

  exportTurnaroundPlan: async (planId: string | number) => {
    return apiRequest(`/api/v1/revenue-execution/turnaround/plans/${planId}/export`)
  },

  // --- APPROVALS & AUDIT LOGS ---
  getPermissionsMap: async () => {
    return apiRequest('/api/v1/roles/permissions-map')
  },

  getMyAuthorityLimits: async () => {
    return apiRequest('/api/v1/roles/me/authority-limits')
  },

  getApprovalFlowChoices: async () => {
    return apiRequest('/api/v1/approvals/flows/choices')
  },

  getApprovalFlows: async (params?: { action_type?: string; is_active?: boolean; search?: string; limit?: number; offset?: number }) => {
    return apiRequest(`/api/v1/approvals/flows${toQuery(params)}`)
  },

  getApprovals: async (params?: { status?: string; action_type?: string; my_requests?: boolean; pending_my_approval?: boolean; search?: string; limit?: number; offset?: number }) => {
    return apiRequest(`/api/v1/approvals/requests${toQuery(params)}`)
  },

  createApprovalRequest: async (payload: BackendApprovalRequestCreate) => {
    return apiRequest('/api/v1/approvals/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getApprovalRequest: async (approvalId: string | number) => {
    return apiRequest(`/api/v1/approvals/requests/${approvalId}`)
  },

  cancelApprovalRequest: async (approvalId: string | number) => {
    return apiRequest(`/api/v1/approvals/requests/${approvalId}`, {
      method: 'DELETE',
    })
  },

  submitApprovalDecision: async (approvalId: string | number, decision: BackendApprovalDecision) => {
    const action = decision.status === 'approved' ? 'approve' : 'reject'
    return apiRequest(`/api/v1/approvals/requests/${approvalId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ comment: decision.comment ?? decision.comments ?? null }),
    })
  },

  getAuditLogs: async (params?: { limit?: number; offset?: number; search?: string; user_id?: number | string; audit_type?: string; audit_status?: string; start_date?: string; end_date?: string }) => {
    return apiRequest(`/api/v1/audit-logs/${toQuery(params)}`)
  },

  getMeetingChoices: async () => {
    return apiRequest('/api/v1/meetings/choices')
  },

  getMeetings: async (params?: { status?: string; location_type?: string; date_from?: string; date_to?: string; my_meetings?: boolean; search?: string; limit?: number; offset?: number }) => {
    return apiRequest(`/api/v1/meetings/${toQuery(params)}`)
  },

  createMeeting: async (payload: BackendMeetingCreate) => {
    return apiRequest('/api/v1/meetings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getMeeting: async (meetingId: string | number) => {
    return apiRequest(`/api/v1/meetings/${meetingId}`)
  },

  updateMeeting: async (meetingId: string | number, payload: BackendMeetingUpdate) => {
    return apiRequest(`/api/v1/meetings/${meetingId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  cancelMeeting: async (meetingId: string | number) => {
    return apiRequest(`/api/v1/meetings/${meetingId}`, {
      method: 'DELETE',
    })
  },

  getMarketingMeetings: async (params?: MarketingMeetingParams) => {
    return apiRequest(`/api/v1/marketing/meetings${toQuery(params)}`)
  },

  createMarketingMeeting: async (payload: BackendMarketingMeetingCreate) => {
    return apiRequest('/api/v1/marketing/meetings', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  exportMarketingMeetings: async (params?: MarketingMeetingParams) => {
    return apiRequest(`/api/v1/marketing/meetings/export${toQuery(params)}`)
  },

  getMarketingMeeting: async (meetingId: string | number) => {
    return apiRequest(`/api/v1/marketing/meetings/${meetingId}`)
  },

  updateMarketingMeeting: async (meetingId: string | number, payload: BackendMarketingMeetingUpdate) => {
    return apiRequest(`/api/v1/marketing/meetings/${meetingId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  createMarketingMeetingAction: async (meetingId: string | number, payload: BackendMarketingMeetingActionCreate) => {
    return apiRequest(`/api/v1/marketing/meetings/${meetingId}/actions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateMarketingMeetingAction: async (actionId: string | number, payload: BackendMarketingMeetingActionUpdate) => {
    return apiRequest(`/api/v1/marketing/meetings/actions/${actionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  createMarketingMeetingDecision: async (meetingId: string | number, payload: BackendMarketingMeetingDecisionCreate) => {
    return apiRequest(`/api/v1/marketing/meetings/${meetingId}/decisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getComplianceRecords: async (params?: {
    date_from?: string
    date_to?: string
    compliance_type?: string
    search?: string
    limit?: number
    offset?: number
  }) => {
    return apiRequest(`/api/v1/compliance/compliance-records${toQuery(params)}`)
  },

  createComplianceRecord: async (payload: ComplianceRecordCreate) => {
    return apiRequest('/api/v1/compliance/compliance-records', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateComplianceRecord: async (recordId: string | number, payload: ComplianceRecordUpdate) => {
    return apiRequest(`/api/v1/compliance/compliance-records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  deleteComplianceRecord: async (recordId: string | number) => {
    return apiRequest(`/api/v1/compliance/compliance-records/${recordId}`, {
      method: 'DELETE',
    })
  },
}
