import { describe, expect, it } from 'vitest'
import { canAccessWithPermissions } from '../../context/AuthContext'
import { getAvailableApps } from './app-switcher.utils'

function appsFor(permissions: Record<string, string[]>) {
  const user = {
    id: 15,
    email: 'staff@example.com',
    username: 'staff',
    is_verified: true,
    created_at: '',
    permissions,
  }
  return getAvailableApps(user, 'staff', (resource, action = 'view') =>
    canAccessWithPermissions(resource, action, 'staff', permissions),
  ).map((app) => app.id)
}

describe('workspace switcher access', () => {
  it('offers Marketing when a real Marketing top-level destination is permitted', () => {
    expect(appsFor({ marketing_campaigns: ['list'] })).toEqual(['os', 'marketing'])
  })

  it('does not offer Marketing for an unrelated permission map', () => {
    expect(appsFor({ hr_employees: ['list'], inventory: ['view'] })).toEqual(['os'])
  })
})
