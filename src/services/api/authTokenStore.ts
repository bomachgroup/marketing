const ACCESS_TOKEN_KEY = 'bomach_access_token_v1'
const REFRESH_TOKEN_KEY = 'bomach_refresh_token_v1'
let accessToken: string | null = null

export function getAccessToken(): string | null {
  if (accessToken) return accessToken
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY)
      if (stored) {
        accessToken = stored
        return stored
      }
    } catch (_) {}
  }
  return null
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch (_) {}
  }
  return null
}

export function setAccessToken(token: string | null) {
  accessToken = token
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
        localStorage.setItem(ACCESS_TOKEN_KEY, token)
      } else {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(ACCESS_TOKEN_KEY)
      }
    } catch (_) {}
  }
}

export function setRefreshToken(token: string | null | undefined) {
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
        localStorage.setItem(REFRESH_TOKEN_KEY, token)
      } else {
        sessionStorage.removeItem(REFRESH_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
      }
    } catch (_) {}
  }
}

export function clearAccessToken() {
  accessToken = null
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    } catch (_) {}
  }
}

export function clearRefreshToken() {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    } catch (_) {}
  }
}

export function clearLegacyStoredTokens() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('bomach_access_token')
      localStorage.removeItem('bomach_refresh_token')
      localStorage.removeItem('bomachOS_v3_auth')
    } catch (_) {}
  }
}

// Ingest tokens synchronously upon script load
if (typeof window !== 'undefined') {
  try {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token') || params.get('access_token')
    const urlRefreshToken = params.get('refresh_token') || params.get('refreshToken') || urlToken
    if (urlToken) {
      setAccessToken(urlToken)
      if (urlRefreshToken) {
        setRefreshToken(urlRefreshToken)
      }
    }
  } catch (_) {}
}
