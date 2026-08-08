import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const TeamDirectoryPage = lazy(() => import('../components/screens/team-directory/TeamDirectoryPage').then(m => ({ default: m.TeamDirectoryPage })))

export const Route = createFileRoute('/team-directory')({
  component: TeamDirectoryPage,
})
