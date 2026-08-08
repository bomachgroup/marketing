import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const DesignPage = lazy(() => import('../components/screens/design/DesignPage').then(m => ({ default: m.DesignPage })))

export const Route = createFileRoute('/design')({
  component: DesignPage,
})
