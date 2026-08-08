import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const LeadControlPage = lazy(() => import('../components/screens/revenue/LeadControlPage').then(m => ({ default: m.LeadControlPage })))

export const Route = createFileRoute('/lead-control')({
  component: LeadControlPage,
})
