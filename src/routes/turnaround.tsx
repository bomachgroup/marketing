import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const TurnaroundPage = lazy(() => import('../components/screens/TurnaroundPage').then(m => ({ default: m.TurnaroundPage })))

export const Route = createFileRoute('/turnaround')({
  component: TurnaroundPage,
})
