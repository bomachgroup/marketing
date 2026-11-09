import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearWorkspaceMemory,
  lastVisitedWorkspaceHref,
  rememberedWorkspaceHref,
  saveWorkspaceLocation,
  WORKSPACE_MEMORY_KEY,
} from './workspace-memory'

describe('shared workspace memory', () => {
  beforeEach(() => window.localStorage.clear())

  it('reads and writes OS, Services, and Marketing paths using the shared versioned format', () => {
    saveWorkspaceLocation('staff-4', 'os', '/hr/employees?status=active')
    saveWorkspaceLocation('staff-4', 'services', '/app/dashboard?tab=orders')
    saveWorkspaceLocation('staff-4', 'marketing', '/marketing/campaigns?tab=active')

    expect(lastVisitedWorkspaceHref('staff-4')).toBe('/marketing/campaigns?tab=active')
    expect(rememberedWorkspaceHref('staff-4', 'marketing')).toBe('/marketing/campaigns?tab=active')
    expect(rememberedWorkspaceHref('staff-4', 'services')).toBe('/services/app/dashboard?tab=orders')
    expect(rememberedWorkspaceHref('other-user', 'marketing')).toBeNull()
  })

  it('normalizes Marketing routes and filters sensitive query data', () => {
    saveWorkspaceLocation(8, 'marketing', '/campaigns?tab=active&search=private&token=secret')
    expect(rememberedWorkspaceHref(8, 'marketing')).toBe('/marketing/campaigns?tab=active')
  })

  it('rejects cross-app and unsafe destinations without replacing valid memory', () => {
    saveWorkspaceLocation(8, 'marketing', '/marketing/dashboard')
    saveWorkspaceLocation(8, 'marketing', '/services/app/dashboard')
    saveWorkspaceLocation(8, 'os', '//attacker.example/path')
    expect(rememberedWorkspaceHref(8, 'marketing')).toBe('/marketing/dashboard')
  })

  it('clears only the matching user memory on sign-out', () => {
    saveWorkspaceLocation(8, 'marketing', '/marketing/dashboard')
    clearWorkspaceMemory(9)
    expect(window.localStorage.getItem(WORKSPACE_MEMORY_KEY)).not.toBeNull()
    clearWorkspaceMemory(8)
    expect(window.localStorage.getItem(WORKSPACE_MEMORY_KEY)).toBeNull()
  })
})
