import { apiRequest } from './apiClient'
import { getRefreshToken } from './authTokenStore'

export interface LoginPayload {
  email: string
  password: string
}

export interface Verify2FAPayload {
  session_token: string
  code: string
}

export interface AuthTokenResponse {
  access_token: string
  refresh_token?: string
  requires_2fa?: boolean
  session_token?: string
  user_id?: number
}

export interface RefreshTokenResponse {
  access_token: string
  success?: boolean
  detail?: string
}

export interface UserProfile {
  id: number
  email: string
  username: string
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  is_verified: boolean
  created_at: string
  role?: string
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
  login: async (payload: LoginPayload) => {
    return apiRequest<AuthTokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  verify2FA: async (payload: Verify2FAPayload) => {
    return apiRequest<AuthTokenResponse>('/api/v1/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  refreshSession: async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      return { status: 401, error: 'No refresh token available' }
    }

    return apiRequest<RefreshTokenResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }, false)
  },

  getCurrentUser: async () => {
    return apiRequest<UserProfile>('/api/v1/auth/me')
  },

  getUserRole: async (userId: number | string) => {
    return apiRequest<UserRoleResponse>(`/api/v1/roles/employees/${userId}`)
  },

  getRoleById: async (roleId: number | string) => {
    return apiRequest(`/api/v1/roles/${roleId}`)
  },

  getPermissionsMap: async () => {
    return apiRequest('/api/v1/roles/permissions-map')
  },

  getAuthorityLimits: async () => {
    return apiRequest('/api/v1/roles/me/authority-limits')
  },

  logout: async () => {
    return apiRequest('/api/v1/auth/logout', {
      method: 'POST',
    })
  },
}
