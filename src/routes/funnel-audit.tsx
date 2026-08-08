import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const FunnelAuditPage = lazy(() => import('../components/screens/revenue/FunnelAuditPage').then(m => ({ default: m.FunnelAuditPage })))

export const Route = createFileRoute('/funnel-audit')({
  component: FunnelAuditPage,
})
