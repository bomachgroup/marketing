import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const CoachingPage = lazy(() => import('../components/screens/CoachingPage').then(m => ({ default: m.CoachingPage })))

export const Route = createFileRoute('/coaching')({
  component: CoachingPage,
})
