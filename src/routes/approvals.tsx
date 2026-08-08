import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const ApprovalsPage = lazy(() => import('../components/screens/ApprovalsPage').then(m => ({ default: m.ApprovalsPage })))

export const Route = createFileRoute('/approvals')({
  component: ApprovalsPage,
})
