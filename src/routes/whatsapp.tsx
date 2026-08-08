import { createFileRoute } from '@tanstack/react-router'
import { lazy } from 'react'

const WhatsAppPage = lazy(() => import('../components/screens/WhatsAppPage').then(m => ({ default: m.WhatsAppPage })))

export const Route = createFileRoute('/whatsapp')({
  component: WhatsAppPage,
})
