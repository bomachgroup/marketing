import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const LeadJournalPage = lazy(() => import('../components/screens/LeadJournalPage').then(m => ({ default: m.LeadJournalPage })))

export const Route = createFileRoute('/lead-journal')({
  component: LeadJournalPage,
})
