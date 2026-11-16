import { apiRequest, type ApiResponse } from './apiClient'

export interface MarketingNotification {
  id: number
  title: string
  message: string
  notification_type: string
  is_read: boolean
  link: string
  metadata: Record<string, unknown>
  created_at: string
  event_type: string | null
  priority: string
  action: string
  entity_type: string
  entity_id: string
}

export interface NotificationPage {
  count: number
  items: MarketingNotification[]
}

export interface NotificationStats {
  unread_count: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNotification(value: unknown): MarketingNotification | null {
  if (!isRecord(value) || typeof value.id !== 'number') return null
  return {
    id: value.id,
    title: typeof value.title === 'string' ? value.title : 'Notification',
    message: typeof value.message === 'string' ? value.message : '',
    notification_type: typeof value.notification_type === 'string' ? value.notification_type : 'info',
    is_read: Boolean(value.is_read),
    link: typeof value.link === 'string' ? value.link : '',
    metadata: isRecord(value.metadata) ? value.metadata : {},
    created_at: typeof value.created_at === 'string' ? value.created_at : new Date().toISOString(),
    event_type: typeof value.event_type === 'string' ? value.event_type : null,
    priority: typeof value.priority === 'string' ? value.priority : 'normal',
    action: typeof value.action === 'string' ? value.action : '',
    entity_type: typeof value.entity_type === 'string' ? value.entity_type : '',
    entity_id:
      typeof value.entity_id === 'string' || typeof value.entity_id === 'number'
        ? String(value.entity_id)
        : '',
  }
}

export function resolveMarketingNotificationHref(
  notification: MarketingNotification,
): string | null {
  const metadata = isRecord(notification.metadata) ? notification.metadata : {}
  const entityType = (
    notification.entity_type ||
    (typeof metadata.entity_type === 'string' ? metadata.entity_type : '') ||
    (typeof metadata.notification_kind === 'string' ? metadata.notification_kind : '')
  ).toLowerCase()
  const entityId =
    notification.entity_id ||
    (typeof metadata.entity_id === 'string' || typeof metadata.entity_id === 'number'
      ? String(metadata.entity_id)
      : '') ||
    (typeof metadata.lead_id === 'string' || typeof metadata.lead_id === 'number'
      ? String(metadata.lead_id)
      : '')

  if ((entityType === 'lead' || entityType === 'lead_assignment') && /^\d+$/.test(entityId)) {
    return `/leads-detail?id=${entityId}`
  }

  if (!notification.link) return null
  try {
    const url = new URL(notification.link, window.location.origin)
    if (url.origin !== window.location.origin) return null

    if (
      url.pathname === '/leads-detail' ||
      url.pathname === '/marketing/leads-detail' ||
      url.pathname.startsWith('/leads-detail/') ||
      url.pathname.startsWith('/marketing/leads-detail/')
    ) {
      const id = url.searchParams.get('id') || entityId
      return id ? `/leads-detail?id=${id}` : '/leads-detail'
    }

    if (url.pathname.startsWith('/marketing/')) {
      const localPath = url.pathname.slice('/marketing'.length) || '/'
      return `${localPath}${url.search}${url.hash}`
    }

    if (url.pathname.startsWith('/')) {
      return `${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    return null
  }
  return null
}

export const notificationsApi = {
  async list(
    params: { limit?: number; offset?: number; isRead?: boolean } = {},
  ): Promise<ApiResponse<NotificationPage>> {
    const query = new URLSearchParams({
      limit: String(params.limit ?? 20),
      offset: String(params.offset ?? 0),
    })
    if (params.isRead !== undefined) query.set('is_read', String(params.isRead))
    const response = await apiRequest<unknown>(`/api/v1/notifications/?${query.toString()}`)
    if (response.error || !isRecord(response.data) || !Array.isArray(response.data.items)) {
      return { status: response.status, error: response.error || 'Could not load notifications.' }
    }
    const items = response.data.items
      .map(asNotification)
      .filter((item): item is MarketingNotification => Boolean(item))
    return {
      status: response.status,
      data: {
        count: typeof response.data.count === 'number' ? response.data.count : items.length,
        items,
      },
    }
  },

  async stats(): Promise<ApiResponse<NotificationStats>> {
    const response = await apiRequest<unknown>('/api/v1/notifications/stats')
    if (response.error || !isRecord(response.data)) {
      return {
        status: response.status,
        error: response.error || 'Could not load notification stats.',
      }
    }
    return {
      status: response.status,
      data: {
        unread_count:
          typeof response.data.unread_count === 'number' ? response.data.unread_count : 0,
      },
    }
  },

  markRead(notificationId: number) {
    return apiRequest(`/api/v1/notifications/${notificationId}/read`, { method: 'PATCH' })
  },

  markAllRead() {
    return apiRequest('/api/v1/notifications/read-all', { method: 'POST' })
  },
}
