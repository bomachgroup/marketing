import { Suspense, useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { useAuth } from "../../context/AuthContext";
import { ShellProvider } from "../../context/ShellContext";
import { DISABLED_SCREENS, normalizeMarketingPathname, screenTitleFromPath } from "../../navigation";
import Sidebar from "./Sidebar";
import {
  SkeletonCard,
  SkeletonKpiGrid,
  SkeletonList,
} from "../shared/Skeletons";
import { ShellTopbar } from "../shared/Topbar";
import NoPermissionPage from "./NoPermissionPage";
import { SESSION_EXPIRED_EVENT } from "../../services/api/apiClient";
import { sharedLoginHref } from "../../shared-host";
import { saveWorkspaceLocation } from "../../shared/auth/workspace-memory";

function AppRouteSkeleton() {
  return (
    <div className="min-h-full space-y-4 bg-white p-3 sm:p-5">
      <SkeletonKpiGrid cards={4} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SkeletonList rows={5} avatar />
        <SkeletonCard lines={6} />
      </div>
      <SkeletonCard lines={4} />
    </div>
  );
}

function AuthSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="h-2.5 w-40 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { user, isLoggedIn, isLoading, authError, hasPermission, getFirstAccessibleScreen, retrySession } =
    useAuth();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const currentScreen = normalizeMarketingPathname(location.pathname).replace(/^\//, "") || "dashboard";
  const isDisabledScreen = DISABLED_SCREENS.has(currentScreen);
  const canAccess = hasPermission(currentScreen, "view");

  useEffect(() => {
    if (!isLoggedIn) {
      document.title = "Marketing - Bomach OS";
      return;
    }
    document.title = screenTitleFromPath(location.pathname);
  }, [location.pathname, isLoggedIn]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn && !authError) {
      window.location.replace(sharedLoginHref());
    }
  }, [authError, isLoading, isLoggedIn]);

  useEffect(() => {
    if (!user || !isLoggedIn) return;
    const actualPath = window.location.pathname.startsWith("/marketing")
      ? window.location.pathname
      : `/marketing${window.location.pathname}`;
    saveWorkspaceLocation(user.id, "marketing", `${actualPath}${window.location.search}${window.location.hash}`);
  }, [isLoggedIn, location.href, user]);

  useEffect(() => {
    const expireSession = () => window.location.assign(sharedLoginHref());
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession);
  }, []);

  if (isLoading) {
    return <AuthSkeleton />;
  }

  if (!isLoggedIn && authError) {
    return (
      <div role="alert" className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Can’t verify your session</h1>
          <p className="text-sm text-slate-600">{authError}</p>
          <button type="button" onClick={retrySession} className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">Try again</button>
        </div>
      </div>
    );
  }

  if (isDisabledScreen) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ShellProvider>
      <div className="flex h-dvh min-h-screen w-full overflow-hidden bg-bg">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ShellTopbar fallbackTitle={screenTitleFromPath(location.pathname)} />
          <main
            ref={mainRef}
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
          >
            {!canAccess ? (
              getFirstAccessibleScreen() !== currentScreen &&
              hasPermission(getFirstAccessibleScreen(), "view") ? (
                <Navigate to={`/${getFirstAccessibleScreen()}` as never} replace />
              ) : (
                <NoPermissionPage screen={currentScreen} />
              )
            ) : (
              <Suspense fallback={<AppRouteSkeleton />}>
                <Outlet />
              </Suspense>
            )}
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
