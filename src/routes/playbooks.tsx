import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const PlaybooksPage = lazy(() => import('../components/screens/PlaybooksPage').then(m => ({ default: m.PlaybooksPage })))

export const Route = createFileRoute('/playbooks')({
  component: PlaybooksPage,
})
