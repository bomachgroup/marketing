import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const ContentStudioPage = lazy(() => import('../components/screens/ContentStudioPage').then(m => ({ default: m.ContentStudioPage })))

export const Route = createFileRoute('/content-studio')({
  component: ContentStudioPage,
})
