import { apiRequest } from './apiClient'

export interface AuthRole {
  id: number
  name: string
}

export interface UserProfile {
  id: number | string
  email: string
  username: string
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  is_verified: boolean
  created_at: string
  role?: string | AuthRole | null
  permissions?: Record<string, string[]>
  is_superuser?: boolean
  is_staff?: boolean
}

export interface UserRoleResponse {
  id: number
  name: string
  permissions: Record<string, string[]>
  branches?: unknown[]
  created_at: string
  updated_at: string
}

export interface EmployeeDetailsResponse {
  id: string | number
  employee_id: string
  email: string
  full_name: string
  phone: string
  department_id: string
  position: string
  role_id?: number | string | null
  role_name?: string | null
  designation?: string | null
  department_name: string
  branch_name: string
  is_active: boolean
}

export const authService = {
  getCurrentUser: async () => {
    return apiRequest<UserProfile>('/auth/me')
  },

  getAuthorityLimits: async () => {
    return apiRequest('/api/v1/roles/me/authority-limits')
  },

  logout: async () => {
    return apiRequest('/auth/browser/logout', {
      method: 'POST',
    })
  },
}
