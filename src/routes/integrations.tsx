import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const IntegrationsPage = lazy(() => import('../components/screens/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })))

export const Route = createFileRoute('/integrations')({
  component: IntegrationsPage,
})
