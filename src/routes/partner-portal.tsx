import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const PartnerPortalPage = lazy(() => import('../components/screens/PartnerPortalPage').then(m => ({ default: m.PartnerPortalPage })))

export const Route = createFileRoute('/partner-portal')({
  component: PartnerPortalPage,
})
