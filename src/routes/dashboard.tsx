import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const DashboardPage = lazy(() => import('../components/screens/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})
