import type { ApiResponse } from './apiClient'

export type ApiState =
  | 'loading'
  | 'empty'
  | 'forbidden'
  | 'unauthorized'
  | 'unsupported'
  | 'validationError'
  | 'networkError'
  | 'success'

function isEmptyPayload(data: unknown): boolean {
  if (data == null) return true
  if (Array.isArray(data)) return data.length === 0
  if (typeof data !== 'object') return false

  const record = data as Record<string, unknown>
  for (const key of ['items', 'results', 'rows']) {
    if (Array.isArray(record[key])) return record[key].length === 0
  }

  return false
}

export function classifyApiResponse<T>(response: ApiResponse<T>): ApiState {
  if (response.status === 401) return 'unauthorized'
  if (response.status === 403) return 'forbidden'
  if (response.status === 404) return 'unsupported'
  if (response.status >= 500 || response.status === 0) return 'networkError'
  if (response.status >= 400) return 'validationError'
  if (isEmptyPayload(response.data)) return 'empty'
  return 'success'
}
