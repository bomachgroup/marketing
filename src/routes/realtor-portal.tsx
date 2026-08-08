import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const RealtorPortalPage = lazy(() => import('../components/screens/RealtorPortalPage').then(m => ({ default: m.RealtorPortalPage })))

export const Route = createFileRoute('/realtor-portal')({
  component: RealtorPortalPage,
})
