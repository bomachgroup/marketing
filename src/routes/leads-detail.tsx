import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const LeadsDetailPage = lazy(() => import('../components/screens/LeadsDetailPage').then(m => ({ default: m.LeadsDetailPage })))

export const Route = createFileRoute('/leads-detail')({
  component: LeadsDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || '',
  }),
})
