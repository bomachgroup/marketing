import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const DailyExecutionPage = lazy(() => import('../components/screens/revenue/DailyExecutionPage').then(m => ({ default: m.DailyExecutionPage })))

export const Route = createFileRoute('/daily-execution')({
  component: DailyExecutionPage,
})
