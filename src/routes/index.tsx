import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext'

function RootIndex() {
  const { isLoggedIn, getFirstAccessibleScreen } = useAuth()
  if (!isLoggedIn) return <Navigate to="/dashboard" replace />
  return <Navigate to={`/${getFirstAccessibleScreen()}` as never} replace />
}

export const Route = createFileRoute('/')({
  component: RootIndex,
})
