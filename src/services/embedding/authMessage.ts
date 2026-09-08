export const AUTH_READY_MESSAGE = Object.freeze({ type: "BOMACH_AUTH_READY" });

export type AuthTokenMessage = {
  type: "BOMACH_AUTH_TOKEN";
  token: string;
  refreshToken?: string;
  apiBaseUrl?: string;
  backendUrl?: string;
};

type MessageRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MessageRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parentOriginFromReferrer(referrer: string): string | null {
  try {
    const origin = new URL(referrer).origin;
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

export function sendAuthReady(parentWindow: Window, targetOrigin: string | null): void {
  parentWindow.postMessage(AUTH_READY_MESSAGE, targetOrigin || "*");
}

export function isTrustedAuthMessage(
  event: MessageEvent,
  parentWindow: Window,
  expectedOrigin: string,
): event is MessageEvent<AuthTokenMessage> {
  if (!expectedOrigin || event.origin !== expectedOrigin || event.source !== parentWindow) {
    return false;
  }
  if (!isRecord(event.data) || event.data.type !== "BOMACH_AUTH_TOKEN") {
    return false;
  }
  return typeof event.data.token === "string" && event.data.token.trim().length > 0;
}
