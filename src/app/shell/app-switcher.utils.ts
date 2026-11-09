import { accessibleNavGroups } from '../../navigation'
import type { UserProfile } from '../../services/api/authService'

export type WorkspaceAppId = 'os' | 'services' | 'marketing'

export interface WorkspaceApp {
  id: WorkspaceAppId
  label: string
  description: string
  href: string
}

export const MARKETING_APP_ACCESS_ANY_OF = [
  'dashboard.view', 'dashboard.list', 'marketing_dashboard.view', 'marketing_dashboard.list',
  'stats.view', 'stats.list', 'employees.view', 'employees.list',
  'role_daily_routines.view', 'role_daily_routines.list', 'target_reports.view', 'target_reports.list',
  'leads.view', 'leads.list', 'deals.view', 'deals.list', 'followups.view', 'followups.list',
  'content.view', 'content.list', 'marketing_campaigns.view', 'marketing_campaigns.list',
  'analytics.view', 'analytics.list', 'marketing_analytics.view', 'marketing_analytics.list',
  'revenue_execution.view', 'revenue_execution.list', 'employee_targets.view', 'employee_targets.list',
  'role_kpis.view', 'role_kpis.list', 'kpis.view', 'kpis.list', 'partners.view', 'partners.list',
  'service_requests.view', 'service_requests.list', 'media_library.view', 'media_library.list',
  'approval_requests.view', 'approval_requests.list', 'approval_flows.view', 'approval_flows.list',
  'meetings.view', 'meetings.list', 'training_programs.view', 'training_programs.list',
  'role_sops.view', 'role_sops.list', 'role_success_playbook.view', 'role_success_playbook.list',
] as const

export const SERVICES_APP_ACCESS_ANY_OF = [
  'command_center.view', 'services.list', 'service_pricing_configs.list', 'service_request_forms.list',
  'service_workflows.list', 'service_branch_activations.list', 'service_requests.list', 'quotes.list',
  'service_invoices.list', 'dashboard.view', 'orders.list', 'orders.view', 'estates.list',
  'feedback.list', 'reports.view',
] as const

export const WORKSPACE_APPS: readonly WorkspaceApp[] = [
  { id: 'os', label: 'Bomach OS', description: 'People and company operations', href: '/dashboard' },
  { id: 'services', label: 'Services', description: 'Service delivery and commercial operations', href: '/services/' },
  { id: 'marketing', label: 'Marketing', description: 'Campaigns, pipeline, and revenue execution', href: '/marketing/dashboard' },
]

function hasAnyGrant(user: UserProfile | null, grants: readonly string[]): boolean {
  return grants.some((grant) => {
    const separator = grant.lastIndexOf('.')
    return separator > 0 && user?.permissions?.[grant.slice(0, separator)]?.includes(grant.slice(separator + 1))
  })
}

export function getAvailableApps(
  user: UserProfile | null,
  currentRole: string,
  hasPermission: (resource: string, action?: string) => boolean,
): WorkspaceApp[] {
  const hasMarketingDestination = accessibleNavGroups(currentRole, user?.permissions || {}, hasPermission).length > 0
  return WORKSPACE_APPS.filter((app) =>
    app.id === 'os' ||
    (app.id === 'services' && hasAnyGrant(user, SERVICES_APP_ACCESS_ANY_OF)) ||
    (app.id === 'marketing' && hasMarketingDestination),
  )
}
