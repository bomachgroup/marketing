import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const AnalyticsPage = lazy(() => import('../components/screens/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
})
