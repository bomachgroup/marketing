import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const RetentionPage = lazy(() => import('../components/screens/RetentionPage').then(m => ({ default: m.RetentionPage })))

export const Route = createFileRoute('/retention')({
  component: RetentionPage,
})
