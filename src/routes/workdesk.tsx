import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const WorkdeskPage = lazy(() => import('../components/screens/WorkdeskPage').then(m => ({ default: m.WorkdeskPage })))

export const Route = createFileRoute('/workdesk')({
  component: WorkdeskPage,
})
