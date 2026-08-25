/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react'
import { authService, type UserProfile, type UserRoleResponse, type EmployeeDetailsResponse } from '../services/api/authService'
import { clearAccessToken, clearLegacyStoredTokens, clearRefreshToken, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '../services/api/authTokenStore'
import { ROLES } from '../data/defaults'
import { firstAccessibleScreen } from '../navigation'

interface AuthContextValue {
  user: UserProfile | null
  userRole: UserRoleResponse | null
  employeeDetails: EmployeeDetailsResponse | null
  permissions: Record<string, string[]>
  currentRole: string
  isLoggedIn: boolean
  isLoading: boolean
  twoFactorToken: string | null
  hasPermission: (resource: string, action?: string) => boolean
  getFirstAccessibleScreen: () => string
  denyScreenAccess: (screen: string) => void
  login: (email: string, pass: string) => Promise<{ success: boolean; requires2FA?: boolean; error?: string; redirectTo?: string }>
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  logout: () => void
}

const SCREEN_TO_RESOURCE_MAP: Record<string, string[]> = {
  dashboard: ['dashboard', 'marketing_dashboard', 'stats'],
  workdesk: ['workdesk', 'employees', 'role_daily_routines', 'target_reports'],
  pipeline: ['pipeline', 'leads', 'deals', 'crm'],
  'leads-detail': ['leads', 'pipeline'],
  'lead-journal': ['leads', 'followups', 'inquiries'],
  calendar: ['calendar', 'content_calendar', 'content_calendar_briefs'],
  campaigns: ['marketing_campaigns', 'campaigns', 'campaign'],
  analytics: ['analytics', 'marketing_analytics'],
  okrs: ['employee_targets', 'role_kpis', 'kpis', 'okrs', 'targets'],
  whatsapp: ['whatsapp', 'messages', 'inquiries'],
  partners: ['partners', 'partner_agreements'],
  design: ['design', 'tasks', 'projects'],
  support: ['support', 'service_requests', 'tickets'],
  'new-lead': ['leads', 'service_leads'],
  'team-directory': ['employees', 'team'],
  media: ['media', 'media_library', 'content_media_library'],
  'revenue-command': ['revenue_command'],
  'daily-execution': ['daily_execution', 'revenue_execution_daily_execution'],
  'lead-control': ['lead_controltower', 'lead_control', 'revenue_execution_lead_control'],
  'funnel-audit': ['funnel_audit', 'revenue_execution_funnel_audit'],
  playbooks: ['role_success_playbook', 'role_sops', 'playbooks'],
  'content-studio': ['content', 'content_studio'],
  coaching: ['role_training_requirements', 'training_programs', 'coaching'],
  forecast: ['forecast', 'revenue_forecast'],
  retention: ['retention', 'referrals'],
  compliance: ['compliance_records', 'compliance_audits', 'compliance'],
  turnaround: ['turnaround', 'turnaround_plan'],
  integrations: ['integrations'],
  'email-center': ['email_center', 'email', 'marketing_email'],
  'media-register': ['media_register', 'traditional_media'],
  'realtor-portal': ['realtors', 'partners'],
  'partner-portal': ['partners', 'partner_agreements', 'partner_portal'],
  handoff: ['handoff', 'clients', 'sales'],
  'role-governance': ['roles', 'permissions', 'role_governance'],
  approvals: ['approval_requests', 'approval_flows', 'approvals'],
  'audit-log': ['audit_logs', 'logs'],
  'marketing-meetings': ['marketing_meetings', 'marketing-meetings'],
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getFallbackRole(emp: EmployeeDetailsResponse | undefined, roleName: string, position: string): UserRoleResponse {
  const parsedRoleId = typeof emp?.role_id === 'string' ? Number(emp.role_id) : emp?.role_id

  return {
    id: typeof parsedRoleId === 'number' && Number.isFinite(parsedRoleId) ? parsedRoleId : 0,
    name: roleName || position || 'Staff',
    permissions: {},
    created_at: '',
    updated_at: '',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function roleBranchName(role: UserRoleResponse): string {
  const firstBranch = role.branches?.find(isRecord)
  return firstString(firstBranch?.name, firstBranch?.branch_name, firstBranch?.title)
}

function employeeDetailsFromRole(userProfile: UserProfile, role: UserRoleResponse): EmployeeDetailsResponse {
  const fullName = firstString(
    [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' '),
    userProfile.username,
    userProfile.email,
  )

  return {
    id: userProfile.id,
    employee_id: String(userProfile.id),
    email: userProfile.email,
    full_name: fullName,
    phone: userProfile.phone_number || '',
    department_id: '',
    position: role.name,
    role_id: role.id,
    role_name: role.name,
    designation: role.name,
    department_name: '',
    branch_name: roleBranchName(role),
    is_active: true,
  }
}

function mapRoleNameToKey(roleName?: string, position?: string, email?: string): string {
  const str = `${roleName || ''} ${position || ''} ${email || ''}`.toLowerCase()

  if (
    str.includes('ceo') ||
    str.includes('founder') ||
    str.includes('chief executive') ||
    str.includes('managing director')
  ) {
    return 'ceo'
  }
  if (str.includes('coordinator')) {
    return 'coord'
  }
  if (str.includes('business development') || str.includes('business developer') || str.includes('bizdev')) {
    return 'bizdev'
  }
  if (
    str.includes('software') ||
    str.includes('analyst') ||
    str.includes('analytics') ||
    str.includes('data')
  ) {
    return 'analyst'
  }
  if (str.includes('manager') || str.includes('head')) {
    return 'mgr'
  }
  if (str.includes('digital') || str.includes('marketer')) {
    return 'digital'
  }
  if (str.includes('sales') || str.includes('rep')) {
    return 'sales'
  }
  if (str.includes('content') || str.includes('creator') || str.includes('writer')) {
    return 'content'
  }
  if (str.includes('design') || str.includes('graphic')) {
    return 'graphic'
  }
  if (str.includes('care') || str.includes('support')) {
    return 'care'
  }
  if (str.includes('partner') || str.includes('realtor')) {
    return 'partner'
  }

  return 'coord'
}

function canAccessWithPermissions(
  resource: string,
  action: string,
  roleKey: string,
  permissionMap: Record<string, string[]>,
): boolean {
  if (resource === 'integrations') return false

  if (roleKey === 'ceo' || permissionMap['*'] || permissionMap.all) {
    return true
  }

  const cleanRes = resource.toLowerCase().replace(/^\//, '').replace(/-/g, '_')
  const candidates = Array.from(
    new Set([
      cleanRes,
      resource,
      ...(SCREEN_TO_RESOURCE_MAP[cleanRes] || []),
      ...(SCREEN_TO_RESOURCE_MAP[resource] || []),
    ])
  )

  const hasBackendPermissions = Object.keys(permissionMap).length > 0

  if (hasBackendPermissions) {
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(permissionMap, key)) {
        const val = permissionMap[key]
        if (Array.isArray(val)) {
          if (val.length === 0) return false
          const act = action.toLowerCase()
          if (act === 'view') {
            return (
              val.includes('view') ||
              val.includes('read') ||
              val.includes('get') ||
              val.includes('list') ||
              val.includes('access') ||
              val.includes('*') ||
              val.includes('all')
            )
          }
          return val.includes(act) || val.includes('*') || val.includes('all')
        }
      }
    }

    const cleanCandSet = new Set(candidates.map((c) => c.replace(/_/g, '')))
    for (const pKey of Object.keys(permissionMap)) {
      const cleanPKey = pKey.toLowerCase().replace(/_/g, '')
      if (cleanCandSet.has(cleanPKey)) {
        const val = permissionMap[pKey]
        if (Array.isArray(val)) {
          if (val.length === 0) return false
          const act = action.toLowerCase()
          if (act === 'view') {
            return (
              val.includes('view') ||
              val.includes('read') ||
              val.includes('get') ||
              val.includes('list') ||
              val.includes('access') ||
              val.includes('*') ||
              val.includes('all')
            )
          }
          return val.includes(act) || val.includes('*') || val.includes('all')
        }
      }
    }

    return false
  }

  const roleNav = ROLES[roleKey]?.nav || ROLES.coord.nav
  return roleNav.flatMap((g) => g.items).some((item) => item.s === resource || item.s === cleanRes)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userRole, setUserRole] = useState<UserRoleResponse | null>(null)
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetailsResponse | null>(null)
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})
  const [currentRole, setCurrentRole] = useState<string>('coord')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null)
  const [deniedScreens, setDeniedScreens] = useState<Set<string>>(() => new Set())

  // Fetch full user role & permissions from GET /api/v1/roles/employees/{id}
  const fetchUserRoleAndPermissions = async (userProfile: UserProfile) => {
    try {
      let roleName = ''
      let positionStr = ''
      let extracted: Record<string, string[]> = {}
      let employee: EmployeeDetailsResponse | undefined

      const roleRes = await authService.getUserRole(userProfile.id).catch(() => null)
      if (roleRes?.data) {
        setUserRole(roleRes.data)
        employee = employeeDetailsFromRole(userProfile, roleRes.data)
        setEmployeeDetails(employee)
        extracted = roleRes.data.permissions || {}
        if (roleRes.data.name) roleName = roleRes.data.name
      } else {
        if (import.meta.env.DEV && roleRes?.error) {
          console.warn('Could not load assigned employee role permissions', {
            status: roleRes.status,
            error: roleRes.error,
          })
        }
        setUserRole(getFallbackRole(employee, roleName, positionStr))
        setEmployeeDetails(null)
      }

      positionStr = employee?.position || employee?.designation || ''
      setPermissions(extracted)
      setDeniedScreens(new Set())

      const activeKey = mapRoleNameToKey(roleName || positionStr, positionStr, userProfile.email)
      setCurrentRole(activeKey)
      const redirectTo = firstAccessibleScreen(activeKey, extracted, (resource, action = 'view') =>
        canAccessWithPermissions(resource, action, activeKey, extracted)
      )
      return { activeKey, permissions: extracted, redirectTo }
    } catch {
      const activeKey = mapRoleNameToKey('', '', userProfile.email)
      const emptyPermissions: Record<string, string[]> = {}
      setCurrentRole(activeKey)
      setPermissions(emptyPermissions)
      setEmployeeDetails(null)
      setDeniedScreens(new Set())
      return {
        activeKey,
        permissions: emptyPermissions,
        redirectTo: firstAccessibleScreen(activeKey, emptyPermissions, (resource, action = 'view') =>
          canAccessWithPermissions(resource, action, activeKey, emptyPermissions)
        ),
      }
    }
  }

  // Restore authenticated user session on app mount
  useEffect(() => {
    let isCancelled = false

    async function restoreSession() {
      clearLegacyStoredTokens()

      // 1. Check if an access token was provided in the URL query string or in authTokenStore
      const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      const tokenFromUrl = searchParams.get('token') || searchParams.get('access_token') || getAccessToken()
      const refreshTokenFromUrl = searchParams.get('refresh_token') || searchParams.get('refreshToken') || getRefreshToken()

      if (tokenFromUrl) {
        try {
          setAccessToken(tokenFromUrl)
          if (refreshTokenFromUrl) {
            setRefreshToken(refreshTokenFromUrl)
          }

          const res = await Promise.race([
            authService.getCurrentUser(),
            new Promise<{ data?: UserProfile }>((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000)),
          ]).catch(() => null)

          if (isCancelled) return

          const userObj = res?.data && ((res.data as any).id ? res.data : ((res.data as any).user || res.data))
          if (userObj && (userObj.id || userObj.email)) {
            setUser(userObj)
            setIsLoggedIn(true)
            await fetchUserRoleAndPermissions(userObj)
            setIsLoading(false)
            return
          } else {
            // Fallback: If token was provided, create a staff session so app does not get stuck in loader
            const fallbackUser: UserProfile = {
              id: 1,
              email: 'staff@bomach.com',
              username: 'staff',
              first_name: 'Staff',
              last_name: 'Member',
              is_verified: true,
              created_at: new Date().toISOString(),
            }
            setUser(fallbackUser)
            setIsLoggedIn(true)
            await fetchUserRoleAndPermissions(fallbackUser)
            setIsLoading(false)
            return
          }
        } catch (err) {
          console.warn('Failed to authenticate with token from URL/store:', err)
        }
      }

      // 2. Try cookie/refresh session
      try {
        const refreshRes = await authService.refreshSession()
        if (refreshRes.data?.access_token) {
          setAccessToken(refreshRes.data.access_token)

          const res = await authService.getCurrentUser()
          if (res.data?.id) {
            if (isCancelled) return
            setUser(res.data)
            setIsLoggedIn(true)
            await fetchUserRoleAndPermissions(res.data)
            setIsLoading(false)
            return
          }
        }
      } catch {
        /* Invalid, expired, or unavailable refresh cookie. */
      }

      if (isCancelled) return

      const isEmbed = searchParams.get('embed') === 'true' || searchParams.get('embedded') === 'true' || Boolean(tokenFromUrl)
      if (!isEmbed) {
        clearAccessToken()
        clearRefreshToken()
      }
      setUser(null)
      setUserRole(null)
      setEmployeeDetails(null)
      setPermissions({})
      setDeniedScreens(new Set())
      setIsLoggedIn(false)
      setIsLoading(false)
    }

    restoreSession()

    // Listen for postMessage from parent container (e.g. Bomach OS webview)
    const handleMessage = async (e: MessageEvent) => {
      if (e.data && (e.data.type === 'BOMACH_AUTH_TOKEN' || e.data.type === 'SET_AUTH_TOKEN' || e.data.token)) {
        const incomingToken = String(e.data.token || e.data.accessToken || '')
        const incomingRefreshToken = e.data.refreshToken ? String(e.data.refreshToken) : incomingToken
        if (incomingToken) {
          setAccessToken(incomingToken)
          if (incomingRefreshToken) {
            setRefreshToken(incomingRefreshToken)
          }
          try {
            const res = await authService.getCurrentUser()
            const userObj = res.data && ((res.data as any).id ? res.data : ((res.data as any).user || res.data))
            if (userObj && (userObj.id || userObj.email)) {
              setUser(userObj)
              setIsLoggedIn(true)
              await fetchUserRoleAndPermissions(userObj)
            } else {
              const fallbackUser: UserProfile = {
                id: 1,
                email: 'staff@bomach.com',
                username: 'staff',
                first_name: 'Staff',
                last_name: 'Member',
                is_verified: true,
                created_at: new Date().toISOString(),
              }
              setUser(fallbackUser)
              setIsLoggedIn(true)
              await fetchUserRoleAndPermissions(fallbackUser)
            }
          } catch (err) {
            console.warn('Failed to authenticate with postMessage token:', err)
          } finally {
            setIsLoading(false)
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      isCancelled = true
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const login = async (email: string, pass: string) => {
    setIsLoading(true)
    try {
      const res = await authService.login({ email, password: pass })

      if (res.data) {
        if (res.data.requires_2fa) {
          const token = res.data.session_token || null
          if (!token) {
            setIsLoading(false)
            return { success: false, error: '2FA session token was not returned by the server' }
          }
          setTwoFactorToken(token)
          setIsLoading(false)
          return { success: false, requires2FA: true }
        }

        if (res.data.access_token) {
          setAccessToken(res.data.access_token)
          setRefreshToken(res.data.refresh_token)

          // Fetch user profile from GET /api/v1/auth/me
          const meRes = await authService.getCurrentUser()
          const userIdNum: number = typeof res.data.user_id === 'number' ? res.data.user_id : 1
          const profile: UserProfile = meRes.data || {
            id: userIdNum,
            email,
            username: email.split('@')[0],
            first_name: 'Authenticated',
            last_name: 'User',
            is_verified: true,
            created_at: new Date().toISOString(),
          }

          setUser(profile)
          setIsLoggedIn(true)

          const roleLoad = await fetchUserRoleAndPermissions(profile)
          setIsLoading(false)
          return { success: true, redirectTo: roleLoad.redirectTo }
        }
      }

      setIsLoading(false)
      return { success: false, error: res.error || 'Invalid login credentials' }
    } catch (err: unknown) {
      setIsLoading(false)
      return { success: false, error: err instanceof Error ? err.message : 'Login request failed' }
    }
  }

  const verify2FA = async (code: string) => {
    if (!twoFactorToken) return { success: false, error: 'No 2FA session token' }
    setIsLoading(true)
    try {
      const res = await authService.verify2FA({ session_token: twoFactorToken, code })
      if (res.data && res.data.access_token) {
        setAccessToken(res.data.access_token)
        setRefreshToken(res.data.refresh_token)
        const meRes = await authService.getCurrentUser()
        const userIdNum: number = typeof res.data.user_id === 'number' ? res.data.user_id : 1
        const profile: UserProfile = meRes.data || {
          id: userIdNum,
          email: 'user@bomach.com',
          username: 'user',
          is_verified: true,
          created_at: new Date().toISOString(),
        }
        setUser(profile)
        setIsLoggedIn(true)
        setTwoFactorToken(null)
        const roleLoad = await fetchUserRoleAndPermissions(profile)
        setIsLoading(false)
        return { success: true, redirectTo: roleLoad.redirectTo }
      }
      setIsLoading(false)
      return { success: false, error: res.error || 'Invalid 2FA verification code' }
    } catch (err: unknown) {
      setIsLoading(false)
      return { success: false, error: err instanceof Error ? err.message : 'Verification failed' }
    }
  }

  const hasPermission = useCallback((resource: string, action = 'view'): boolean => {
    const cleanResource = resource.toLowerCase().replace(/^\//, '')
    if (action === 'view' && deniedScreens.has(cleanResource)) return false
    return canAccessWithPermissions(resource, action, currentRole, permissions)
  }, [currentRole, deniedScreens, permissions])

  const getFirstAccessibleScreen = useCallback(
    () => firstAccessibleScreen(currentRole, permissions, hasPermission),
    [currentRole, hasPermission, permissions],
  )

  const denyScreenAccess = useCallback((screen: string) => {
    const cleanScreen = screen.toLowerCase().replace(/^\//, '')
    setDeniedScreens((current) => {
      if (current.has(cleanScreen)) return current
      const next = new Set(current)
      next.add(cleanScreen)
      return next
    })
  }, [])

  const logout = () => {
    authService.logout().catch(() => {})
    clearAccessToken()
    clearLegacyStoredTokens()
    clearRefreshToken()
    setUser(null)
    setUserRole(null)
    setEmployeeDetails(null)
    setPermissions({})
    setDeniedScreens(new Set())
    setIsLoggedIn(false)
    setTwoFactorToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        employeeDetails,
        permissions,
        currentRole,
        isLoggedIn,
        isLoading,
        twoFactorToken,
        hasPermission,
        getFirstAccessibleScreen,
        denyScreenAccess,
        login,
        verify2FA,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
