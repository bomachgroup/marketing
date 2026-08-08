import { apiRequest } from './apiClient'

export interface DashboardSummaryResponse {
  full_name: string
  job_title: string
  department_name: string
  scorecard?: {
    overall_score?: number
    crm_score?: number
    target_score?: number
  }
  ranking?: {
    rank_text?: string
    total_department_users?: number
  }
}

export interface PerformanceCardResponse {
  full_name: string
  job_title: string
  department_name: string
  overall_score: number
  rank_text: string
  work_report?: {
    completed_tasks?: number
    total_tasks?: number
    report_status?: string
  }
  punctuality_report?: {
    punctuality_rate?: number
  }
}

export interface DailyRoutineItem {
  id: number | string
  routine_name: string
  category?: 'morning' | 'afternoon' | 'close' | string
  is_completed?: boolean
  description?: string
}

export interface EmployeeKPIItem {
  id: number | string
  metric_name: string
  target_value: number
  actual_value: number
  score_percentage: number
}

export interface EmployeeTargetItem {
  id: number | string
  title?: string
  target_name?: string
  progress_percentage?: number | string
  status?: string
  is_active?: boolean
}

export interface TargetReportPayload {
  employee_target_id: number
  summary: string
  progress_value: number | string
}

export interface TargetReportListParams {
  employee_target_id?: number | string | null
  status?: string | null
  period_start?: string | null
  period_end?: string | null
  submitted_from?: string | null
  submitted_to?: string | null
  search?: string | null
  limit?: number
  offset?: number
}

export interface TargetReportItem {
  id: number | string
  employee_target_id: number | string
  employee_target?: {
    id?: number | string
    title?: string
    target_value?: number | string
    unit?: string
    period?: string
    period_start?: string
    period_end?: string
  }
  summary: string
  progress_value: number | string
  status: string
  created_at: string
  updated_at?: string
}

export interface RoleDescriptionResponse {
  id: number
  role_id: number
  purpose: string
  responsibilities: string
  job_description: string
}

export interface DepartmentUnitItem {
  id: string
  name: string
  unit_name?: string
  description?: string
}

type QueryParams = Record<string, string | number | boolean | null | undefined>

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

export const workdeskService = {
  getSummary: async (params?: QueryParams) => {
    return apiRequest<DashboardSummaryResponse>(`/api/v1/dashboard/summary${toQuery(params)}`)
  },

  getPerformanceCard: async (params?: QueryParams) => {
    return apiRequest<PerformanceCardResponse>(`/api/v1/dashboard/performance-card${toQuery(params)}`)
  },

  getDailyRoutines: async (params?: QueryParams) => {
    return apiRequest<{ items: DailyRoutineItem[]; count: number }>(`/api/v1/roles/me/daily-routine${toQuery(params)}`)
  },

  getRoleDescription: async (params?: QueryParams) => {
    return apiRequest<RoleDescriptionResponse>(`/api/v1/roles/me/description${toQuery(params)}`)
  },

  getRoleSOPs: async (params?: QueryParams) => {
    return apiRequest<{ items: Array<Record<string, unknown>>; count: number }>(`/api/v1/roles/me/sops${toQuery(params)}`)
  },

  getDepartmentUnits: async (params?: QueryParams) => {
    return apiRequest<DepartmentUnitItem[]>(`/api/v1/employees/unit${toQuery(params)}`)
  },

  getMyKPIs: async (params?: QueryParams) => {
    return apiRequest<{ items: EmployeeKPIItem[]; count: number }>(`/api/v1/employees/me/kpis${toQuery(params)}`)
  },

  getMyTargets: async (params?: QueryParams) => {
    return apiRequest<{ items: EmployeeTargetItem[]; count: number }>(`/api/v1/employees/me/targets${toQuery(params)}`)
  },

  getMyTargetReports: async (params?: TargetReportListParams) => {
    return apiRequest<{ items: TargetReportItem[]; count: number }>(
      `/api/v1/target-reports/me${toQuery(params ? { ...params } : undefined)}`
    )
  },

  createTargetReport: async (payload: TargetReportPayload) => {
    return apiRequest('/api/v1/target-reports/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
