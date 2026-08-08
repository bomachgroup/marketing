import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const CalendarPage = lazy(() => import('../components/screens/CalendarPage').then(m => ({ default: m.CalendarPage })))

export const Route = createFileRoute('/calendar')({
  component: CalendarPage,
})
