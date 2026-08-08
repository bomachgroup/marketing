import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const OkrsPage = lazy(() => import('../components/screens/OkrsPage').then(m => ({ default: m.OkrsPage })))

export const Route = createFileRoute('/okrs')({
  component: OkrsPage,
})
