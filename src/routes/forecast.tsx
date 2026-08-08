import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const ForecastPage = lazy(() => import('../components/screens/ForecastPage').then(m => ({ default: m.ForecastPage })))

export const Route = createFileRoute('/forecast')({
  component: ForecastPage,
})
