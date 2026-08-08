import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const RevenueCommandPage = lazy(() => import('../components/screens/revenue/RevenueCommandPage').then(m => ({ default: m.RevenueCommandPage })))

export const Route = createFileRoute('/revenue-command')({
  component: RevenueCommandPage,
})
