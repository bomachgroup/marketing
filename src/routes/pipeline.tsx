import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const PipelinePage = lazy(() => import('../components/screens/pipeline/PipelinePage').then(m => ({ default: m.PipelinePage })))

export const Route = createFileRoute('/pipeline')({
  component: PipelinePage,
})
