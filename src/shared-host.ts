const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const LOCAL_OS_ORIGIN = import.meta.env.VITE_BOMACH_OS_ORIGIN;

export function canonicalMarketingPath(pathname: string): string {
  if (pathname === "/" || pathname === "/marketing") return "/marketing/";
  if (pathname.startsWith("/marketing/")) return pathname;
  return `/marketing${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function getSharedOsOrigin(): string {
  if (LOCAL_OS_ORIGIN) return new URL(LOCAL_OS_ORIGIN).origin;
  if (import.meta.env.DEV && LOCAL_HOSTS.has(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:5173`;
  }
  return window.location.origin;
}

export function currentMarketingReturnPath(): string {
  const { pathname, search, hash } = window.location;
  return `${canonicalMarketingPath(pathname)}${search}${hash}`;
}

export function sharedLoginHref(): string {
  const target = currentMarketingReturnPath();
  const login = new URL("/login", getSharedOsOrigin());
  login.searchParams.set("returnTo", target);
  return login.toString();
}
