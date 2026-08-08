import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppIcon } from '../shared/AppIcon'
import { useAuth } from '../../context/AuthContext'
import { screenTitleFromPath } from '../../navigation'

export default function NoPermissionPage({ screen }: { screen: string }) {
  const navigate = useNavigate()
  const { userRole, currentRole, employeeDetails, getFirstAccessibleScreen, hasPermission, denyScreenAccess } = useAuth()
  const roleDisplay =
    employeeDetails?.role_name ||
    employeeDetails?.designation ||
    userRole?.name ||
    employeeDetails?.position ||
    currentRole.toUpperCase()
  const pageTitle = screenTitleFromPath(screen)
  const firstAllowedScreen = getFirstAccessibleScreen()
  const firstAllowedTitle = screenTitleFromPath(firstAllowedScreen)
  const canOpenFirstAllowed = firstAllowedScreen !== screen && hasPermission(firstAllowedScreen, 'view')
  const canOpenDashboard = hasPermission('dashboard', 'view')

  useEffect(() => {
    const timer = window.setTimeout(() => denyScreenAccess(screen), 0)
    return () => window.clearTimeout(timer)
  }, [denyScreenAccess, screen])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 bg-bg">
      <div className="flex max-w-lg flex-col items-center text-center rounded-2xl border border-red-200/80 bg-surface p-8 shadow-lg space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-600 shadow-sm">
          <AppIcon name="shield-alert" size={32} />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100/70 px-3 py-1 text-xs font-bold text-red-800">
            HTTP 403 • Access Restricted
          </span>
          <h2 className="text-2xl font-bold text-text">No Permission to View Page</h2>
          <p className="text-sm text-text-3">
            You do not have permission to view the <strong className="text-text">{pageTitle}</strong> page (<code className="text-xs bg-surface-1 px-1.5 py-0.5 rounded text-navy font-mono">/{screen}</code>).
          </p>
        </div>

        <div className="w-full rounded-xl border border-border/80 bg-surface-1 p-4 text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-text-3">
            <span>Your Active Role:</span>
            <span className="font-semibold text-text">{roleDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-text-3">
            <span>Required Resource:</span>
            <span className="font-mono text-xs text-navy font-semibold">{screen}:view</span>
          </div>
          <div className="flex items-center justify-between text-text-3">
            <span>Access Policy:</span>
            <span className="text-red-600 font-medium">Denied by Role Governance</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {canOpenFirstAllowed ? (
            <button
              type="button"
              onClick={() => navigate({ to: `/${firstAllowedScreen}` as never })}
              className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-navy-dark transition-all active:scale-95 cursor-pointer"
            >
              <AppIcon name="desk" size={16} /> Go to {firstAllowedTitle}
            </button>
          ) : (
            <span className="rounded-xl border border-border bg-surface-1 px-4 py-2.5 text-xs font-semibold text-text-3">
              No permitted destination available
            </span>
          )}
          {canOpenDashboard && firstAllowedScreen !== 'dashboard' ? (
            <button
              type="button"
              onClick={() => navigate({ to: '/dashboard' })}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-text hover:bg-surface-1 transition-all active:scale-95 cursor-pointer"
            >
              <AppIcon name="dashboard" size={16} /> Command Centre
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
