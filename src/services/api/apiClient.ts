import { clearAccessToken, clearRefreshToken, getAccessToken, getRefreshToken, setAccessToken } from './authTokenStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bomachauthtest.bgbot.app'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  status: number
}

function humanizeFieldName(field: string) {
  return field
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function parseFieldMessageString(value: string) {
  const parts = value
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) return ''

  const parsed = parts.map((part) => {
    const match = part.match(/^([\w.\s-]+):\s*(.+)$/)
    if (!match) return part
    return `${humanizeFieldName(match[1])}: ${match[2].trim()}`
  })

  return parsed.join(' ')
}

export function parseApiError(err: unknown): string {
  if (!err) return 'An unexpected error occurred.'

  if (typeof err === 'string') {
    const trimmed = err.trim()
    if (!trimmed) return 'An unexpected error occurred.'

    // Try to parse stringified JSON / Python dict strings like "{'email': ['Lead with this Email already exists.']}"
    try {
      const parsed = JSON.parse(trimmed)
      return parseApiError(parsed)
    } catch {
      if (/^[{[]/.test(trimmed)) {
        try {
          const sanitized = trimmed.replace(/'/g, '"')
          const parsed = JSON.parse(sanitized)
          return parseApiError(parsed)
        } catch {
          /* fall through to text parsing */
        }
      }

      const fieldMessage = parseFieldMessageString(trimmed)
      if (fieldMessage) return fieldMessage

      const match = trimmed.match(/['"]?[\w.]+['"]?:\s*\[?['"]([^'"]+)['"]?\]?/)
      if (match) return match[1]
      return trimmed
    }
  }

  if (typeof err === 'object') {
    if (Array.isArray(err)) {
      return err.map(parseApiError).join(' ')
    }
    const record = err as Record<string, unknown>
    if (record.detail) {
      return parseApiError(record.detail)
    }
    if (record.message) {
      return parseApiError(record.message)
    }
    if (record.error) {
      return parseApiError(record.error)
    }
    if (record.non_field_errors) {
      return parseApiError(record.non_field_errors)
    }

    // Object mapping field errors e.g. { email: ["Already exists"], phone: ["Invalid"] }.
    const messages: string[] = []
    for (const [field, val] of Object.entries(record)) {
      const parsedValue = parseApiError(val)
      if (parsedValue) {
        messages.push(`${humanizeFieldName(field)}: ${parsedValue}`)
      }
    }
    if (messages.length > 0) return messages.join(' ')
  }

  return String(err)
}

type RefreshTokenResponse = {
  access_token?: string
}

let refreshPromise: Promise<string | null> | null = null

function shouldAttemptRefresh(endpoint: string) {
  return ![
    '/api/v1/auth/login',
    '/api/v1/auth/verify-2fa',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
  ].some((authEndpoint) => endpoint.startsWith(authEndpoint))
}

export async function refreshAccessTokenFromCookie(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearAccessToken()
    return null
  }

  refreshPromise = fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        clearAccessToken()
        clearRefreshToken()
        return null
      }

      const data = await response.json() as RefreshTokenResponse
      if (!data.access_token) {
        clearAccessToken()
        return null
      }

      setAccessToken(data.access_token)
      return data.access_token
    })
    .catch(() => {
      clearAccessToken()
      return null
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// Most wrappers in this codebase consume broad backend response shapes and narrow them in transformers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<ApiResponse<T>> {
  const token = getAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: options.credentials || 'include',
    })

    if (response.status === 401 && retryOnUnauthorized && shouldAttemptRefresh(endpoint)) {
      const refreshedToken = await refreshAccessTokenFromCookie()
      if (refreshedToken) {
        return apiRequest<T>(endpoint, options, false)
      }
    }

    const status = response.status
    if (status === 204) {
      return { status, data: null as T }
    }

    const data = await response.json()
    if (!response.ok) {
      const rawError = data.error || data.detail || data.message || `HTTP Error ${status}`
      return {
        status,
        error: parseApiError(rawError),
      }
    }

    return { status, data }
  } catch (err: unknown) {
    return {
      status: 500,
      error: parseApiError(err instanceof Error ? err.message : 'Connection failed. Please check your network and try again.'),
    }
  }
}

// Multipart requests must let the browser set Content-Type with the boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFormRequest<T = any>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestInit, 'body'> = {},
  retryOnUnauthorized = true,
): Promise<ApiResponse<T>> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method: options.method || 'POST',
      body: formData,
      headers,
      credentials: options.credentials || 'include',
    })

    if (response.status === 401 && retryOnUnauthorized && shouldAttemptRefresh(endpoint)) {
      const refreshedToken = await refreshAccessTokenFromCookie()
      if (refreshedToken) {
        return apiFormRequest<T>(endpoint, formData, options, false)
      }
    }

    const status = response.status
    if (status === 204) {
      return { status, data: null as T }
    }

    const data = await response.json()
    if (!response.ok) {
      const rawError = data.error || data.detail || data.message || `HTTP Error ${status}`
      return {
        status,
        error: parseApiError(rawError),
      }
    }

    return { status, data }
  } catch (err: unknown) {
    return {
      status: 500,
      error: parseApiError(err instanceof Error ? err.message : 'Connection failed. Please check your network and try again.'),
    }
  }
}
