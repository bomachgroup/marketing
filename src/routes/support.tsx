import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const SupportPage = lazy(() => import('../components/screens/support/SupportPage').then(m => ({ default: m.SupportPage })))

export const Route = createFileRoute('/support')({
  component: SupportPage,
})
