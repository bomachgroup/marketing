import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const CompliancePage = lazy(() => import('../components/screens/CompliancePage').then(m => ({ default: m.CompliancePage })))

export const Route = createFileRoute('/compliance')({
  component: CompliancePage,
})
