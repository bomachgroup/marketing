import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const RoleGovernancePage = lazy(() => import('../components/screens/RoleGovernancePage').then(m => ({ default: m.RoleGovernancePage })))

export const Route = createFileRoute('/role-governance')({
  component: RoleGovernancePage,
})
