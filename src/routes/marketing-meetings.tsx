import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const MarketingMeetingsPage = lazy(() => import('../components/screens/MarketingMeetingsPage').then(m => ({ default: m.MarketingMeetingsPage })))

export const Route = createFileRoute('/marketing-meetings')({
  component: MarketingMeetingsPage,
})
