import { ROLES } from './data/defaults'
import type { NavGroup } from './data/types'

export const SCREEN_TITLES: Record<string, string> = {
  dashboard: 'Command centre',
  pipeline: 'CRM pipeline',
  calendar: 'Content calendar',
  campaigns: 'Campaign operating system',
  analytics: 'Analytics & reports',
  okrs: 'OKRs & targets',
  whatsapp: 'WhatsApp manager',
  partners: 'Partners & media',
  design: 'Design task board',
  support: 'Customer support',
  'new-lead': 'Register new lead',
  'team-directory': 'Team directory',
  media: 'Media library',
  'revenue-command': 'Revenue recovery command',
  'daily-execution': 'Daily execution center',
  'lead-control': 'Lead control tower',
  'funnel-audit': 'Funnel leak audit',
  playbooks: 'Sales playbooks',
  'content-studio': 'Content revenue studio',
  coaching: 'Sales coaching & enablement',
  forecast: 'Revenue forecast',
  retention: 'Retention & referrals',
  compliance: 'Marketing compliance',
  turnaround: '13-week turnaround plan',
  workdesk: 'My work desk',
  'lead-journal': 'Lead 360 journal',
  integrations: 'Channel integrations',
  'email-center': 'Email marketing',
  'media-register': 'Traditional media register',
  'realtor-portal': 'External realtor network',
  'partner-portal': 'Partner work portal',
  handoff: 'Sales & allocation handoff',
  'role-governance': 'Role framework & permissions',
  approvals: 'Approval center',
  'audit-log': 'Activity & audit log',
  'marketing-meetings': 'Marketing meetings & decisions',
  'leads-detail': 'Lead detail',
}

export function screenPath(screen: string): string {
  return '/' + screen
}

export function roleFirstScreen(roleKey: string): string {
  return ROLES[roleKey]?.nav[0]?.items[0]?.s ?? 'dashboard'
}

function allRoleNavGroups(): NavGroup[] {
  return Object.values(ROLES).flatMap((role) => role.nav)
}

export function accessibleNavGroups(
  _roleKey: string,
  _permissions: Record<string, string[]>,
  hasPermission: (resource: string, action?: string) => boolean,
): NavGroup[] {
  const sourceGroups = allRoleNavGroups()
  const seenScreens = new Set<string>()
  const groups: NavGroup[] = []

  sourceGroups.forEach((group) => {
    const items = group.items.filter((item) => {
      if (item.s === 'integrations') return false
      if (seenScreens.has(item.s)) return false
      if (!hasPermission(item.s, 'view')) return false
      seenScreens.add(item.s)
      return true
    })

    if (items.length > 0) {
      groups.push({ ...group, items })
    }
  })

  return groups
}

export function firstAccessibleScreen(
  roleKey: string,
  permissions: Record<string, string[]>,
  hasPermission: (resource: string, action?: string) => boolean,
): string {
  return accessibleNavGroups(roleKey, permissions, hasPermission)[0]?.items[0]?.s || roleFirstScreen(roleKey)
}

export function screenTitleFromPath(pathname: string): string {
  const seg = pathname.replace(/^\//, '')
  return SCREEN_TITLES[seg] ?? seg
}
