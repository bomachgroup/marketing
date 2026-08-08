import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const MediaRegisterPage = lazy(() => import('../components/screens/MediaRegisterPage').then(m => ({ default: m.MediaRegisterPage })))

export const Route = createFileRoute('/media-register')({
  component: MediaRegisterPage,
})
