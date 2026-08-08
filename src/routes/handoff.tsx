import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const HandoffPage = lazy(() => import('../components/screens/HandoffPage').then(m => ({ default: m.HandoffPage })))

export const Route = createFileRoute('/handoff')({
  component: HandoffPage,
})
