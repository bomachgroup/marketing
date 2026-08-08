import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const NewLeadPage = lazy(() => import('../components/screens/new-lead/NewLeadPage').then(m => ({ default: m.NewLeadPage })))

export const Route = createFileRoute('/new-lead')({
  component: NewLeadPage,
})
