import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { useAuth } from '../../context/AuthContext'
import { ShellProvider } from '../../context/ShellContext'
import { screenTitleFromPath } from '../../navigation'
import LoginScreen from './LoginScreen'
import Sidebar from './Sidebar'
import { SkeletonCard, SkeletonKpiGrid, SkeletonList } from '../shared/Skeletons'
import { ShellTopbar } from '../shared/Topbar'

import NoPermissionPage from './NoPermissionPage'

function AppRouteSkeleton() {
  return (
    <div className="min-h-full space-y-4 p-3 sm:p-5">
      <SkeletonKpiGrid cards={4} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SkeletonList rows={5} avatar />
        <SkeletonCard lines={6} />
      </div>
      <SkeletonCard lines={4} />
    </div>
  )
}

function AuthSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0F1D3A] p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-white/15" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/20" />
            <div className="h-2.5 w-40 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="h-10 animate-pulse rounded-xl bg-white/10" />
          <div className="h-10 animate-pulse rounded-xl bg-white/10" />
          <div className="h-10 animate-pulse rounded-xl bg-white/20" />
        </div>
      </div>
    </div>
  )
}

export default function AppShell() {
  const { isLoggedIn, isLoading, hasPermission } = useAuth()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const currentScreen = location.pathname.replace(/^\//, '') || 'dashboard'
  const canAccess = hasPermission(currentScreen, 'view')

  useEffect(() => {
    if (!isLoggedIn) {
      document.title = 'Sign in - Bomach OS'
      return
    }
    document.title = screenTitleFromPath(location.pathname)
  }, [location.pathname, isLoggedIn])

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
    window.scrollTo(0, 0)
  }, [location.pathname])

  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const isEmbed = searchParams.get('embed') === 'true' || searchParams.get('embedded') === 'true' || Boolean(searchParams.get('token')) || Boolean(searchParams.get('access_token'))
  const hideSidebar = isEmbed || searchParams.get('hideSidebar') === 'true' || searchParams.get('hide_sidebar') === 'true'
  const hideTopbar = searchParams.get('hideTopbar') === 'true' || searchParams.get('hide_topbar') === 'true'

  if (isLoading) {
    return <AuthSkeleton />
  }

  if (!isLoggedIn) {
    return <LoginScreen />
  }

  return (
    <ShellProvider>
      <div className="flex h-dvh min-h-screen w-full overflow-hidden bg-bg">
        {!hideSidebar && <Sidebar />}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {!hideTopbar && <ShellTopbar fallbackTitle={screenTitleFromPath(location.pathname)} />}
          <main ref={mainRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            {!canAccess ? (
              <NoPermissionPage screen={currentScreen} />
            ) : (
              <Suspense
                fallback={<AppRouteSkeleton />}
              >
                <Outlet />
              </Suspense>
            )}
          </main>
        </div>
      </div>
    </ShellProvider>
  )
}
