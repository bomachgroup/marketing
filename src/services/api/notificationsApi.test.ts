import { describe, expect, it } from 'vitest'
import {
  resolveMarketingNotificationHref,
  type MarketingNotification,
} from './notificationsApi'

function notification(
  overrides: Partial<MarketingNotification> = {},
): MarketingNotification {
  return {
    id: 1,
    title: 'Lead assigned to you',
    message: 'Open the lead workspace to review it.',
    notification_type: 'info',
    is_read: false,
    link: '',
    metadata: {},
    created_at: '2026-11-16T12:00:00Z',
    event_type: null,
    priority: 'normal',
    action: 'open',
    entity_type: '',
    entity_id: '',
    ...overrides,
  }
}

describe('resolveMarketingNotificationHref', () => {
  it('prefers lead entity metadata', () => {
    expect(
      resolveMarketingNotificationHref(
        notification({
          entity_type: 'lead',
          entity_id: '7',
          link: '/marketing/campaigns',
        }),
      ),
    ).toBe('/leads-detail?id=7')
  })

  it('normalizes legacy and marketing lead links', () => {
    expect(
      resolveMarketingNotificationHref(
        notification({ link: '/leads-detail?id=12' }),
      ),
    ).toBe('/leads-detail?id=12')
    expect(
      resolveMarketingNotificationHref(
        notification({ link: '/marketing/leads-detail?id=12' }),
      ),
    ).toBe('/leads-detail?id=12')
  })

  it('maps other marketing workspace links to local routes', () => {
    expect(
      resolveMarketingNotificationHref(
        notification({ link: '/marketing/campaigns?campaign_id=4&tab=enquiries' }),
      ),
    ).toBe('/campaigns?campaign_id=4&tab=enquiries')
  })
})
