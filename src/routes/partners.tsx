import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const PartnersPage = lazy(() => import('../components/screens/PartnersPage').then(m => ({ default: m.PartnersPage })))

export const Route = createFileRoute('/partners')({
  component: PartnersPage,
})
