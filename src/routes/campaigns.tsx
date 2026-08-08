import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const CampaignsPage = lazy(() => import('../components/screens/campaigns/CampaignsPage').then(m => ({ default: m.CampaignsPage })))

export const Route = createFileRoute('/campaigns')({
  component: CampaignsPage,
})
