import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const EmailCenterPage = lazy(() => import('../components/screens/EmailCenterPage').then(m => ({ default: m.EmailCenterPage })))

export const Route = createFileRoute('/email-center')({
  component: EmailCenterPage,
})
