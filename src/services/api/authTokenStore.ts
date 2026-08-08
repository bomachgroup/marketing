let accessToken: string | null = null
const REFRESH_TOKEN_KEY = 'bomach_refresh_token_v1'

export function getAccessToken() {
  return accessToken
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function setRefreshToken(token: string | null | undefined) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
    return
  }
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearAccessToken() {
  accessToken = null
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearLegacyStoredTokens() {
  localStorage.removeItem('bomach_access_token')
  localStorage.removeItem('bomach_refresh_token')
  localStorage.removeItem('bomachOS_v3_auth')
}
