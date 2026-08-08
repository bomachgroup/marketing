import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const AuditLogPage = lazy(() => import('../components/screens/AuditLogPage').then(m => ({ default: m.AuditLogPage })))

export const Route = createFileRoute('/audit-log')({
  component: AuditLogPage,
})
