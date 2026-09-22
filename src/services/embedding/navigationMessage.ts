export const FLUTTER_NEW_LEAD_ROUTE_MESSAGE =
  "BOMACH_NAVIGATE_MARKETING_NEW_LEAD";

export function requestFlutterNewLeadRoute(
  pathname: string,
  parentWindow: Window,
  parentOrigin: string | null,
): boolean {
  if (pathname !== "/new-lead" || !parentOrigin || parentOrigin === "null") {
    return false;
  }

  let targetOrigin: string;
  try {
    const parsedOrigin = new URL(parentOrigin);
    if (parsedOrigin.origin !== parentOrigin) return false;
    targetOrigin = parsedOrigin.origin;
  } catch {
    return false;
  }

  parentWindow.postMessage(FLUTTER_NEW_LEAD_ROUTE_MESSAGE, targetOrigin);
  return true;
}
