import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const MediaLibraryPage = lazy(() => import('../components/screens/media/MediaLibraryPage').then(m => ({ default: m.MediaLibraryPage })))

export const Route = createFileRoute('/media')({
  component: MediaLibraryPage,
})
