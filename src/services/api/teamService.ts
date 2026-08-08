import { apiRequest } from './apiClient'

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

export interface EmployeeListParams {
  is_active?: boolean
  add_shareholders?: boolean
  offboarded?: boolean
  employment_type?: string
  department_id?: number | string
  branch_id?: number | string
  search?: string
  sort_by_dob?: string | null
  limit?: number
  offset?: number
}

export interface DepartmentListParams {
  search?: string
  limit?: number
  offset?: number
}

export interface UnitListParams {
  department_id?: number | string
  limit?: number
  offset?: number
}

export const teamService = {
  listEmployees: async (params?: EmployeeListParams) => {
    return apiRequest(`/api/v1/employees/employees${toQuery(params ? { ...params } : undefined)}`)
  },

  getEmployee: async (userId: string | number) => {
    return apiRequest(`/api/v1/roles/employees/${userId}`)
  },

  listDepartments: async (params?: DepartmentListParams) => {
    return apiRequest(`/api/v1/employees/department${toQuery(params ? { ...params } : undefined)}`)
  },

  listUnits: async (params?: UnitListParams) => {
    return apiRequest(`/api/v1/employees/unit${toQuery(params ? { ...params } : undefined)}`)
  },
}
